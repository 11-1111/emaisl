"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import {
  Loader2,
  FileSpreadsheet,
  Download,
  Send,
  Calendar,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { getAccessToken } from "@/lib/auth"

interface Merchant {
  id: number
  merchant_name: string
  recipient_emails: string[]
}

interface GeneratedRecord {
  generatedAt: string
  attachments: string[]
}

interface PaginatedResponse {
  data: GeneratedRecord[]
  meta: {
    total: number
    page: number
    size: number
    totalPages: number
  }
}

export default function GeneratedRecordsTable() {
  const [records, setRecords] = useState<GeneratedRecord[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMerchantsLoading, setIsMerchantsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [composeDialogOpen, setComposeDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    size: 10,
    totalPages: 0,
  })

  // Compose form state
  const [selectedRecord, setSelectedRecord] = useState<GeneratedRecord | null>(null)
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number>(0)
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("")
  const [recipients, setRecipients] = useState<string[]>([])
  const [merchantName, setMerchantName] = useState<string>("")
  const [subject, setSubject] = useState("Daily Settlements Testing")

  const token = getAccessToken()

  const getAttachmentUrl = (filename: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/app/reports/generated/${encodeURIComponent(filename)}`
  }

  // Fixed: Handle both forward slashes and backslashes from API paths (e.g., "generated/filename.xlsx")
  const getFileName = (path: string) => {
    // Split on both forward slashes and backslashes to extract just the filename
    const parts = path.split(/[/\\]/)
    return parts[parts.length - 1] || path
  }

  const fetchRecords = async (showRefreshIndicator = false) => {
    setIsLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/app/emails/generated-records?page=${page}&size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch generated records")
      }

      const data: PaginatedResponse = await response.json()
      setRecords(data.data)
      setMeta(data.meta)
    } catch (error) {
      console.error("Error fetching generated records:", error)
      toast.error("Failed to load generated records")
    } finally {
      setIsLoading(false)
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
  }, [page, size])

  useEffect(() => {
    fetchMerchants()
  }, [])

  const handleGenerateReports = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/emails/generated-records/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to generate reports")
      }

      const result = await response.json()
      toast.success(result.message || "Reports generated successfully!")

      // Refresh the list after successful generation
      await fetchRecords()
    } catch (error) {
      console.error("Error generating reports:", error)
      toast.error("Failed to generate reports")
    } finally {
      setIsGenerating(false)
    }
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/emails/generated-records/queue`, {
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

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    const { totalPages } = meta

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push(-1)
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1)
        pages.push(-1)
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push(-1)
        pages.push(page - 1)
        pages.push(page)
        pages.push(page + 1)
        pages.push(-1)
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setPage(newPage)
    }
  }

  const handleSizeChange = (newSize: string) => {
    setSize(Number(newSize))
    setPage(1)
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
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm !py-0">
        <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Generated Records
              </CardTitle>
              <CardDescription className="text-gray-600">View and manage generated settlement records</CardDescription>
            </div>
            <Button
              onClick={handleGenerateReports}
              disabled={isGenerating}
              className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#145182] hover:to-[#16659e] text-white shadow-lg shadow-[#16659e]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[#16659e]/30"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Reports
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto max-w-[80vw]">
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
                        <p className="text-sm text-gray-400">Click "Generate Reports" to create new records</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record, recordIndex) => (
                    <TableRow key={recordIndex} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{formatDate(record.generatedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {record.attachments.map((attachment, index) => (
                            <a
                              key={index}
                              href={getAttachmentUrl(getFileName(attachment))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200/50 hover:from-blue-50 hover:to-cyan-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-700 transition-colors">
                                  {getFileName(attachment)}
                                </span>
                                <Download className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    openComposeDialog(record, index)
                                  }}
                                  className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#1e7bb8] hover:to-[#16659e] text-white shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Compose
                                </Button>
                              </div>
                            </a>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                          {record.attachments.length} {record.attachments.length === 1 ? "file" : "files"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {records.length > 0 && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{(page - 1) * size + 1}</span> to{" "}
                    <span className="font-semibold text-gray-900">{Math.min(page * size, meta.total)}</span> of{" "}
                    <span className="font-semibold text-gray-900">{meta.total}</span> records
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <Select value={size.toString()} onValueChange={handleSizeChange}>
                      <SelectTrigger className="w-[70px] h-8 border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                    className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((pageNum, idx) => {
                      if (pageNum === -1) {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                            ...
                          </span>
                        )
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-8 w-8 p-0 transition-all duration-200 ${
                            page === pageNum
                              ? "bg-gradient-to-r from-[#16659e] to-[#1e7bb8] text-white shadow-md hover:shadow-lg"
                              : "hover:bg-blue-50"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === meta.totalPages}
                    className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(meta.totalPages)}
                    disabled={page === meta.totalPages}
                    className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compose Dialog */}
      <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
        <DialogContent className="max-w-[600px] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-[#16659e]" />
              <span>Compose Email</span>
            </DialogTitle>
            <DialogDescription>Select a merchant to send this generated record</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* File Info */}
            {selectedRecord && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">
                      {getFileName(selectedRecord.attachments[selectedAttachmentIndex])}
                    </p>
                    <p className="text-xs text-blue-700">Generated: {formatDate(selectedRecord.generatedAt)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant Selection */}
            <div className="space-y-2">
              <Label htmlFor="merchant" className="text-sm font-medium text-gray-700">
                Select Merchant
              </Label>
              <Select value={selectedMerchantId} onValueChange={handleMerchantChange}>
                <SelectTrigger className="w-full border-gray-300 focus:border-[#16659e] focus:ring-[#16659e]">
                  <SelectValue placeholder="Choose a merchant..." />
                </SelectTrigger>
                <SelectContent>
                  {isMerchantsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin text-[#16659e]" />
                    </div>
                  ) : (
                    merchants.map((merchant) => (
                      <SelectItem key={merchant.id} value={merchant.id.toString()}>
                        {merchant.merchant_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Recipients Display */}
            {recipients.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Recipients</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {recipients.map((email, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-white border-gray-300 text-gray-700">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="border-gray-300 focus:border-[#16659e] focus:ring-[#16659e]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setComposeDialogOpen(false)}
              disabled={isSending}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleQueueEmail}
              disabled={isSending || !selectedMerchantId}
              className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#145182] hover:to-[#16659e] text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Queueing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
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
