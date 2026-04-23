# EmailerAPI Integration Guide

Guide for other websites on this server to integrate with the EmailerAPI.

---

## Overview

The EmailerAPI is a secure, localhost-only API that accepts email data, sends emails, and records everything to a database.

**Base URL:** `http://127.0.0.1:3000`

**Authentication:** All requests (except `/api/health`) require the `X-API-Key` header.

---

## Quick Start

```javascript
const API_KEY = process.env.API_KEY // Set in your .env
const API_URL = 'http://127.0.0.1:3000'

async function sendEmail(data) {
  const response = await fetch(`${API_URL}/api/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error.message)
  }

  return response.json()
}
```

---

## Endpoints

### Create Email

**POST** `/api/emails`

Send an email and record it to the database.

**Request:**
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
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
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

---

### List Emails

**GET** `/api/emails`

Get all email records.

**Response (200 OK):**
```json
{
  "emails": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "emailTo": "recipient@example.com",
      "emailFrom": "sender@example.com",
      "subject": "Email Subject",
      "body": "Long email body text...",
      "sendToAffiliatesDate": "2026-05-01T00:00:00Z",
      "sentFromApp": "MyAppName",
      "sentDate": null,
      "createdAt": "2026-04-22T12:00:00Z"
    }
  ]
}
```

---

### Get Email

**GET** `/api/emails/:id`

Get a single email record by ID.

**Response (200 OK):** Single email record object.

**Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Email not found"
  }
}
```

---

### Update Sent Date

**PATCH** `/api/emails/:id/sent-date`

Mark an email as sent to affiliates (updates the `sentDate` field).

**Request:** Empty body

**Response (200 OK):** Updated email record.

**Response (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Email not found"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [
      { "field": "fieldName", "message": "Validation failed" }
    ]
  }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `NOT_FOUND` | 404 | Resource not found |
| `EMAIL_SEND_FAILED` | 500 | Failed to send email |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Configuration

### Required Environment Variables

Set these in your website's `.env` file:

```env
# API Key (get from EmailerAPI's .env file)
API_KEY=your-api-key-here
```

### Health Check

```javascript
async function isEmailerAPIRunning() {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/health')
    return response.ok
  } catch {
    return false
  }
}
```

---

## Node.js Client Example

```javascript
// lib/emailer.js
const API_KEY = process.env.EMAILER_API_KEY
const API_URL = process.env.EMAILER_API_URL || 'http://127.0.0.1:3000'

export const emailer = {
  async sendEmail(data) {
    const response = await fetch(`${API_URL}/api/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to send email')
    }

    return result
  },

  async listEmails() {
    const response = await fetch(`${API_URL}/api/emails`, {
      headers: { 'X-API-Key': API_KEY },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to list emails')
    }

    return result.emails
  },

  async getEmail(id) {
    const response = await fetch(`${API_URL}/api/emails/${id}`, {
      headers: { 'X-API-Key': API_KEY },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || 'Email not found')
    }

    return result
  },

  async markSent(id) {
    const response = await fetch(`${API_URL}/api/emails/${id}/sent-date`, {
      method: 'PATCH',
      headers: { 'X-API-Key': API_KEY },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to update')
    }

    return result
  },
}
```

---

## Security Notes

1. **API Key:** Keep it secret. Don't commit it to version control.
2. **Localhost Only:** The API is bound to `127.0.0.1`, so external traffic cannot reach it.
3. **Timing-Safe Comparison:** API key validation uses timing-safe comparison to prevent timing attacks.