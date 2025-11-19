"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCw, FileSpreadsheet, Eye, Send, Calendar, Download, Mail } from 'lucide-react'
import { getAccessToken } from "@/lib/auth"
import { toast } from "sonner"
import type { Merchant } from "@/lib/types/types"

interface GeneratedRecord {
  generatedAt: string
  attachments: string[]
}

export default function GeneratedRecordsTable() {
  const [records, setRecords] = useState<GeneratedRecord[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMerchantsLoading, setIsMerchantsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [composeDialogOpen, setComposeDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  // Compose form state
  const [selectedRecord, setSelectedRecord] = useState<GeneratedRecord | null>(null)
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number>(0)
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("")
  const [recipients, setRecipients] = useState<string[]>([])
  const [merchantName, setMerchantName] = useState<string>("")
  const [subject, setSubject] = useState("Daily Settlements Testing")

  const token = getAccessToken()

  const fetchRecords = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const response = await fetch("http://localhost:3001/settlements/app/emails/generated-records", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch generated records")
      }

      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error("Error fetching generated records:", error)
      toast.error("Failed to load generated records")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchMerchants = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/merchants`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch merchants")
      }

      const data = await response.json()
      setMerchants(data)
    } catch (error) {
      console.error("Error fetching merchants:", error)
      toast.error("Failed to load merchants")
    } finally {
      setIsMerchantsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
    fetchMerchants()
  }, [])

  const handleRefresh = () => {
    fetchRecords(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getFileName = (path: string) => {
    return path.split("\\").pop() || path
  }

  const handlePreview = async (record: GeneratedRecord, index: number) => {
    // In a real implementation, this would download the file
    toast.info(`Downloading: ${getFileName(record.attachments[index])}`)
    // You would typically fetch the file and trigger a download here
  }

  const openComposeDialog = (record: GeneratedRecord, index: number) => {
    setSelectedRecord(record)
    setSelectedAttachmentIndex(index)
    setSelectedMerchantId("")
    setRecipients([])
    setMerchantName("")
    setSubject("Daily Settlements Testing")
    setComposeDialogOpen(true)
  }

  const handleMerchantChange = (value: string) => {
    setSelectedMerchantId(value)
    const merchant = merchants.find((m) => m.id.toString() === value)
    if (merchant) {
      setRecipients(merchant.recipient_emails)
      setMerchantName(merchant.merchant_name)
    } else {
      setRecipients([])
      setMerchantName("")
    }
  }

  const handleQueueEmail = async () => {
    if (!selectedRecord || !selectedMerchantId) {
      toast.error("Please select a merchant")
      return
    }

    setIsSending(true)

    try {
      const payload = {
        generatedAt: selectedRecord.generatedAt,
        attachmentIndexes: [selectedAttachmentIndex],
        to: merchantName,
        subject: subject,
        recipient_emails: recipients,
        body: "",
      }

      const response = await fetch("http://localhost:3001/settlements/app/emails/generated-records/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to queue email")
      }

      const result = await response.json()
      toast.success(result.message || "Email queued successfully!")
      setComposeDialogOpen(false)
    } catch (error) {
      console.error("Error queueing email:", error)
      toast.error("Failed to queue email")
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#16659e]" />
            <p className="text-gray-600 font-medium">Loading generated records...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[#16659e] to-[#1e7bb8] rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Generated Records</CardTitle>
                <p className="text-sm text-gray-600 mt-1">View and manage generated settlement records</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="bg-white/70 hover:bg-white border-gray-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-900 w-[200px]">Generated At</TableHead>
                  <TableHead className="font-semibold text-gray-900">Attachments</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right w-[100px]">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <FileSpreadsheet className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">No generated records found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record, recordIndex) => (
                    <TableRow key={recordIndex} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(record.generatedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {record.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200/50"
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-700 truncate">
                                  {getFileName(attachment)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePreview(record, index)}
                                  className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Preview
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => openComposeDialog(record, index)}
                                  className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#1e7bb8] hover:to-[#16659e] text-white"
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Compose
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          {record.attachments.length} {record.attachments.length === 1 ? "file" : "files"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Compose Dialog */}
      <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-[#16659e]" />
              <span>Compose Email</span>
            </DialogTitle>
            <DialogDescription>
              Select a merchant to send this generated record
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* File Info */}
            {selectedRecord && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">
                      {getFileName(selectedRecord.attachments[selectedAttachmentIndex])}
                    </p>
                    <p className="text-xs text-blue-700">
                      Generated: {formatDate(selectedRecord.generatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant Selection */}
            <div className="space-y-2">
              <Label htmlFor="merchant" className="text-sm font-medium">
                Select Merchant
              </Label>
              <Select value={selectedMerchantId} onValueChange={handleMerchantChange} disabled={isMerchantsLoading}>
                <SelectTrigger id="merchant" className="h-11">
                  <SelectValue placeholder="Choose a merchant..." />
                </SelectTrigger>
                <SelectContent>
                  {isMerchantsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-[#16659e]" />
                      <span className="text-sm text-gray-600">Loading merchants...</span>
                    </div>
                  ) : (
                    merchants.map((merchant) => (
                      <SelectItem key={merchant.id} value={merchant.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{merchant.merchant_name}</span>
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
              <div className="space-y-2">
                <Label className="text-sm font-medium">Recipients ({recipients.length})</Label>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {recipients.map((email, index) => (
                      <Badge key={index} variant="secondary" className="bg-white text-green-800 border-green-300">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="h-11"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeDialogOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleQueueEmail}
              disabled={isSending || !selectedMerchantId}
              className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#1e7bb8] hover:to-[#16659e] text-white"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Queueing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Queue Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
