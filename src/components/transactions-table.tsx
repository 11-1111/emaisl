"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search, FileSpreadsheet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { getAccessToken } from "@/lib/auth"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Transaction {
  id: number
  originalName: string
  recordType: string
  processedAt: string
  date: string
  paymentMethod: string
  confirmationCode: string
  currency: string
  amount: number
  commission: number
  netAmount: number
  buyerName: string
  paymentCardNumber: string
  reference: string
  description: string
  createdAt: string
  updatedAt: string
}

interface PaginationMeta {
  total: number
  page: number
  size: number
  totalPages: number
}

interface ApiResponse {
  data: Transaction[]
  meta: PaginationMeta
}

export default function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    size: 25,
    totalPages: 1,
  })

  const fetchTransactions = async (page: number = currentPage, size: number = pageSize) => {
    setIsLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/app/emails/transactions?page=${page}&size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }

      const apiResponse: ApiResponse = await response.json()
      setTransactions(apiResponse.data)
      setPaginationMeta(apiResponse.meta)
      setCurrentPage(apiResponse.meta.page)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginationMeta.totalPages) {
      setCurrentPage(newPage)
      fetchTransactions(newPage, pageSize)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchTransactions(1, newSize)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const query = searchQuery.toLowerCase()
    return (
      transaction.confirmationCode.toLowerCase().includes(query) ||
      transaction.reference.toLowerCase().includes(query) ||
      transaction.description.toLowerCase().includes(query) ||
      transaction.paymentMethod.toLowerCase().includes(query) ||
      transaction.paymentCardNumber.toLowerCase().includes(query)
    )
  })

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getPaginationRange = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= paginationMeta.totalPages; i++) {
      if (i === 1 || i === paginationMeta.totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i)
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push("...")
        }
      }
      rangeWithDots.push(i)
      l = i
    })

    return rangeWithDots
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm !py-0">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Transactions</CardTitle>
              <CardDescription>View and search transaction records from Excel uploads</CardDescription>
            </div>
          </div>
          <Button onClick={() => fetchTransactions()} disabled={isLoading} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by confirmation code, reference, description, payment method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-sm text-gray-500">Loading transactions...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-[75vw] md:max-w-[85vw] border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table className="excel-table">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 hover:bg-slate-100">
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[60px]">originalName</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[140px]">Date</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[120px]">Payment Method</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[140px]">Confirmation Code</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[80px]">Currency</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[120px] text-right">Amount</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[120px] text-right">Commission</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[120px] text-right">Net Amount</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[140px]">Card Number</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[180px]">Reference</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[200px]">Description</TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[140px]">Processed At</TableHead>
                   
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                        {searchQuery ? "No transactions found matching your search." : "No transactions available."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction, index) => (
                      <TableRow
                        key={transaction.id}
                        className={`hover:bg-emerald-50/50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                        }`}
                      >
                        <TableCell className="font-mono text-xs border-r border-slate-200 max-w-[150px] truncate overflow-hidden text-ellipsis">
                               <Tooltip>
      <TooltipTrigger asChild>
        <span> {transaction.originalName}</span>
        
      </TooltipTrigger>
      <TooltipContent className="py-4">
         {transaction.originalName}
      </TooltipContent>
    </Tooltip>

 
</TableCell>
                        <TableCell className="font-mono text-xs border-r border-slate-200 whitespace-nowrap">
                          {transaction.date}
                        </TableCell>
                        <TableCell className="border-r border-slate-200">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs">
                            {transaction.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs border-r border-slate-200">
                          {transaction.confirmationCode}
                        </TableCell>
                        <TableCell className="font-mono text-xs border-r border-slate-200 font-semibold">
                          {transaction.currency}
                        </TableCell>
                        <TableCell className="font-mono text-xs border-r border-slate-200 text-right font-semibold">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </TableCell>
                        <TableCell className="font-mono text-xs border-r border-slate-200 text-right">
                          {formatCurrency(transaction.commission, transaction.currency)}
                        </TableCell>
                        <TableCell className="font-mono text-xs border-r border-slate-200 text-right font-semibold text-emerald-700">
                          {formatCurrency(transaction.netAmount, transaction.currency)}
                        </TableCell>
                        <TableCell className="font-mono text-xs border-r border-slate-200">
                          {transaction.paymentCardNumber}
                        </TableCell>
                        <TableCell className="font-mono text-xs border-r border-slate-200">
                          {transaction.reference}
                        </TableCell>
                        <TableCell className="text-xs border-r border-slate-200 max-w-[200px] truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="text-xs border-r border-slate-200 whitespace-nowrap text-gray-600">
                          {formatDistanceToNow(new Date(transaction.processedAt), { addSuffix: true })}
                        </TableCell>
                       
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {paginationMeta.total === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * pageSize, paginationMeta.total)}
              </span>{" "}
              of <span className="font-semibold text-gray-900">{paginationMeta.total}</span> transactions
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-50"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {getPaginationRange().map((page, index) => {
                if (page === "...") {
                  return (
                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                      ...
                    </span>
                  )
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    disabled={isLoading}
                    className={
                      currentPage === page
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        : "hover:bg-emerald-50 hover:border-emerald-400"
                    }
                  >
                    {page}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === paginationMeta.totalPages || isLoading}
              className="hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(paginationMeta.totalPages)}
              disabled={currentPage === paginationMeta.totalPages || isLoading}
              className="hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-50"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
