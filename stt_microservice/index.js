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
    if (!fileUrl) return res.status(400).json({ error: "No fileUrl provided" });

    let response;
    let attempts = 0;
    const maxAttempts = 3;

    // Retry loop to handle Convex indexing delays
    while (attempts < maxAttempts) {
        try {
            response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            break; // Success! Exit the loop
        } catch (err) {
            attempts++;
            if (err.response && err.response.status === 404 && attempts < maxAttempts) {
                console.log(`⚠️ File not ready (404). Retry attempt ${attempts}...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            } else {
                console.error("❌ STT Download Error:", err.message);
                return res.status(err.response?.status || 500).json({ error: "Download failed" });
            }
        }
    }

    try {
        const buffer = Buffer.from(response.data);
        const audioBuffer = buffer.slice(44); // Skip WAV header
        const result = model.stt(audioBuffer);
        res.json({ text: result });
    } catch (err) {
        res.status(500).json({ error: "Transcription failed" });
    }
});

// Fixed Port: Use process.env.PORT for Render compatibility
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 STT Microservice active on port ${PORT}`);
});