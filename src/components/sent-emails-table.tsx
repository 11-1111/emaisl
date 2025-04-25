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
    return `${baseUrl}/app/attachments/${encodeURIComponent(attachmentFileName)}`;
  };

  
function sanitizeFileName(filename: string) {
  const ext = filename.substring(filename.lastIndexOf('.'));
  const base = filename.substring(0, filename.lastIndexOf('.'));
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-${Date.now()}${ext}`;
}



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
          <div className="rounded-md overflow-x-auto">
            <Table className="px-10">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3">Merchant</TableHead>
                  <TableHead className="px-3">Subject</TableHead>
                  <TableHead className="px-3">Recipients</TableHead>
                 
                  <TableHead className="px-3">Created At</TableHead>
                  <TableHead className="px-3">Sent At</TableHead> 
                  <TableHead className="px-3">Status</TableHead>
                  <TableHead className="px-3 text-right">Attachments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentEmails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="px-3 text-[#000] font-[900]"

                    >{email.to}</TableCell>
                   <TableCell className="px-3 py-6 whitespace-normal break-words">
  {email.subject.split(' - ').map((part, idx) => (
    <span key={idx}>
      {part}
      {idx === 0 && <br />} {/* insert <br /> after the first part */}
    </span>
  ))}
</TableCell>
                    <TableCell className="px-3 py-6" >
                      {email.recipient_emails?.map((recipient, idx) => (
                        <div key={idx}>{recipient.replace(/"/g, "")}</div>
                      ))}
                    </TableCell>

                    <TableCell className="px-3 py-6" >{formatDate(email.created_at)}</TableCell>
                    <TableCell className="px-3 py-6">
                      {!email.is_sent && new Date(email.sent_at) < new Date() ? (
                        "---"
                      ) : (
                        formatDate(email.sent_at)
                      )}
                    </TableCell>

                 
                    <TableCell className="px-3 py-6">
  <span
    className={`inline-block px-3 py-1 text-xs font-medium rounded-full 
      ${email.is_sent 
        ? "bg-green-100 text-green-700" 
        : "bg-yellow-100 text-yellow-700"
      }`}
  >
    {email.is_sent ? "Sent" : "Queued"}
  </span>
</TableCell>
                    <TableCell className="px-10 py-6 flex justify-end items-end text-right">
  {email.attachments && email.attachments.length > 0 ? (
    email.attachments.map((file, idx) => (
      <a
        key={idx}
        href={getAttachmentUrl(file)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        <Download className="w-4 h-4" />
      </a>
    ))
  ) : (
    <span className="text-muted-foreground">No attachments</span>
  )}
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
