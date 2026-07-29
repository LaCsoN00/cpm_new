import { io } from 'socket.io-client'

// ── Demo Mode: return a no-op stub to avoid connection errors ──
const noop = () => {}
const stubSocket = {
  on: noop, off: noop, emit: noop,
  connect: noop, disconnect: noop,
  id: 'demo-socket',
  connected: false,
}

// Determine backend URL, default to localhost:5000 for development
const BACKEND_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000'

// Create a real socket instance only when NOT in demo mode.
// We do this lazily: if demo mode is active at module load time, we skip the io() call.
const socket = localStorage.getItem('cpm_demo_mode') === 'true'
  ? stubSocket
  : io(BACKEND_URL, {
      autoConnect: true,
      withCredentials: true,
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    })

export default socket
