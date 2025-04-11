"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Send } from "lucide-react"
import { sendEmail, uploadFile } from "@/lib/actions/sendMailAction"
import { toast } from "sonner"


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

export default function EmailSender() {
  const [merchants] = useState<Merchant[]>([
    {
      id: "1",
      name: "Example Corp",
      recipients: [{ id: "r1", email: "contact@example.com", merchantId: "1" }],
    },
  ])

  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("")
  const [emailSubject, setEmailSubject] = useState<string>("")
  const [emailBody, setEmailBody] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isSending, setIsSending] = useState<boolean>(false)


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSendEmail = async () => {
    if (!selectedMerchantId) {
      toast("Please select a merchant")

      return
    }

    if (!file) {
      toast("Please upload a file")
      return
    }

    if (!emailSubject || !emailBody) {
      toast( "Please provide both subject and body for the email")
      return
    }

    try {
      setIsUploading(true)
      const fileUrl = await uploadFile(file)
      setIsUploading(false)

      setIsSending(true)
      const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId)
      if (selectedMerchant) {
        await sendEmail({
          merchantId: selectedMerchantId,
          merchantName: selectedMerchant.name,
          recipients: selectedMerchant.recipients.map((r) => r.email),
          subject: emailSubject,
          body: emailBody,
          fileUrl,
          fileName: file.name,
        })

        toast(
          `Email sent to ${selectedMerchant.recipients.length} recipients`
        )

        // Reset form
        setEmailSubject("")
        setEmailBody("")
        setFile(null)
      }
    } catch (error) {
      toast( "Failed to send email. Please try again."
      )
    } finally {
      setIsSending(false)
    }
  }

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Email</CardTitle>
        <CardDescription>
          Select a merchant, upload a file, and send emails to all associated recipients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="merchant">Select Merchant</Label>
            <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
              <SelectTrigger id="merchant">
                <SelectValue placeholder="Select a merchant" />
              </SelectTrigger>
              <SelectContent>
                {merchants.map((merchant) => (
                  <SelectItem key={merchant.id} value={merchant.id}>
                    {merchant.name} ({merchant.recipients.length} recipients)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <div className="flex items-center gap-4">
              <Input id="file" type="file" onChange={handleFileChange} className="flex-1" />
              {file && (
                <p className="text-sm text-gray-500">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Body (HTML supported)</Label>
            <Textarea
              id="body"
              placeholder="Enter email content"
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="font-mono"
            />
          </div>

          {selectedMerchant && (
            <div className="text-sm text-gray-500">
              This email will be sent to {selectedMerchant.recipients.length} recipient(s).
            </div>
          )}

          <Button
            onClick={handleSendEmail}
            disabled={isUploading || isSending || !selectedMerchantId || !file}
            className="w-full"
          >
            {isUploading ? (
              <>Uploading file...</>
            ) : isSending ? (
              <>Sending emails...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Send Email
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Input({
  type = "text",
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  type?: string
  className?: string
}) {
  if (type === "file") {
    return (
      <div className={`relative ${className}`}>
        <input type="file" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" {...props} />
        <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          <Upload className="mr-2 h-4 w-4" />
          <span>Upload File</span>
        </div>
      </div>
    )
  }

  return <Input {...props} type={type} className={className} />
}
