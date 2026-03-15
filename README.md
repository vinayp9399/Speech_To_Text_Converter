# 🎙️ AI Speech-to-Text Converter

A high-performance, full-stack application that records real-time audio, manages secure cloud storage via **Convex**, and utilizes a specialized **Node.js worker** for FFmpeg processing and **Mozilla DeepSpeech** transcriptions.

## 🌟 Key Features
* **Hybrid Cloud Architecture:** Uses Convex for "Backend-as-a-Service" (Auth, DB, Storage) and a local Node.js worker for heavy-duty audio processing.
* **Secure Authentication:** Custom JWT-based system with Bcrypt password hashing.
* **Direct-to-Cloud Uploads:** Bypasses traditional middleware (no Multer) to upload audio directly to Convex Storage.
* **Automated Conversion:** Integrated FFmpeg pipeline to convert WebM audio to 16kHz Mono PCM WAV for DeepSpeech compatibility.

---

## 🏗️ System Architecture

1.  **Frontend (React):** Captures audio and uploads the raw blob to Convex Cloud Storage.
2.  **Cloud Backend (Convex):** Stores metadata, manages user sessions, and triggers the STT Worker via a "Bridge Action."
3.  **Local Worker (Node.js):** Downloads the cloud file, runs FFmpeg conversion, executes DeepSpeech inference, and pushes the text result back to the cloud.

---

## 📂 Project Structure & API

### 1. Convex Backend (`/convex`)
* **`schema.ts`**: Defines `users` and `transcriptions` tables with indexed `userId` for data privacy.
* **`auth.ts`**: Handles Bcrypt registration and JWT login actions.
* **`transcriptions.ts`**: Manages `generateUploadUrl` and `startTranscription` mutations.
* **`stt.ts`**: A Convex Action that notifies the local worker when a new file is ready.

### 2. Local Worker (`/stt-worker`)
* **`index.js`**: An Express server (Node v14/v18) that listens for processing requests.
* **FFmpeg Pipeline**: 
    ```javascript
    ffmpeg(input).outputOptions(['-ar 16000', '-ac 1', '-c:a pcm_s16le']).save(output);
    ```

### 3. Frontend (`/src`)
* **Tailwind UI**: Pulsing recording indicator using `animate-ping`.
* **Convex Client**: Real-time data fetching using `useQuery(api.transcriptions.getMyHistory)`.

---

## ⚙️ Installation & Setup

### Prerequisites
* Node.js (v14 or higher for DeepSpeech)
* FFmpeg installed on your system path
* A [Convex](https://www.convex.dev/) account

### 1. Backend Setup (Convex)
```bash
# From the project root
npm install
npx convex dev

# In the Convex Dashboard, add JWT_SECRET to your Environment Variables.

2. Dependencies
In the convex/ folder:

Bash
cd convex && npm install bcryptjs jsonwebtoken
In the stt-worker/ folder:

Bash
cd stt-worker && npm install express axios fluent-ffmpeg
3. Start the STT Worker
Bash
cd stt-worker
node index.js
4. Run the Frontend
Bash
npm run dev
🚀 Deployment
Cloud Functions & DB
Deploy the backend logic to Convex production:

Bash
npx convex deploy
Frontend (Vercel/Netlify)
Link your GitHub repository.

Add VITE_CONVEX_URL to your environment variables.

STT Worker
Deploy to a platform supporting persistent binaries (FFmpeg) such as Render (via Docker), Railway, or a VPS (AWS/DigitalOcean).

🛡️ Security Implementation
Data Isolation: Users can only query transcriptions matching their userId via database indexes.

Password Safety: Passwords are never stored in plain text; they are hashed with a salt factor of 10 using bcryptjs.

Session Management: Short-lived JWTs ensure authorized access to cloud mutations and storage URLs.

📄 License
This project is licensed under the MIT License.