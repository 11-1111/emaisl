"use server"

// Types
type Merchant = {
  id: string
  name: string
  recipients: Recipient[]
}

type Recipient = {
  id: string
  email: string
  merchantId: string
}

type EmailData = {
  merchantId: string
  merchantName: string
  recipients: string[]
  subject: string
  body: string
  fileUrl: string
  fileName: string
}

type EmailHistoryItem = {
  id: string
  merchantId: string
  merchantName: string
  fileUrl: string
  fileName: string
  sentAt: string
  recipientCount: number
}

export async function addMerchant(merchant: Merchant): Promise<void> {

  
  console.log("Adding merchant:", merchant)

  return Promise.resolve()
}

export async function deleteMerchant(id: string): Promise<void> {

  console.log("Deleting merchant:", id)
  return Promise.resolve()
}

export async function addRecipient(recipient: Recipient): Promise<void> {
  console.log("Adding recipient:", recipient)
  return Promise.resolve()
}

export async function deleteRecipient(id: string): Promise<void> {
  console.log("Deleting recipient:", id)
  return Promise.resolve()
}

export async function uploadFile(file: File): Promise<string> {
  console.log("Uploading file:", file.name)
  return Promise.resolve(`https://example.com/files/${file.name}`)
}

export async function sendEmail(data: EmailData): Promise<void> {
  console.log("Sending email:", data)
  return Promise.resolve()
}

export async function getEmailHistory(): Promise<EmailHistoryItem[]> {
  return Promise.resolve([
    {
      id: "1",
      merchantId: "1",
      merchantName: "Example Corp",
      fileUrl: "https://example.com/files/sample-document.pdf",
      fileName: "sample-document.pdf",
      sentAt: new Date().toISOString(),
      recipientCount: 3,
    },
  ])
}
