// routes/fileuploadroute.js
const express   = require("express");
const router    = express.Router();
const path      = require("path");
const fs        = require("fs");
const ffmpeg    = require("fluent-ffmpeg");
const axios     = require("axios");

const fileupload          = require("../middlewares/fileupload");
const { requireAuth }     = require("../middlewares/requireAuth");
const { convex }          = require("../lib/convexClient");
const { api }             = require("../convex/_generated/api");

// ── POST /file/upload ──────────────────────────────────────────────────────
// Protected: requires a valid Bearer JWT
router.post("/upload", requireAuth, fileupload.single("myfile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { userId } = req.user; // injected by requireAuth middleware
    const inputPath   = path.resolve(req.file.path);
    const outputPath  = inputPath.replace(path.extname(inputPath), "_converted.wav");

    // ── Step 1: Convert to DeepSpeech-compatible WAV ──────────────────────
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(["-ar 16000", "-ac 1", "-c:a pcm_s16le"])
        .on("error", reject)
        .on("end",   resolve)
        .save(outputPath);
    });

    // ── Step 2: Call STT microservice ──────────────────────────────────────
    const sttResponse = await axios.post("http://localhost:5001/process", {
      filePath: outputPath,
    });
    const transcriptionText = sttResponse.data.text;

    // ── Step 3: Upload original file bytes to Convex File Storage ─────────
    const fileBuffer = fs.readFileSync(inputPath);
    const uploadUrl  = await convex.mutation(api.audioFiles.generateUploadUrl);

    const storageRes = await axios.post(uploadUrl, fileBuffer, {
      headers: { "Content-Type": req.file.mimetype },
      maxBodyLength: Infinity,
    });
    const storageId = storageRes.data.storageId;

    // ── Step 4: Save audio file metadata to Convex ─────────────────────────
    const audioFileId = await convex.mutation(api.audioFiles.create, {
      userId,
      storageId,
      filename:  req.file.originalname,
      mimeType:  req.file.mimetype,
      sizeBytes: req.file.size,
    });

    // ── Step 5: Save transcript to Convex ─────────────────────────────────
    const transcriptId = await convex.mutation(api.transcripts.create, {
      userId,
      audioFileId,
      text: transcriptionText,
    });

    // ── Step 6: Cleanup temp files ─────────────────────────────────────────
    fs.unlink(inputPath,  () => {});
    fs.unlink(outputPath, () => {});

    return res.json({ transcription: transcriptionText, audioFileId, transcriptId });

  } catch (error) {
    if (req.file) fs.unlink(path.resolve(req.file.path), () => {});
    console.error("[/file/upload]", error.message);
    return res.status(500).json({ error: "Failed to process audio" });
  }
});

// ── GET /file/history ──────────────────────────────────────────────────────
// Returns all audio files + their transcripts for the logged-in user
router.get("/history", requireAuth, async (req, res) => {
  try {
    const { userId } = req.user;

    const [audioFiles, transcripts] = await Promise.all([
      convex.query(api.audioFiles.listByUser, { userId }),
      convex.query(api.transcripts.listByUser, { userId }),
    ]);

    // Zip transcripts into their parent audio file objects
    const transcriptMap = Object.fromEntries(
      transcripts.map((t) => [t.audioFileId, t])
    );
    const history = audioFiles.map((file) => ({
      ...file,
      transcript: transcriptMap[file._id] || null,
    }));

    return res.json({ history });
  } catch (error) {
    console.error("[/file/history]", error);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ── DELETE /file/:audioFileId ──────────────────────────────────────────────
// Deletes a file record and its linked transcript (ownership enforced in Convex)
router.delete("/:audioFileId", requireAuth, async (req, res) => {
  try {
    const { userId }      = req.user;
    const { audioFileId } = req.params;

    const transcript = await convex.query(api.transcripts.getByAudioFile, { audioFileId });
    if (transcript) {
      await convex.mutation(api.transcripts.remove, { transcriptId: transcript._id, userId });
    }
    await convex.mutation(api.audioFiles.remove, { audioFileId, userId });

    return res.json({ success: true });
  } catch (error) {
    if (error.message === "FORBIDDEN") return res.status(403).json({ error: "You don't own this file" });
    if (error.message === "NOT_FOUND")  return res.status(404).json({ error: "File not found" });
    console.error("[DELETE /file/:id]", error);
    return res.status(500).json({ error: "Failed to delete file" });
  }
});

module.exports = router;