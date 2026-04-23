# EmailerAPI Specification

## Overview

A Node.js REST API that:
1. Accepts email submission data (with scheduling metadata)
2. Sends the email immediately
3. Records everything to a database (with `sentDate` updated when actually sent to affiliates)

---

## API Contract

### POST `/api/emails`

**Request Body:**
```json
{
  "emailTo": "recipient@example.com",
  "emailFrom": "sender@example.com",
  "subject": "Email Subject",
  "body": "Long email body text...",
  "sendToAffiliatesDate": "2026-05-01T00:00:00Z",
  "sentFromApp": "MyAppName"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-v4",
  "emailTo": "recipient@example.com",
  "emailFrom": "sender@example.com",
  "subject": "Email Subject",
  "body": "Long email body text...",
  "sendToAffiliatesDate": "2026-05-01T00:00:00Z",
  "sentFromApp": "MyAppName",
  "sentDate": null,
  "createdAt": "2026-04-22T12:00:00Z"
}
```

**Behavior:**
1. Validate all required fields
2. Send email via SMTP (excluding `sendToAffiliatesDate` and `sentFromApp`)
3. Record to database with `sentDate` set to now (email was just sent)
4. Log operation with Winston

### GET `/api/emails`

**Response (200 OK):**
```json
{
  "emails": [
    {
      "id": "uuid-v4",
      "emailTo": "...",
      "emailFrom": "...",
      "subject": "...",
      "body": "...",
      "sendToAffiliatesDate": "...",
      "sentFromApp": "...",
      "sentDate": "2026-04-22T12:00:00Z",
      "createdAt": "2026-04-22T12:00:00Z"
    }
  ]
}
```

### GET `/api/emails/:id`

**Response (200 OK):** Single email record or 404

### PATCH `/api/emails/:id/sent-date`

Mark an email as sent to affiliates (updates `sentDate`).

**Response (200 OK):** Updated email record

---

## Data Model

### EmailRecord

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Auto-generated |
| emailTo | string | Yes | Recipient email |
| emailFrom | string | Yes | Sender email |
| subject | string | Yes | Email subject |
| body | text | Yes | Long body supported |
| sendToAffiliatesDate | datetime | Yes | When to send to affiliates |
| sentFromApp | string | Yes | Source application identifier |
| sentDate | datetime | No | null until sent to affiliates |
| createdAt | datetime | Yes | Auto-generated |

---

## Tech Stack

- **Runtime:** Node.js 22+
- **Framework:** Express.js (simple, fast)
- **Database:** SQLite (simple deployment, no external DB needed)
- **ORM:** Better-SQLite3 (synchronous, fast)
- **Email:** Nodemailer (standard for Node SMTP)
- **Logging:** Winston + Loki (matching your existing pattern)
- **Validation:** Zod (type-safe validation)
- **Language:** TypeScript

---

## Project Structure

```
/
├── src/
│   ├── index.ts           # Entry point, server start
│   ├── routes/
│   │   └── emails.ts     # Email routes
│   ├── services/
│   │   ├── email.ts      # Email sending logic
│   │   └── database.ts  # SQLite operations
│   ├── schemas/
│   │   └── email.ts      # Zod schemas
│   ├── lib/
│   │   └── logger.ts     # Winston logger (from life-is-hard-planner pattern)
│   └── types/
│       └── email.ts      # TypeScript types
├── data/
│   └── emailer.db        # SQLite database file
├── package.json
├── tsconfig.json
├── .env.example
└── SPEC.md
```

---

## Configuration (.env)

```env
PORT=3000
LOG_LEVEL=info
LOKI_URL=http://localhost:3100
NODE_ENV=development

# SMTP (email sending)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM="Sender Name <sender@example.com>"
```

---

## Logging Strategy

All operations logged via Winston:

| Event | Level | Fields |
|-------|-------|--------|
| Server start | info | port, env |
| Email received | info | emailTo, subject, correlationId |
| Email sent | info | emailTo, duration_ms |
| Email saved | info | id, emailTo |
| Validation error | warn | field, correlationId |
| Send failure | error | emailTo, error |
| DB error | error | operation, error |

---

## Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [{ "field": "emailTo", "message": "Required" }]
  }
}
```

Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `EMAIL_SEND_FAILED`, `DATABASE_ERROR`

---

## Acceptance Criteria

1. POST `/api/emails` accepts valid payload, sends email, stores record with `sentDate` set
2. GET `/api/emails` returns all records with pagination
3. GET `/api/emails/:id` returns single record or 404
4. PATCH `/api/emails/:id/sent-date` updates `sentDate`
5. All errors return proper JSON error responses
6. All operations logged with Winston (console + Loki)
7. Body field supports long text (no limit)
8. Validation on all required fields
9. Unit tests for core services