"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Paperclip, X, Loader2 } from "lucide-react"
import type { Merchant } from "@/lib/types/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth"

interface EmailComposerProps {
  merchants: Merchant[]
  isLoading: boolean
}

export default function EmailComposer({ merchants, isLoading }: EmailComposerProps) {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("")
  const [recipients, setRecipients] = useState<string[]>([])
  const [dear, setDear] = useState<string>("")
  const [subject, setSubject] = useState<string>("Transactions Email for merchant pesapal")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const token = getAccessToken()
  const router = useRouter();

  // useEffect(() => {
  //   if (status === "loading") return;
  //   if (!session) {
  //     console.log("expired ,,,lets log you out")
  //     router.push("/");
  //   }
  // }, [session, status, router]);

  const handleMerchantChange = (value: string) => {
    setSelectedMerchantId(value)
    const merchant = merchants.find((m) => m.id.toString() === value)
    if (merchant) {
      setRecipients(merchant.recipient_emails)
      setDear(merchant.merchant_name)
    } else {
      setRecipients([])
      setDear("")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }
  const handleSendEmail = async () => {
    if (!selectedMerchantId) {
      toast("Please select a merchant")
      return
    }

    if (!subject) {
      toast("Please enter a subject")
      return
    }

    setIsSending(true)

    try {
      const formData = new FormData()
      formData.append("merchantId", selectedMerchantId)
      formData.append("to", dear)
      formData.append("subject", subject)

      const serializedRecipients = JSON.stringify(recipients);
formData.append("recipient_emails", serializedRecipients);
     
      formData.append("body", "")

      attachments.forEach((file) => {
        formData.append("attachments", file)
      })


      const response = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/app/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text()
        toast(`Response not OK: ${errorText}`);
        throw new Error(errorText || "Failed to send email")
      }

      const result = await response.json()

      toast(result.message || "Email has been sent successfully")

      // Reset form
      setDear("")
      setSubject("Transactions attachments for merchant pesapal")
      setAttachments([])
    } catch (error) {
      console.error("❗ Error sending email:", error)
      toast(
        error instanceof Error
          ? error.message
          : "Failed to send email. Please try again."
      )
    } finally {
      setIsSending(false)
    }
  }



  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Email</CardTitle>
        <CardDescription>Select a merchant and compose an email to send to their recipients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="merchant">Select Merchant</Label>
          <Select value={selectedMerchantId} onValueChange={handleMerchantChange} disabled={isLoading}>
            <SelectTrigger id="merchant">
              <SelectValue placeholder="Select a merchant" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading merchants...
                </div>
              ) : (
                merchants.map((merchant) => (
                  <SelectItem key={merchant.id} value={merchant.id.toString()}>
                    {merchant.merchant_name} ({merchant.recipient_emails.length} recipients)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {recipients.length > 0 && (
          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
              {recipients.map((email, index) => (
                <Badge key={index} variant="secondary">
                  {email}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="dear">Dear</Label>
          <Input id="dear" value={dear} onChange={(e) => setDear(e.target.value)} placeholder="Enter recipient name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            disabled
            placeholder="Enter email subject"
          />

        </div>

        <div className="space-y-2">

        </div>

        <div className="space-y-2">
          <Label>Attachments</Label>
          <div className="flex flex-col gap-2">
            {attachments.length > 0 && (
              <div className="flex flex-col gap-2 p-2 border rounded-md bg-muted/50 mb-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} type="button">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach Files
              </Button>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={handleSendEmail} disabled={isSending || !selectedMerchantId}>
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Email"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
