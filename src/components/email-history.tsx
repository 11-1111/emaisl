"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import { getEmailHistory } from "@/lib/actions/sendMailAction"

// Types
type EmailHistoryItem = {
  id: string
  merchantId: string
  merchantName: string
  fileUrl: string
  fileName: string
  sentAt: string
  recipientCount: number
}

export default function EmailHistory() {
  const [history, setHistory] = useState<EmailHistoryItem[]>([
    {
      id: "1",
      merchantId: "1",
      merchantName: "Example Corp",
      fileUrl: "#",
      fileName: "sample-document.pdf",
      sentAt: new Date().toISOString(),
      recipientCount: 3,
    },
  ])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getEmailHistory()
        setHistory(data)
      } catch (error) {
        console.error("Failed to load email history", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [])

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email History</CardTitle>
        <CardDescription>View a history of all emails sent through the system</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Date/Time</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.merchantName}</TableCell>
                  <TableCell>{item.fileName}</TableCell>
                  <TableCell>{item.recipientCount} recipients</TableCell>
                  <TableCell>{formatDate(item.sentAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.fileUrl} download={item.fileName}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
