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
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
})

// Attach io to the request object so routes can broadcast events
app.use((req, res, next) => {
  req.io = io
  next()
})

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

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
