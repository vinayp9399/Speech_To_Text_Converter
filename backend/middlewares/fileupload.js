// middlewares/fileupload.js
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Use resolve to get an absolute, unambiguous path
const uploadDir = path.resolve(__dirname, '..', 'uploads');

// Ensure uploads directory exists on server start
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📂 Uploads directory initialized at:", uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Adding the original extension is vital for FFmpeg to identify the source codec
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Broader check: allow if it's audio OR if it's a webm/blob (common for recording apps)
  const isAudio = file.mimetype.startsWith('audio/');
  const isWebm = file.originalname.endsWith('.webm') || file.mimetype.includes('octet-stream');
  
  if (isAudio || isWebm) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload an audio file.'), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // Reduced to 20MB for Render Free Tier stability
});