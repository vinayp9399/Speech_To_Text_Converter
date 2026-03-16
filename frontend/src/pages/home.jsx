import React, { useState, useRef, useEffect } from 'react'
import Navbar from '../components/navbar'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Home() {
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [task, setTask] = useState('upload')
  const [recording, setRecording] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [transcripts, settranscripts] = useState([])


  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const navigate = useNavigate()

  // Redirect to login if no token
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
    }
    axios.get('https://speech-to-text-converter-backend.onrender.com/file/history', { headers: { ...authHeader() } }).then((res)=>{
      settranscripts(res.data.history)
      console.log(transcripts.transcript)
    })
  }, [])

  // Build auth header from stored JWT
  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  })

  // ── File upload ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setText('')
    setErrorMsg('')
  }

  const handleUpload = async (e) => {
    e.preventDefault()   // ← prevents form submit / page reload
    if (!file) {
      setErrorMsg('Please select a file first')
      return
    }

    setIsLoading(true)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('myfile', file)

    try {
      const response = await axios.post(
        'https://speech-to-text-converter-backend.onrender.com/file/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', ...authHeader() } }
      )
      setText(response.data.transcription)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      } else {
        setErrorMsg(err.response?.data?.error || 'Upload failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    setText('')
    setErrorMsg('')
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorderRef.current = new MediaRecorder(stream)
    audioChunksRef.current = []

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data)
    }

    mediaRecorderRef.current.onstop = () => {
      if (audioChunksRef.current.length === 0) return
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      sendAudioToBackend(audioBlob)
    }

    mediaRecorderRef.current.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current.stop()
    setRecording(false)
  }

  const sendAudioToBackend = async (blob) => {
    setIsLoading(true)
    setErrorMsg('')
    const formData = new FormData()
    formData.append('myfile', blob, 'recording.webm')

    try {
      const response = await axios.post(
        'https://speech-to-text-converter-backend.onrender.com/file/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', ...authHeader() } }
      )
      setText(response.data.transcription)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      } else {
        setErrorMsg('Error transcribing audio')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Tab switch ─────────────────────────────────────────────────────────
  const switchTask = (e, newTask) => {
    e.preventDefault()   // ← prevents form submit / page reload
    setTask(newTask)
    setText('')
    setErrorMsg('')
  }

  return (
    <>
      <Navbar />

      <form>
        <div className="space-y-12 m-20">
          <div className="border-white/10">
            <h2 className="mb-3 text-lg text-gray-400">Upload File or record it</h2>

            <div className="col-span-full">

              {/* Tab buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="mt-2 mb-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white"
                  onClick={(e) => switchTask(e, 'upload')}
                >
                  Upload
                </button>
                <button
                  type="button"
                  className="mt-2 mb-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white"
                  onClick={(e) => switchTask(e, 'record')}
                >
                  Record
                </button>
              </div>

              <div className="flex gap-4">

                {/* Upload panel */}
                {task === 'upload' && (
                  <div className="mt-2 w-100 flex justify-center gap-0 rounded-lg border border-dashed border-white px-6 py-10">
                    <div className="text-center">
                      <div className="mt-4 flex text-sm/6 text-gray-400">
                        <input
                          onChange={handleFileChange}
                          type="file"
                          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      <button
                        type="button"
                        className="mt-5 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white"
                        onClick={handleUpload}
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                )}

                {/* Record panel */}
                {task === 'record' && (
                  <div className="mt-2 w-100 flex justify-center gap-0 rounded-lg border border-dashed border-white px-6 py-10">
                    <div className="text-center">
                      <button
                        type="button"
                        className="mr-4 py-2 px-4 rounded-full border-0 text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={recording ? stopRecording : startRecording}
                      >
                        {recording ? 'Stop Recording' : 'Start Recording'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                  <div className="mx-auto w-full max-w-sm rounded-md border border-blue-300 p-4">
                    <div className="flex animate-pulse space-x-4">
                      <div className="flex-1 space-y-6 py-1">
                        <div className="space-y-3">
                          <div className="h-2 rounded bg-gray-200"></div>
                          <div className="h-2 rounded bg-gray-200"></div>
                          <div className="h-2 rounded bg-gray-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {!isLoading && errorMsg && (
                  <div className="mx-auto w-full max-w-sm rounded-md border border-red-400 p-2">
                    <p className="text-sm text-red-400 p-3">{errorMsg}</p>
                  </div>
                )}

                {/* Transcription result */}
                {!isLoading && !errorMsg && (
                  <div className="mx-auto w-full max-w-sm rounded-md border border-blue-300 p-2">
                    <div className="flex space-x-4">
                      <div className="flex-1 space-y-6 p-3">
                        <div className="space-y-3">{text}</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>



                    <div className="border-white/10">
            <h2 className="mb-3 text-lg text-gray-400 mb-6">Transcript History</h2>

            <div className="col-span-full">

              <div className="">

                {transcripts.map((t, index)=>(
                  <div className="mx-auto w-full rounded-md border border-blue-100 p-1 mb-5">
                    <div className="flex space-x-4">
                      <div className="flex-1 space-y-6 p-3">
                        <div className="space-y-3 text-gray-400">{t.transcript.text}</div>
                      </div>
                    </div>
                  </div>
                ))}
                  

              </div>
            </div>

          </div>
        </div>
      </form>
    </>
  )
}

export default Home
