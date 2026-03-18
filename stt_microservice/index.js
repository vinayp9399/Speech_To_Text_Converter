const express = require('express');
const cors = require('cors');
const axios = require('axios');
const vosk = require('vosk');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Load Vosk Model
const MODEL_PATH = path.join(__dirname, 'model');
if (!fs.existsSync(MODEL_PATH)) {
    process.exit(1);
}

const model = new vosk.Model(MODEL_PATH);

app.post('/process', async (req, res) => {
    const { fileUrl } = req.body;
    if (!fileUrl) return res.status(400).json({ error: "Missing fileUrl" });

    try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const recognizer = new vosk.Recognizer({ model: model, sampleRate: 16000 });
        
        // Feed audio buffer (skipping header if necessary)
        recognizer.acceptWaveform(Buffer.from(response.data));
        const result = recognizer.result();
        
        recognizer.free();
        res.json({ text: result.text });
    } catch (err) {
        console.error("STT Error:", err.message);
        res.status(500).json({ error: "Transcription failed" });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`STT Service on port ${PORT}`));