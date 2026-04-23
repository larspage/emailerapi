import 'dotenv/config'
import express from 'express'
import { logger, logInformation, logError } from './lib/logger.js'
import { initDatabase, closeDatabase } from './services/database.js'
import { requireApiKey } from './middleware/auth.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = '127.0.0.1' // Bind to localhost only

// Middleware
app.use(express.json())

// Health endpoint (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// All other routes require API key
app.use(requireApiKey)

// TODO: Add routes here
// app.post('/api/emails', emailRoutes.create)
// app.get('/api/emails', emailRoutes.list)
// app.get('/api/emails/:id', emailRoutes.get)
// app.patch('/api/emails/:id/sent-date', emailRoutes.updateSentDate)

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  })
})

// Start server
function start() {
  try {
    initDatabase()
    logInformation('Database initialized')

    const server = app.listen(PORT, HOST, () => {
      logInformation('Server started', {
        host: HOST,
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
      })
      console.log(`Server running on http://${HOST}:${PORT}`)
      console.log(`Health check: http://${HOST}:${PORT}/api/health`)
    })

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down...')
      server.close(() => {
        closeDatabase()
        process.exit(0)
      })
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error) {
    logError('Failed to start server', { error: (error as Error).message })
    process.exit(1)
  }
}

start()

export default app