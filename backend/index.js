require('dotenv').config()

const express    = require('express')
const cors       = require('cors')
const bodyParser = require('body-parser')
const STT_SERVICE_URL = "https://speech-to-text-converter-hez1.onrender.com/ping";

const app = express()
app.use(cors())
app.use(bodyParser.json())

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/auth', require('./routes/authroute'))       // POST /auth/register, /auth/login, GET /auth/me
app.use('/file', require('./routes/fileuploadroute')) // POST /file/upload, GET /file/history, DELETE /file/:id

app.get('/', (req, res) => {
  res.json({ name: 'Speech to text converter backend' })
})

app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log('Listening at port ' + process.env.PORT)
})

// Update your backend code
setInterval(async () => {
  try {
    // 60-second timeout gives Render time to finish "Building"
    const response = await axios.get(STT_SERVICE_URL, { timeout: 60000 }); 
    console.log(`✅ Heartbeat Success: ${response.data}`);
  } catch (error) {
    console.error("❌ Heartbeat failed: STT is still waking up or crashing.");
  }
}, 10 * 60 * 1000); // 10 minutes



