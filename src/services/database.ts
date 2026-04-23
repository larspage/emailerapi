import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { logger, logInformation, logError } from '../lib/logger.js'
import type { EmailRecord, CreateEmailInput } from '../types/email.js'

const DB_PATH = process.env.DB_PATH || './data/emailer.db'

let db: Database.Database

/**
 * Initialize database connection and create schema
 */
export function initDatabase(): void {
  logger.info('Initializing SQLite database', { path: DB_PATH })

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      emailTo TEXT NOT NULL,
      emailFrom TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      sendToAffiliatesDate TEXT NOT NULL,
      sentFromApp TEXT NOT NULL,
      sentDate TEXT,
      createdAt TEXT NOT NULL
    )
  `)

  logInformation('Database initialized', { path: DB_PATH })
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    logInformation('Database connection closed')
  }
}

/**
 * Create a new email record
 */
export function createEmail(input: CreateEmailInput): EmailRecord {
  const id = uuidv4()
  const createdAt = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO emails (id, emailTo, emailFrom, subject, body, sendToAffiliatesDate, sentFromApp, sentDate, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
  `)

  stmt.run(id, input.emailTo, input.emailFrom, input.subject, input.body, input.sendToAffiliatesDate, input.sentFromApp, createdAt)

  logger.info('Email record created', { id, emailTo: input.emailTo })

  return {
    id,
    emailTo: input.emailTo,
    emailFrom: input.emailFrom,
    subject: input.subject,
    body: input.body,
    sendToAffiliatesDate: input.sendToAffiliatesDate,
    sentFromApp: input.sentFromApp,
    sentDate: null,
    createdAt,
  }
}

/**
 * Get all email records
 */
export function getAllEmails(): EmailRecord[] {
  const stmt = db.prepare('SELECT * FROM emails ORDER BY createdAt DESC')
  return stmt.all() as EmailRecord[]
}

/**
 * Get email by ID
 */
export function getEmailById(id: string): EmailRecord | null {
  const stmt = db.prepare('SELECT * FROM emails WHERE id = ?')
  return stmt.get(id) as EmailRecord | null
}

/**
 * Update sentDate for an email
 */
export function updateSentDate(id: string, sentDate: string): EmailRecord | null {
  const stmt = db.prepare('UPDATE emails SET sentDate = ? WHERE id = ?')
  const result = stmt.run(sentDate, id)

  if (result.changes === 0) {
    return null
  }

  logger.info('Email sentDate updated', { id, sentDate })
  return getEmailById(id)
}

/**
 * Delete email by ID
 */
export function deleteEmail(id: string): boolean {
  const stmt = db.prepare('DELETE FROM emails WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}