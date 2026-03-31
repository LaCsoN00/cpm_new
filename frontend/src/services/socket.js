import { io } from 'socket.io-client'

// Determine backend URL, default to localhost:5000 for development
const BACKEND_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000'

// Create a single socket instance
const socket = io(BACKEND_URL, {
  autoConnect: true,
  withCredentials: true,
  extraHeaders: {
    'ngrok-skip-browser-warning': 'true'
  }
})

export default socket
