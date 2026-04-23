export interface EmailRecord {
  id: string
  emailTo: string
  emailFrom: string
  subject: string
  body: string
  sendToAffiliatesDate: string
  sentFromApp: string
  sentDate: string | null
  createdAt: string
}

export interface CreateEmailInput {
  emailTo: string
  emailFrom: string
  subject: string
  body: string
  sendToAffiliatesDate: string
  sentFromApp: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Array<{ field: string; message: string }>
  }
}