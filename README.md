Full-Stack AI Speech to Text Converter

A professional MERN stack application featuring a dedicated AI Speech-to-Text (STT) Microservice. This project demonstrates a decoupled architecture, high-performance audio processing using Vosk AI.


System Architecture-

The project is split into three distinct layers to ensure scalability and to manage heavy AI workloads without blocking the main user API.

1. Frontend (React + Tailwind): Modern UI for recording, uploading, and managing transcriptions.
2. Main Backend (Node.js + Express + MongoDB): Handles metadata, user history, and acts as a "Babysitter" for the microservice.
3. STT Microservice (Node.js + Vosk AI + FFmpeg): A dedicated engine that converts raw audio into text using localized machine learning models.


Tech Stack-

Frontend- React.js, Tailwind CSS, Axios
Main Backend- Node.js, Express, Convex
AI Microservice- Vosk AI Engine, FFmpeg, Node.js

Deployment- Vercel (Frontend), Render (Backend & Microservice)


Key Features-

* Offline AI Transcription: Utilizes Vosk for private, local speech recognition, eliminating external API latency and costs.
* Audio Processing Pipeline: Integrated FFmpeg to normalize various audio formats to 16kHz Mono PCM, ensuring maximum transcription accuracy.
* Memory Optimized: Specifically configured to run within a strict 512MB RAM limit using the `vosk-model-small-en-us` engine.
* Responsive Dashboard: Clean UI for tracking transcription history with real-time status indicators.



Project Setup & Installation

1. STT Microservice Setup
cd stt_microservice
npm install
(Ensure the 'model' folder contains the Vosk Small English Model files)
npm start

2. Main Backend Setup
cd backend
npm install
(Add your MONGO_URI and STT_SERVICE_URL to your .env file)
npm run dev

3. Frontend Setup
cd frontend
npm install
npm run dev



API Design
Main Backend
POST /api/upload: Handles file metadata and triggers the Microservice processing.
GET /api/history: Fetches past transcriptions and status from MongoDB.

STT Microservice
POST /process: Receives audio data/URLs and returns a JSON transcript.