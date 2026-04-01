const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const projectRoutes = require('./routes/projects')
const milestoneRoutes = require('./routes/milestones')
const evaluationRoutes = require('./routes/evaluations')
const ticketRoutes = require('./routes/tickets')
const clientRoutes = require('./routes/clients')
const invoiceRoutes = require('./routes/invoices')
const userRoutes = require('./routes/users')
const notificationRoutes = require('./routes/notifications')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { 
    origin: ["https://cpm-new.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
})

// Add the Ngrok skip header for all requests to ensure API calls don't trigger the landing page
app.use((req, res, next) => {
  res.setHeader('Ngrok-Skip-Browser-Warning', 'true')
  next()
})

// Correctly add headers for Socket.io polling
io.engine.on("initial_headers", (headers, req) => {
  headers["Ngrok-Skip-Browser-Warning"] = "true"
})

// Attach io to the request object so routes can broadcast events
app.use((req, res, next) => {
  req.io = io
  next()
})

app.use(cors({ 
  origin: (origin, callback) => {
    const allowed = ['https://cpm-new.vercel.app', 'http://localhost:5173']
    if (!origin || allowed.includes(origin)) return callback(null, true)
    callback(new Error('Interdit par la politique CORS'))
  },
  credentials: true 
}))

// Add the Ngrok skip header for all requests to ensure API calls don't trigger the landing page
app.use((req, res, next) => {
  res.setHeader('Ngrok-Skip-Browser-Warning', 'true')
  next()
})
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'CPM API running' }))

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/milestones', milestoneRoutes)
app.use('/api/evaluations', evaluationRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notificationRoutes)

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Erreur interne du serveur' })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`✅ CPM API démarrée sur http://localhost:${PORT}`))
