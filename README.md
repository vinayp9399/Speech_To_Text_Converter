AI Speech To Text Converter with Deepram AI

## Problem Statement: 
In modern business, "voice data" is often lost data. In sectors like Telemedicine, Law, and Customer Support, critical details shared in spoken conversation frequently vanish because manual note-taking is slow and prone to error. Furthermore, scaling AI-driven transcription is traditionally expensive; hosting heavy machine learning models like Whisper requires high-cost GPU infrastructure that many startups and independent developers cannot afford on restricted cloud budgets.

## Aim of the Project: 
The goal was to build a production-ready Speech-to-Text Asset Management System that bridges the gap between raw audio and searchable data. By leveraging a "Serverless-First" approach with the MERN stack and Deepgram AI, the project aims to provide near-instant, 95% accurate transcriptions. It transforms transient voice notes into a persistent, organized Convex database, effectively creating a "Google Search for Voice" that functions efficiently even on low-resource, free-tier hosting environments.

## The Process: 
The application follows a modern Asynchronous Cloud Pipeline used by industry leaders like Otter.ai and Zoom. 
1.	First, the React frontend captures audio and streams it to Convex for high-speed storage, mimicking the "Edge Capture" seen in mobile messaging apps. 
2.	The Node.js backend then acts as an orchestrator, securely passing the file URL to Deepgram’s Nova-2 neural engine for processing. 
3. Finally, the structured JSON output is indexed Convex, allowing users to immediately search, edit, and manage their spoken records.


## System Architecture: 
The project follows a streamlined Fullstack architecture, where the Node.js backend acts as a secure bridge between the user's audio data and the Deepgram AI engine.

1. Frontend (React + Tailwind): A modern, responsive dashboard for recording, uploading, and viewing transcriptions.
2. Backend (Node.js + Express + Convex): Manages user authentication, metadata storage, and secure communication with Deepgram.
3. File Storage (Convex): Handles high-speed audio file hosting and retrieval.
4. Deepgram AI: Cloud-based neural network (Nova-2 model) for high-accuracy speech recognition.


## Tech Stack: 
Frontend: React.js, Tailwind CSS, Axios
Backend: Node.js, Express, Convex
AI Processing: Deepgram SDK 
Database/Storage: Convex (File Management)
Deployment: Vercel (Frontend), Render (Backend)


## Key Features: 
Cloud-Native Transcription: Powered by Deepgram’s latest models for industry-leading speed and accuracy.
Format Agnostic: Automatically processes `.mp3`, `.wav`, `.m4a`, and other formats without the need for local FFmpeg dependencies.
History Tracking: Securely stores every transcription in Convex for easy retrieval and management.
Performance Optimized: Extremely lightweight backend footprint, staying well within Render’s 512MB RAM limit by offloading AI processing.
Real-time Status: Provides immediate visual feedback during the upload and processing states.


## Project Setup & Installation: 

1. Prerequisites: 
* A [Deepgram API Key](https://console.deepgram.com/).
* A [Convex](https://www.convex.dev/) account for file storage and database.


2. Backend Setup: 
Navigate to the backend directory and install dependencies:
cd backend
npm install

Create a .env file in the backend directory:
PORT=5000
MONGO_URI=your_mongodb_uri
DEEPGRAM_API_KEY=your_deepgram_key
CONVEX_DEPLOYMENT_URL=your_convex_url

Start the development server:
npm start


3. Frontend Setup: 
Navigate to the frontend directory and install dependencies:

cd frontend
npm install
npm run dev



## API Design:
1. POST /api/upload: Handles file metadata and triggers the Microservice processing.
The primary endpoint for processing audio.
Input: Receives a fileUrl or storageId.
Logic: The backend initializes the Deepgram SDK, sends the audio source, and awaits the transcript.
Output: Returns JSON containing the transcript, confidence levels, and metadata.

2. GET /api/history: Fetches past transcriptions and status from MongoDB.
Fetches the user's transcription history directly from the Convex database.


Backend (Render)
Frontend (Vercel)


## Conclusion: 
This project demonstrates that the future of software lies in AI Orchestration rather than just feature coding. By integrating Deepgram, the system achieved a massive reduction in server overhead while maintaining enterprise-grade accuracy and sub-second latency. The result is a scalable tool that meets modern industry standards for digital transformation, proving that sophisticated AI solutions can be deployed reliably on standard full-stack architectures.