"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, FileText, Calendar, Paperclip } from 'lucide-react'
import { toast } from "sonner"
import { getAccessToken } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UploadRecord {
  uploadedAt: string
  attachments: string
}

export default function UploadedRecordsTable() {
  const [records, setRecords] = useState<UploadRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRecords = async (showToast = false) => {
    try {
      if (showToast) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      const token = getAccessToken()
      const response = await fetch("http://localhost:3001/settlements/app/emails/uploads", {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setRecords(data)

      if (showToast) {
        toast.success("Records refreshed successfully")
      }
    } catch (error) {
      console.error("Error fetching uploaded records:", error)
      toast.error("Failed to load uploaded records")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const parseAttachments = (attachmentsString: string): string[] => {
    try {
      return JSON.parse(attachmentsString)
    } catch {
      return []
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    return ext || 'file'
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Uploaded Records
            </CardTitle>
            <CardDescription className="text-gray-600">
              View all email attachment uploads and their timestamps
            </CardDescription>
          </div>
          <Button
            onClick={() => fetchRecords(true)}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#145182] hover:to-[#16659e] text-white shadow-lg shadow-[#16659e]/25"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-500 text-center max-w-md">
              There are no uploaded records to display. Upload records will appear here once available.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-white hover:from-gray-50 hover:to-white border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Uploaded At</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="w-4 h-4" />
                      <span>Attachments</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => {
                  const attachments = parseAttachments(record.attachments)
                  return (
                    <TableRow 
                      key={index}
                      className="hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-cyan-50/30 transition-all border-b border-gray-100"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#16659e]/10 to-[#1e7bb8]/10 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-[#16659e]" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatDate(record.uploadedAt)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(record.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {attachments.map((attachment, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 bg-gradient-to-r from-gray-50 to-white px-3 py-2 rounded-lg border border-gray-200 group hover:border-[#16659e]/30 transition-all"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-[#16659e]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#16659e] transition-colors">
                                  {attachment}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="text-xs mt-1 bg-gray-100 text-gray-600"
                                >
                                  {getFileExtension(attachment).toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] text-white shadow-sm"
                        >
                          {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
