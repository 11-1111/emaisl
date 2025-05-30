"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Paperclip,
  X,
  Loader2,
  Send,
  Users,
  Mail,
  FileText,
  Calendar,
  CheckCircle,
  Upload,
  AlertCircle,
} from "lucide-react"
import type { Merchant } from "@/lib/types/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getAccessToken } from "@/lib/auth"
import { Progress } from "@/components/ui/progress"

interface EmailComposerProps {
  merchants: Merchant[]
  isLoading: boolean
}

export default function EmailComposer({ merchants, isLoading }: EmailComposerProps) {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("")
  const [recipients, setRecipients] = useState<string[]>([])
  const [dear, setDear] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const formattedDate = yesterday.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const [subject, setSubject] = useState(`Your Daily Transaction Statement - ${formattedDate}`)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [isSending, setIsSending] = useState<boolean>(false)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const token = getAccessToken()
  const router = useRouter()

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setAttachment(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAttachment(file)
    }
  }

  const removeAttachment = () => {
    setAttachment(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSendEmail = async () => {
    if (!selectedMerchantId) {
      toast.error("Please select a merchant")
      return
    }

    if (!subject) {
      toast.error("Please enter a subject")
      return
    }

    setIsSending(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("merchantId", selectedMerchantId)
      formData.append("to", dear)
      formData.append("subject", subject)

      const serializedRecipients = JSON.stringify(recipients)
      formData.append("recipient_emails", serializedRecipients)
      formData.append("body", "")

      if (attachment) {
        formData.append("attachments", attachment)
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorText = await response.text()
        toast.error(`Failed to send email: ${errorText}`)
        throw new Error(errorText || "Failed to send email")
      }

      const result = await response.json()

      toast.success(result.message || "Email queued successfully! 🎉")

      // Reset form with animation
      setTimeout(() => {
        setSelectedMerchantId("")
        setRecipients([])
        setDear("")
        setSubject(`Your Daily Transaction Statement - ${formattedDate}`)
        setAttachment(null)
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        router.push("/dashboard?tab=sent")
      }, 1000)
    } catch (error) {
      console.error("❗ Error sending email:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send email. Please try again.")
      setUploadProgress(0)
    } finally {
      setTimeout(() => setIsSending(false), 1000)
    }
  }

  const selectedMerchant = merchants.find((m) => m.id.toString() === selectedMerchantId)

  return (
    <div className="space-y-6">

      {/* Main Composer Card */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 space-y-8">
          {/* Merchant Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-[#16659e]" />
              </div>
              <div>
                <Label className="text-base font-semibold text-gray-900">Select Merchant</Label>
                <p className="text-sm text-gray-500">Choose the merchant for this email campaign</p>
              </div>
            </div>

            <Select value={selectedMerchantId} onValueChange={handleMerchantChange} disabled={isLoading}>
              <SelectTrigger className="h-14 bg-white/70 border-gray-200/50 focus:border-[#16659e] focus:ring-[#16659e]/20 rounded-xl text-base">
                <SelectValue placeholder="Select a merchant to continue..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200/50">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-3 text-[#16659e]" />
                    <span className="text-gray-600">Loading merchants...</span>
                  </div>
                ) : (
                  merchants.map((merchant) => (
                    <SelectItem key={merchant.id} value={merchant.id.toString()} className="py-3 px-4 rounded-lg">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{merchant.merchant_name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {merchant.recipient_emails.length} recipients
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Recipients Preview */}
          {recipients.length > 0 && (
            <div className="space-y-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <Label className="text-base font-semibold text-green-900">Email Recipients</Label>
                  <p className="text-sm text-green-700">
                    Email will be sent to {recipients.length} recipient{recipients.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {recipients.map((email, index) => (
                  <Badge key={index} variant="secondary" className="bg-white/70 text-green-800 border-green-200">
                    {email}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Email Details */}
          {selectedMerchantId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900">Recipient Name</Label>
                <Input
                  value={dear}
                  onChange={(e) => setDear(e.target.value)}
                  placeholder="Enter recipient name"
                  className="h-12 bg-white/70 border-gray-200/50 focus:border-[#16659e] focus:ring-[#16659e]/20 rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900">Email Subject</Label>
                <Input
                  value={subject}
                  disabled
                  className="h-12 bg-gray-50 border-gray-200/50 rounded-xl text-gray-600"
                />
              </div>
            </div>
          )}

          {/* File Upload Section */}
          {selectedMerchantId && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <Label className="text-base font-semibold text-gray-900">Attachment</Label>
                  <p className="text-sm text-gray-500">Upload one file to include with your email</p>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  dragActive ? "border-[#16659e] bg-blue-50/50" : "border-gray-300 hover:border-gray-400"
                } ${attachment ? "bg-gray-50/50" : "bg-white/50"}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="*/*" />

                {!attachment ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Drop a file here or click to upload</p>
                      <p className="text-sm text-gray-500 mt-1">Single file attachment supported</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/70 border-gray-200 hover:bg-gray-50 rounded-xl"
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">File selected</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/70 border-gray-200 hover:bg-gray-50 rounded-xl"
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      Replace File
                    </Button>
                  </div>
                )}
              </div>

              {/* Attached File Display */}
              {attachment && (
                <div className="p-4 bg-white/70 rounded-xl border border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{attachment.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(attachment.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeAttachment}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Send Button */}
          {selectedMerchantId && (
            <div className="space-y-4">
              {isSending && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="text-[#16659e] font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <Button
                className="w-full h-14 bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#1e7bb8] hover:to-[#16659e] text-white font-semibold rounded-xl shadow-lg shadow-[#16659e]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#16659e]/30 hover:scale-[1.02] text-base"
                onClick={handleSendEmail}
                disabled={isSending || !selectedMerchantId || !dear.trim()}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    {uploadProgress < 100 ? "Uploading..." : "Queueing Email..."}
                  </>
                ) : (
                  <>
                    <Calendar className="mr-3 h-5 w-5" />
                    Queue Email for Delivery
                  </>
                )}
              </Button>

              {selectedMerchant && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Email will be queued and sent to{" "}
                    <span className="font-medium text-[#16659e]">{selectedMerchant.merchant_name}</span> via cron job
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!selectedMerchantId && (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select a Merchant to Continue</h3>
                <p className="text-gray-500 mt-1">
                  Choose a merchant from the dropdown above to start composing your email
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
