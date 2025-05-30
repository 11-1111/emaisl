"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Download,
  Loader2,
  Ban,
  CheckCircle,
  Mail,
  Clock,
  User,
  FileText,
  Calendar,
  Send,
  Settings,
  RefreshCw,
} from "lucide-react"
import { useState } from "react"
import type { SentEmail } from "@/lib/types/types"

interface SentEmailsTableProps {
  sentEmails: SentEmail[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onEmailUpdate?: (emailId: number, blocked: boolean) => void
  onRefresh?: () => void
}

interface ColumnVisibility {
  user: boolean
  recipients: boolean
  created: boolean
  sent: boolean
  attachments: boolean
}

export default function SentEmailsTable({
  sentEmails,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onEmailUpdate,
  onRefresh,
}: SentEmailsTableProps) {
  const [blockingStates, setBlockingStates] = useState<Record<number, boolean>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    user: false, // Hidden by default to save space
    recipients: false, // Hidden by default to save space
    created: true, // Show by default
    sent: true, // Show by default
    attachments: false, // Hidden by default to save space
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid"

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getAttachmentUrl = (attachmentFileName: string | undefined) => {
    if (!attachmentFileName) return ""

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    return `${baseUrl}/app/attachments/${encodeURIComponent(attachmentFileName)}`
  }

  const getUserInitials = (user: any) => {
    if (!user) return "U"
    const firstName = user.first_name || ""
    const lastName = user.last_name || ""
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U"
  }

  const getUserName = (user: any) => {
    if (!user) return "Unknown User"
    const firstName = user.first_name || ""
    const lastName = user.last_name || ""
    return `${firstName} ${lastName}`.trim() || user.email || "Unknown User"
  }

  const handleRefresh = async () => {
    if (!onRefresh) return

    setIsRefreshing(true)
    try {
      await onRefresh()
      toast.success("Email list refreshed successfully")
    } catch (error) {
      toast.error("Failed to refresh email list")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleBlockUnblock = async (emailId: number, shouldBlock: boolean) => {
    setBlockingStates((prev) => ({ ...prev, [emailId]: true }))

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/emails/${emailId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          blocked: shouldBlock.toString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${shouldBlock ? "block" : "unblock"} email`)
      }

      // Update the parent component's state immediately (optimistic update)
      onEmailUpdate?.(emailId, shouldBlock)

      toast.success(`Email ${shouldBlock ? "blocked" : "unblocked"} successfully`)
      // setTimeout(() => {
      //   onRefresh?.()
      // }, 500)
    } catch (error: any) {
      console.error("Error updating email:", error)
      toast.error(error.message || `Error: Failed to ${shouldBlock ? "block" : "unblock"} email`)

      // Refresh data on error to revert any optimistic updates
      // onRefresh?.()
    } finally {
      setBlockingStates((prev) => ({ ...prev, [emailId]: false }))
    }
  }

  const getStatusConfig = (email: SentEmail) => {
    if (email.blocked) {
      return {
        label: "Blocked",
        icon: Ban,
        className: "bg-red-100 text-red-700 border-red-200",
      }
    }
    if (email.is_sent) {
      return {
        label: "Sent",
        icon: Send,
        className: "bg-green-100 text-green-700 border-green-200",
      }
    }
    return {
      label: "Queued",
      icon: Clock,
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    }
  }

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Column Visibility Controls */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={columnVisibility.user} onCheckedChange={() => toggleColumn("user")}>
              <User className="w-4 h-4 mr-2" />
              Initiated By
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.recipients}
              onCheckedChange={() => toggleColumn("recipients")}
            >
              <Mail className="w-4 h-4 mr-2" />
              Recipients
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.created}
              onCheckedChange={() => toggleColumn("created")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Created Date
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={columnVisibility.sent} onCheckedChange={() => toggleColumn("sent")}>
              <Send className="w-4 h-4 mr-2" />
              Sent Date
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.attachments}
              onCheckedChange={() => toggleColumn("attachments")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Attachments
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Table Card */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden px-8">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#16659e]" />
              <p className="text-gray-600 font-medium">Loading email history...</p>
            </div>
          ) : sentEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Mail className="w-10 h-10 text-gray-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">No emails found</h3>
                <p className="text-gray-500 mt-1">Start by composing your first email campaign</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow className="border-b border-gray-200/50">
                    {/* Always visible columns */}
                    <TableHead className="px-4 py-4 text-left font-semibold text-gray-900 min-w-[200px]">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Merchant & Subject</span>
                      </div>
                    </TableHead>

                    {/* Collapsible columns */}
                    {columnVisibility.user && (
                      <TableHead className="px-4 py-4 text-left font-semibold text-gray-900 min-w-[150px]">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Initiated By</span>
                        </div>
                      </TableHead>
                    )}

                    {columnVisibility.recipients && (
                      <TableHead className="px-4 py-4 text-left font-semibold text-gray-900 min-w-[200px]">
                        Recipients
                      </TableHead>
                    )}

                    {columnVisibility.created && (
                      <TableHead className="px-4 py-4 text-left font-semibold text-gray-900 min-w-[120px]">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Created</span>
                        </div>
                      </TableHead>
                    )}

                    {columnVisibility.sent && (
                      <TableHead className="px-4 py-4 text-left font-semibold text-gray-900 min-w-[120px]">
                        <div className="flex items-center space-x-2">
                          <Send className="w-4 h-4" />
                          <span>Sent</span>
                        </div>
                      </TableHead>
                    )}

                    {/* Always visible columns */}
                    <TableHead className="px-4 py-4 text-left font-semibold text-gray-900 min-w-[100px]">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-4 text-left font-semibold text-gray-900 min-w-[120px]">
                      Actions
                    </TableHead>

                    {columnVisibility.attachments && (
                      <TableHead className="px-4 py-4 text-right font-semibold text-gray-900 min-w-[100px]">
                        <div className="flex items-center justify-end space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Files</span>
                        </div>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentEmails.map((email) => {
                    const statusConfig = getStatusConfig(email)
                    const StatusIcon = statusConfig.icon
                    const isBlocked = email.blocked

                    return (
                      <TableRow
                        key={email.id}
                        className={`border-b border-gray-100 transition-all duration-200 hover:bg-gray-50/50 ${
                          isBlocked ? "bg-red-50/30 opacity-60 hover:bg-red-50/50" : "hover:shadow-sm"
                        }`}
                      >
                        {/* Merchant & Subject Column (Always visible) */}
                        <TableCell className="px-4 py-4">
                          <div className={`space-y-2 ${isBlocked ? "opacity-60" : ""}`}>
                            <div className="font-semibold text-gray-900">{email.to}</div>
                            <div className="space-y-1">
                              {email.subject.split(" - ").map((part, idx) => (
                                <div
                                  key={idx}
                                  className={idx === 0 ? "text-sm font-medium text-gray-700" : "text-xs text-gray-500"}
                                >
                                  {part}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>

                        {/* User Column (Collapsible) */}
                        {columnVisibility.user && (
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`/placeholder.svg?height=32&width=32&query=${getUserInitials(email.user)}`}
                                  alt={getUserName(email.user)}
                                />
                                <AvatarFallback className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] text-white text-xs font-medium">
                                  {getUserInitials(email.user)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={isBlocked ? "opacity-60" : ""}>
                                <p className="text-xs text-gray-500">{email.user || "No email"}</p>
                              </div>
                            </div>
                          </TableCell>
                        )}

                        {/* Recipients Column (Collapsible) */}
                        {columnVisibility.recipients && (
                          <TableCell className="px-4 py-4">
                            <div className={`space-y-1 ${isBlocked ? "opacity-60" : ""}`}>
                              {email.recipient_emails?.slice(0, 2).map((recipient, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {recipient.replace(/"/g, "")}
                                </Badge>
                              ))}
                              {email.recipient_emails && email.recipient_emails.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{email.recipient_emails.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        )}

                        {/* Created At Column (Collapsible) */}
                        {columnVisibility.created && (
                          <TableCell className="px-4 py-4">
                            <div className={`text-sm text-gray-600 ${isBlocked ? "opacity-60" : ""}`}>
                              {formatDateShort(email.created_at)}
                            </div>
                          </TableCell>
                        )}

                        {/* Sent At Column (Collapsible) */}
                        {columnVisibility.sent && (
                          <TableCell className="px-4 py-4">
                            <div className={`text-sm text-gray-600 ${isBlocked ? "opacity-60" : ""}`}>
                              {!email.is_sent && new Date(email.sent_at) < new Date()
                                ? "---"
                                : formatDateShort(email.sent_at)}
                            </div>
                          </TableCell>
                        )}

                        {/* Status Column (Always visible) */}
                        <TableCell className="px-4 py-4">
                          <Badge className={`${statusConfig.className} border font-medium text-xs`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>

                        {/* Actions Column (Always visible) */}
                        <TableCell className="px-4 py-4">
                          <div className="flex gap-3">
                            {email.blocked ? (
                              <button
                                onClick={() => !blockingStates[email.id] && handleBlockUnblock(email.id, false)}
                                disabled={blockingStates[email.id]}
                                className="group flex w-[100px] justify-center items-center gap-2 px-3 py-1 text-xs font-medium text-black border border-black bg-transparent rounded-md transition-all duration-300 hover:bg-black hover:text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform"
                              >
                                <span className="flex items-center justify-center">
                                  {blockingStates[email.id] ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-black group-hover:text-white transition-colors" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-black group-hover:text-white transition-colors" />
                                  )}
                                </span>
                                <span>Unblock</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => !blockingStates[email.id] && handleBlockUnblock(email.id, true)}
                                disabled={blockingStates[email.id]}
                                className="group flex w-[100px] justify-center items-center gap-2 px-3 py-1 text-xs font-medium text-black border border-black bg-transparent rounded-md transition-all duration-300 hover:bg-black hover:text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform"
                              >
                                <span className="flex items-center justify-center">
                                  {blockingStates[email.id] ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-black group-hover:text-white transition-colors" />
                                  ) : (
                                    <Ban className="h-4 w-4 text-black group-hover:text-white transition-colors" />
                                  )}
                                </span>
                                <span>Block</span>
                              </button>
                            )}
                          </div>
                        </TableCell>

                        {/* Attachments Column (Collapsible) */}
                        {columnVisibility.attachments && (
                          <TableCell className="px-4 py-4">
                            <div className="flex justify-end">
                              {email.attachments && email.attachments.length > 0 ? (
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {email.attachments.length}
                                  </Badge>
                                  {email.attachments.slice(0, 1).map((file, idx) => (
                                    <a
                                      key={idx}
                                      href={getAttachmentUrl(file)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                                        isBlocked
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                      }`}
                                      onClick={isBlocked ? (e) => e.preventDefault() : undefined}
                                    >
                                      <Download className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <span className={`text-xs text-gray-400 ${isBlocked ? "opacity-60" : ""}`}>None</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && sentEmails.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) onPageChange(currentPage - 1)
                      }}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {(() => {
                    const pageNumbers = []
                    const maxVisiblePages = 5
                    let start = Math.max(currentPage - 2, 1)
                    const end = Math.min(start + maxVisiblePages - 1, totalPages)

                    if (end - start < maxVisiblePages - 1) {
                      start = Math.max(end - maxVisiblePages + 1, 1)
                    }

                    if (start > 1) {
                      pageNumbers.push(
                        <PaginationItem key={1}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === 1}
                            onClick={(e) => {
                              e.preventDefault()
                              onPageChange(1)
                            }}
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>,
                      )
                      if (start > 2) {
                        pageNumbers.push(<PaginationEllipsis key="start-ellipsis" />)
                      }
                    }

                    for (let i = start; i <= end; i++) {
                      pageNumbers.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === i}
                            onClick={(e) => {
                              e.preventDefault()
                              onPageChange(i)
                            }}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>,
                      )
                    }

                    if (end < totalPages) {
                      if (end < totalPages - 1) {
                        pageNumbers.push(<PaginationEllipsis key="end-ellipsis" />)
                      }
                      pageNumbers.push(
                        <PaginationItem key={totalPages}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === totalPages}
                            onClick={(e) => {
                              e.preventDefault()
                              onPageChange(totalPages)
                            }}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>,
                      )
                    }

                    return pageNumbers
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages) onPageChange(currentPage + 1)
                      }}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
