"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Timer,
  Save,
} from "lucide-react"
import { useState } from "react"
import type { SentEmail } from "@/lib/types/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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
    user: false,
    recipients: false,
    created: true,
    sent: true,
    attachments: false,
  })

  const [selectedHour, setSelectedHour] = useState<string>("")
  const [selectedMinute, setSelectedMinute] = useState<string>("")
  const [isSavingCron, setIsSavingCron] = useState(false)

  // Generate hours (0-23) and minutes (0-59)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

  // Convert selected time to cron format and save
  const handleSaveCronSchedule = async () => {
    if (!selectedHour || !selectedMinute) {
      toast.error("Please select both hour and minute")
      return
    }

    const cronExpression = `${Number.parseInt(selectedMinute)} ${Number.parseInt(selectedHour)} * * *`

    setIsSavingCron(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/emails/cron`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cron: cronExpression }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || "Failed to save schedule")
      }

      toast.success(`Schedule saved: Emails will be sent daily at ${selectedHour}:${selectedMinute}`)
    } catch (error: any) {
      console.error("Error saving cron schedule:", error)
      toast.error(error.message || "Failed to save schedule")
    } finally {
      setIsSavingCron(false)
    }
  }

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
    return `${baseUrl}/app/reports/generated/${encodeURIComponent(attachmentFileName)}`
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

      onEmailUpdate?.(emailId, shouldBlock)

      toast.success(`Email ${shouldBlock ? "blocked" : "unblocked"} successfully`)
    } catch (error: any) {
      console.error("Error updating email:", error)
      toast.error(error.message || `Error: Failed to ${shouldBlock ? "block" : "unblock"} email`)
    } finally {
      setBlockingStates((prev) => ({ ...prev, [emailId]: false }))
    }
  }

  const getStatusConfig = (email: SentEmail) => {
    if (email.blocked) {
      return {
        label: "Blocked",
        icon: Ban,
        className: "bg-slate-50 text-slate-700 border border-slate-200",
      }
    }
    if (email.is_sent) {
      return {
        label: "Sent",
        icon: Send,
        className: "bg-emerald-50 text-emerald-700 border border-emerald-100",
      }
    }
    return {
      label: "Queued",
      icon: Clock,
      className: "bg-amber-50 text-amber-700 border border-amber-100",
    }
  }

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm !py-0">
      <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Scheduled & Sent Emails
            </CardTitle>
            <CardDescription className="text-gray-600">Manage and review your email history</CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="gap-2 hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-200 bg-white border-gray-200 text-gray-700"
              >
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
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Timer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Daily Email Schedule</h3>
                  <p className="text-sm text-gray-600">Set the time for daily automated emails</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1.5 shadow-sm">
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger className="w-[80px] border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-xl font-bold text-gray-400">:</span>

                  <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                    <SelectTrigger className="w-[80px] border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSaveCronSchedule}
                  disabled={isSavingCron || !selectedHour || !selectedMinute}
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-sm"
                >
                  {isSavingCron ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Schedule
                </Button>
              </div>
            </div>

            {selectedHour && selectedMinute && (
              <div className="mt-3 pt-3 border-t border-indigo-100">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Cron Expression:</span>{" "}
                  <code className="bg-white px-2 py-1 rounded text-indigo-600 font-mono text-xs border border-indigo-100">
                    {`${Number.parseInt(selectedMinute)} ${Number.parseInt(selectedHour)} * * *`}
                  </code>
                  <span className="ml-2 text-gray-500">
                    (Runs daily at {selectedHour}:{selectedMinute})
                  </span>
                </p>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-[#16659e]/10 to-[#16659e]/5 rounded-2xl flex items-center justify-center shadow-sm border border-[#16659e]/20">
                  <Loader2 className="h-6 w-6 animate-spin text-[#16659e]" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-gray-900 font-semibold">Loading email history</p>
                <p className="text-gray-500 text-sm">Please wait while we fetch your emails...</p>
              </div>
            </div>
          ) : sentEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
                  <Mail className="w-10 h-10 text-slate-400" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">No emails sent yet</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  Start by composing your first email campaign to see it listed here
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto max-w-[80vw]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-50 hover:to-gray-100/50 border-b border-gray-200">
                    <TableHead className="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider min-w-[250px]">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>Merchant & Subject</span>
                      </div>
                    </TableHead>

                    {columnVisibility.user && (
                      <TableHead className="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider min-w-[180px]">
                        <div className="flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>Initiated By</span>
                        </div>
                      </TableHead>
                    )}

                    {columnVisibility.recipients && (
                      <TableHead className="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider min-w-[220px]">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>Recipients</span>
                        </div>
                      </TableHead>
                    )}

                    {columnVisibility.created && (
                      <TableHead className="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider min-w-[140px]">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>Created</span>
                        </div>
                      </TableHead>
                    )}

                    {columnVisibility.sent && (
                      <TableHead className="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider min-w-[140px]">
                        <div className="flex items-center space-x-2">
                          <Send className="w-3.5 h-3.5 text-gray-400" />
                          <span>Sent</span>
                        </div>
                      </TableHead>
                    )}

                    <TableHead className="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider min-w-[120px]">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider min-w-[140px]">
                      Actions
                    </TableHead>

                    {columnVisibility.attachments && (
                      <TableHead className="px-6 py-4 text-right font-semibold text-gray-700 text-xs uppercase tracking-wider min-w-[120px]">
                        <div className="flex items-center justify-end space-x-2">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
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
                        className={`border-b border-gray-100 transition-all duration-150 ${isBlocked ? "bg-gray-50/50" : "hover:bg-gray-50/70 hover:shadow-sm"}`}
                      >
                        <TableCell className="px-6 py-4">
                          <div className={`space-y-1.5 ${isBlocked ? "opacity-60" : ""}`}>
                            <div className="font-semibold text-gray-900 text-sm">{email.to}</div>
                            <div className="space-y-0.5">
                              {email.subject.split(" - ").map((part, idx) => (
                                <div
                                  key={idx}
                                  className={idx === 0 ? "text-xs font-medium text-gray-700" : "text-xs text-gray-500"}
                                >
                                  {part}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>

                        {columnVisibility.user && (
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-9 w-9 ring-2 ring-gray-100 shadow-sm">
                                <AvatarImage
                                  src={`/.jpg?key=ipb34&height=32&width=32&query=${getUserInitials(email.user)}`}
                                  alt={getUserName(email.user)}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-[#16659e]/10 to-[#16659e]/5 text-[#16659e] text-xs font-semibold">
                                  {getUserInitials(email.user)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={isBlocked ? "opacity-60" : ""}>
                                <p className="text-xs text-gray-600 font-medium">{email.user || "No email"}</p>
                              </div>
                            </div>
                          </TableCell>
                        )}

                        {columnVisibility.recipients && (
                          <TableCell className="px-6 py-4">
                            <div className={`flex flex-wrap gap-1.5 ${isBlocked ? "opacity-60" : ""}`}>
                              {email.recipient_emails?.slice(0, 2).map((recipient, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs bg-[#16659e]/10 text-[#16659e] border border-[#16659e]/20 font-medium px-2.5 py-0.5"
                                >
                                  {recipient.replace(/"/g, "")}
                                </Badge>
                              ))}
                              {email.recipient_emails && email.recipient_emails.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-white text-gray-600 border-gray-200 font-medium"
                                >
                                  +{email.recipient_emails.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        )}

                        {columnVisibility.created && (
                          <TableCell className="px-6 py-4">
                            <div className={`text-sm text-gray-700 font-medium ${isBlocked ? "opacity-60" : ""}`}>
                              {formatDateShort(email.created_at)}
                            </div>
                          </TableCell>
                        )}

                        {columnVisibility.sent && (
                          <TableCell className="px-6 py-4">
                            <div className={`text-sm text-gray-700 font-medium ${isBlocked ? "opacity-60" : ""}`}>
                              {!email.is_sent && new Date(email.sent_at) < new Date()
                                ? "---"
                                : formatDateShort(email.sent_at)}
                            </div>
                          </TableCell>
                        )}

                        <TableCell className="px-6 py-4">
                          <Badge className={`${statusConfig.className} font-medium text-xs px-3 py-1 rounded-full`}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-6 py-4">
                          <div className="flex gap-2">
                            {email.blocked ? (
                              <button
                                onClick={() => !blockingStates[email.id] && handleBlockUnblock(email.id, false)}
                                disabled={blockingStates[email.id]}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:scale-105 border border-emerald-200 rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                              >
                                {blockingStates[email.id] ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                <span>Unblock</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => !blockingStates[email.id] && handleBlockUnblock(email.id, true)}
                                disabled={blockingStates[email.id]}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:scale-105 border border-slate-200 rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                              >
                                {blockingStates[email.id] ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Ban className="h-3.5 w-3.5" />
                                )}
                                <span>Block</span>
                              </button>
                            )}
                          </div>
                        </TableCell>

                        {columnVisibility.attachments && (
                          <TableCell className="px-6 py-4">
                            <div className="flex justify-end items-center gap-2">
                              {email.attachments && email.attachments.length > 0 ? (
                                <>
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-white text-gray-600 border-gray-200 font-medium px-2 py-0.5"
                                  >
                                    {email.attachments.length}
                                  </Badge>
                                  {email.attachments.slice(0, 1).map((file, idx) => (
                                    <a
                                      key={idx}
                                      href={getAttachmentUrl(file)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                                        isBlocked
                                          ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                                          : "text-slate-600 hover:text-[#16659e] hover:bg-[#16659e]/10 hover:scale-110 border border-transparent hover:border-[#16659e]/20 hover:shadow-md"
                                      }`}
                                      onClick={isBlocked ? (e) => e.preventDefault() : undefined}
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  ))}
                                </>
                              ) : (
                                <span className={`text-xs text-gray-400 ${isBlocked ? "opacity-60" : ""}`}>
                                  No files
                                </span>
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

          {!isLoading && sentEmails.length > 0 && (
            <div className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-b-xl">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) onPageChange(currentPage - 1)
                      }}
                      className={`${
                        currentPage <= 1 ? "pointer-events-none opacity-50" : "hover:bg-white hover:shadow-sm"
                      } transition-all duration-200 border-gray-200`}
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
                            className={
                              currentPage === 1
                                ? "bg-[#16659e] text-white font-semibold shadow-sm hover:bg-[#16659e]/90"
                                : "hover:bg-white hover:shadow-sm transition-all duration-200"
                            }
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
                            className={
                              currentPage === i
                                ? "bg-[#16659e] text-white font-semibold shadow-sm hover:bg-[#16659e]/90"
                                : "hover:bg-white hover:shadow-sm transition-all duration-200"
                            }
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
                            className={
                              currentPage === totalPages
                                ? "bg-[#16659e] text-white font-semibold shadow-sm hover:bg-[#16659e]/90"
                                : "hover:bg-white hover:shadow-sm transition-all duration-200"
                            }
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
                      className={`${
                        currentPage >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-white hover:shadow-sm"
                      } transition-all duration-200 border-gray-200`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
