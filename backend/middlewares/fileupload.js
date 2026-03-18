const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const uploadDir = path.resolve(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
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
  limits: { fileSize: 20 * 1024 * 1024 },
});