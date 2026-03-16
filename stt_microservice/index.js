// 1. POLYFILL: Must be at the very top for Node v14 compatibility
// if (!Object.hasOwn) {
//     Object.hasOwn = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
// }

const express = require('express');
const fs = require('fs');
const path = require('path');
const DeepSpeech = require('deepspeech');

const app = express();
app.use(express.json());

// 2. PATH SETUP: Use absolute paths to avoid "Path Not Found" errors
const modelPath = path.join(__dirname, 'models', 'deepspeech-0.9.3-models.pbmm');
const scorerPath = path.join(__dirname, 'models', 'deepspeech-0.9.3-models.scorer');

console.log("Loading model from:", modelPath);

// 3. INITIALIZE DEEPSPEECH
let model;
try {
    model = new DeepSpeech.Model(modelPath);
    model.enableExternalScorer(scorerPath);
    console.log("✅ DeepSpeech Model & Scorer Loaded Successfully");
} catch (error) {
    console.error("❌ Model Loading Failed. Check if files exist in /models folder.");
    console.error(error);
    process.exit(1); // Stop if model fails to load
}

app.post('/process', (req, res) => {
    const { filePath } = req.body;

    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Audio file not found at: " + filePath });
    }

    try {
        const buffer = fs.readFileSync(filePath);
        
        // Skip the 44-byte WAV header to get raw 16-bit PCM data
        const audioBuffer = buffer.slice(44); 

        const result = model.stt(audioBuffer);
        res.json({ text: result });
    } catch (err) {
        console.error("STT Error:", err);
        res.status(500).json({ error: "Speech-to-text processing failed" });
    }
});

const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 STT Microservice active on port ${PORT}`));