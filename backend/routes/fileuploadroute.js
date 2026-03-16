// routes/fileuploadroute.js
const express   = require("express");
const router    = express.Router();
const path      = require("path");
const fs        = require("fs");
const ffmpegPath = require('ffmpeg-static');
const ffmpeg    = require("fluent-ffmpeg");
const axios     = require("axios");

ffmpeg.setFfmpegPath(ffmpegPath);

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

    const { userId } = req.user;
    const inputPath = path.resolve(req.file.path);
    const outputPath = inputPath.replace(path.extname(inputPath), "_converted.wav");

    // 1. Respond immediately to prevent Render 502 timeout
    res.status(202).json({ message: "Processing started" });

    // 2. Run heavy logic in the background
    (async () => {
      try {
        // Step A: Convert to DeepSpeech-compatible WAV
        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .outputOptions(["-ar 16000", "-ac 1", "-c:a pcm_s16le"])
            .on("error", reject)
            .on("end", resolve)
            .save(outputPath);
        });

        // Step B: Upload the CONVERTED file to Convex Storage
        const uploadUrl = await convex.mutation(api.audioFiles.generateUploadUrl);
        const fileStream = fs.createReadStream(outputPath);

        const storageRes = await axios.post(uploadUrl, fileStream, {
          headers: { "Content-Type": "audio/wav" },
        });
        const storageId = storageRes.data.storageId;

        // Step C: Get the Public URL for the Microservice
        // Ensure you have a 'getUrl' query in your Convex audioFiles file
        const publicUrl = await convex.query(api.audioFiles.getUrl, { storageId });

        // Step D: Call STT microservice with the URL
        const sttResponse = await axios.post("https://speech-to-text-converter-hez1.onrender.com/process", {
          fileUrl: publicUrl, // Sending URL instead of local path
        }, { timeout: 60000 }); // 60s timeout for DeepSpeech processing

        const transcriptionText = sttResponse.data.text;

        // Step E: Save metadata and transcription to Convex
        const audioFileId = await convex.mutation(api.audioFiles.create, {
          userId,
          storageId,
          filename: req.file.originalname,
          mimeType: "audio/wav",
          sizeBytes: fs.statSync(outputPath).size,
        });

        await convex.mutation(api.transcripts.create, {
          userId,
          audioFileId,
          text: transcriptionText,
        });

        console.log("✅ Transcription Complete:", transcriptionText);
        res.status(500).json({ transcription: transcriptionText });

      } catch (bgError) {
        console.error("Background Processing Error:", bgError.message);
      } finally {
        // Step F: Cleanup local temp files
        if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
        if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});
      }
    })();

  } catch (error) {
    console.error("[/file/upload] Initial Error:", error.message);
    return res.status(500).json({ error: "Failed to initiate process" });
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