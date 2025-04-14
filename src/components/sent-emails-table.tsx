"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { Download, ExternalLink, Loader2 } from "lucide-react"
import type { SentEmail } from "@/lib/types/types"

interface SentEmailsTableProps {
  sentEmails: SentEmail[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}
export default function SentEmailsTable({
  sentEmails,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
}: SentEmailsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Check if the date is invalid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };


  const getFileName = (path: string) => {
    if (!path) return "Unknown file";
    const lastSegment = path.split("\\").pop() || path.split("/").pop() || path;
    return lastSegment.split("?")[0];
  };

  const getAttachmentUrl = (attachmentFileName: string | undefined) => {
    if (!attachmentFileName) return "";

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    // const baseUrl ="http://localhost:3000";
    return `${baseUrl}/api/attachments/${attachmentFileName}`;
  };



  return (
    <Card>
      <CardHeader>
        <CardTitle>Sent Emails</CardTitle>
        <CardDescription>View a history of all emails sent through the system</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sentEmails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No emails have been sent yet.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table className="px-10">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-8">Merchant</TableHead>
                  <TableHead className="px-8">Subject</TableHead>
                  <TableHead className="px-8">Recipients</TableHead>
                  <TableHead className="px-8">Attachments</TableHead>
                  <TableHead className="px-8">Sent At</TableHead>
                  <TableHead className="px-8">Created At</TableHead>
                  <TableHead className="px-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentEmails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="px-4"

                    >{email.to}</TableCell>
                    <TableCell className="px-8 py-6" >{email.subject}</TableCell>
                    <TableCell className="px-8 py-6" >
                      {email.recipient_emails?.map((recipient, idx) => (
                        <div key={idx}>{recipient.replace(/"/g, "")}</div>
                      ))}
                    </TableCell>
                    <TableCell className="px-8 py-6" >
                      {email.attachments && email.attachments.length > 0 ? (
                        email.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={getAttachmentUrl(file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:underline"
                          >
                            <Download className="w-4 h-4" />
                            <span>{file}</span>
                          </a>
                        ))
                      ) : (
                        <span className="text-muted-foreground">No attachments</span>
                      )}
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      {!email.is_sent && new Date(email.sent_at) < new Date() ? (
                        "---"
                      ) : (
                        formatDate(email.sent_at)
                      )}
                    </TableCell>

                    {/* <TableCell className="px-8 py-6" >{formatDate(email.sent_at)}</TableCell> */}

                    <TableCell className="px-8 py-6" >{formatDate(email.created_at)}</TableCell>
                    <TableCell className="px-8 py-6" >
                      <span
                        className={
                          email.is_sent
                            ? "text-green-600 font-medium"
                            : "text-yellow-600 font-medium"
                        }
                      >
                        {email.is_sent ? "Sent" : "Queued"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Pagination className="pt-5">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) onPageChange(currentPage - 1);
                }}
              />
            </PaginationItem>

            {(() => {
              const pageNumbers = [];
              const maxVisiblePages = 5;
              const showEllipsis = totalPages > maxVisiblePages;

              let start = Math.max(currentPage - 2, 1);
              let end = Math.min(start + maxVisiblePages - 1, totalPages);

              if (end - start < maxVisiblePages - 1) {
                start = Math.max(end - maxVisiblePages + 1, 1);
              }

              // the first page
              if (start > 1) {
                pageNumbers.push(
                  <PaginationItem key={1}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === 1}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(1);
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                );
                if (start > 2) {
                  pageNumbers.push(<PaginationEllipsis key="start-ellipsis" />);
                }
              }

              // Show middle pages
              for (let i = start; i <= end; i++) {
                pageNumbers.push(
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(i);
                      }}
                    >
                      {i}
                    </PaginationLink>
                  </PaginationItem>
                );
              }

              //the last page
              if (end < totalPages) {
                if (end < totalPages - 1) {
                  pageNumbers.push(<PaginationEllipsis key="end-ellipsis" />);
                }
                pageNumbers.push(
                  <PaginationItem key={totalPages}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === totalPages}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(totalPages);
                      }}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                );
              }

              return pageNumbers;
            })()}


            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) onPageChange(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>


      </CardContent>
    </Card>
  )
}
