const express = require('express');
const fs = require('fs');
const path = require('path');
const DeepSpeech = require('deepspeech');
const axios = require('axios'); // Add axios for downloading

const app = express();
app.use(express.json());

const modelPath = path.join(__dirname, 'models', 'deepspeech-0.9.3-models.pbmm');
const scorerPath = path.join(__dirname, 'models', 'deepspeech-0.9.3-models.scorer');

let model;
try {
    model = new DeepSpeech.Model(modelPath);
    model.enableExternalScorer(scorerPath);
    console.log("✅ DeepSpeech Model & Scorer Loaded Successfully");
} catch (error) {
    console.error("❌ Model Loading Failed. Ensure models are in the /models folder.");
    process.exit(1); 
}

// Fixed Route: Accept a URL instead of a local Path
app.post('/process', async (req, res) => {
    const { fileUrl } = req.body; 

    if (!fileUrl) {
        return res.status(400).json({ error: "No fileUrl provided" });
    }

    try {
        // Download the audio from Convex directly into memory
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        // Skip the 44-byte WAV header for raw 16-bit PCM
        const audioBuffer = buffer.slice(44); 

        const result = model.stt(audioBuffer);
        res.json({ text: result });
    } catch (err) {
        console.error("STT Error:", err.message);
        res.status(500).json({ error: "Processing failed: " + err.message });
    }
});

// Fixed Port: Use process.env.PORT for Render compatibility
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 STT Microservice active on port ${PORT}`);
});