"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  RefreshCw,
  Search,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  ChevronDown,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getAccessToken } from "@/lib/auth"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

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

interface FilterState {
  date: string
  paymentMethod: string
  confirmationCode: string
  currency: string
  minAmount: string
  maxAmount: string
  buyerName: string
  recordType: string
  originalName: string
  reference: string
  description: string
}

const initialFilterState: FilterState = {
  date: "",
  paymentMethod: "",
  confirmationCode: "",
  currency: "",
  minAmount: "",
  maxAmount: "",
  buyerName: "",
  recordType: "",
  originalName: "",
  reference: "",
  description: "",
}

export default function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(initialFilterState)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilterState)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    size: 25,
    totalPages: 1,
  })

  const fetchTransactions = useCallback(
    async (page: number = currentPage, size: number = pageSize, filterParams: FilterState = appliedFilters) => {
      setIsLoading(true)
      try {
        const token = getAccessToken()

        // Build query parameters
        const params = new URLSearchParams()
        params.append("page", page.toString())
        params.append("size", size.toString())

        // Add filter parameters if they have values
        if (filterParams.date) params.append("date", filterParams.date)
        if (filterParams.paymentMethod) params.append("paymentMethod", filterParams.paymentMethod)
        if (filterParams.confirmationCode) params.append("confirmationCode", filterParams.confirmationCode)
        if (filterParams.currency) params.append("currency", filterParams.currency)
        if (filterParams.minAmount) params.append("minAmount", filterParams.minAmount)
        if (filterParams.maxAmount) params.append("maxAmount", filterParams.maxAmount)
        if (filterParams.buyerName) params.append("buyerName", filterParams.buyerName)
        if (filterParams.recordType) params.append("recordType", filterParams.recordType)
        if (filterParams.originalName) params.append("originalName", filterParams.originalName)
        if (filterParams.reference) params.append("reference", filterParams.reference)
        if (filterParams.description) params.append("description", filterParams.description)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/app/emails/transactions?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
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
    },
    [currentPage, pageSize, appliedFilters],
  )

  useEffect(() => {
    fetchTransactions(1, pageSize, appliedFilters)
  }, [appliedFilters])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginationMeta.totalPages) {
      setCurrentPage(newPage)
      fetchTransactions(newPage, pageSize, appliedFilters)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchTransactions(1, newSize, appliedFilters)
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
    setAppliedFilters(filters)
  }

  const handleClearFilters = () => {
    setFilters(initialFilterState)
    setAppliedFilters(initialFilterState)
    setCurrentPage(1)
  }

  const activeFilterCount = Object.values(appliedFilters).filter((v) => v !== "").length

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
    const rangeWithDots: (string | number)[] = []
    let l: number

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
          <Button
            onClick={() => fetchTransactions(currentPage, pageSize, appliedFilters)}
            disabled={isLoading}
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && <Badge className="ml-1 bg-emerald-500 text-white">{activeFilterCount}</Badge>}
                <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
              {/* Text search filters */}
              <div className="space-y-2">
                <Label htmlFor="filter-date" className="text-xs font-medium text-gray-600">
                  Date
                </Label>
                <Input
                  id="filter-date"
                  placeholder="Search date..."
                  value={filters.date}
                  onChange={(e) => handleFilterChange("date", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-buyerName" className="text-xs font-medium text-gray-600">
                  Buyer Name
                </Label>
                <Input
                  id="filter-buyerName"
                  placeholder="Search buyer..."
                  value={filters.buyerName}
                  onChange={(e) => handleFilterChange("buyerName", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-paymentMethod" className="text-xs font-medium text-gray-600">
                  Payment Method
                </Label>
                <Input
                  id="filter-paymentMethod"
                  placeholder="Search method..."
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange("paymentMethod", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-confirmationCode" className="text-xs font-medium text-gray-600">
                  Confirmation Code
                </Label>
                <Input
                  id="filter-confirmationCode"
                  placeholder="Search code..."
                  value={filters.confirmationCode}
                  onChange={(e) => handleFilterChange("confirmationCode", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-currency" className="text-xs font-medium text-gray-600">
                  Currency (exact)
                </Label>
                <Input
                  id="filter-currency"
                  placeholder="e.g. USD"
                  value={filters.currency}
                  onChange={(e) => handleFilterChange("currency", e.target.value.toUpperCase())}
                  className="h-9 text-sm"
                  maxLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-originalName" className="text-xs font-medium text-gray-600">
                  Original Name
                </Label>
                <Input
                  id="filter-originalName"
                  placeholder="Search file name..."
                  value={filters.originalName}
                  onChange={(e) => handleFilterChange("originalName", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-reference" className="text-xs font-medium text-gray-600">
                  Reference
                </Label>
                <Input
                  id="filter-reference"
                  placeholder="Search reference..."
                  value={filters.reference}
                  onChange={(e) => handleFilterChange("reference", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-description" className="text-xs font-medium text-gray-600">
                  Description
                </Label>
                <Input
                  id="filter-description"
                  placeholder="Search description..."
                  value={filters.description}
                  onChange={(e) => handleFilterChange("description", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Amount range filters */}
              <div className="space-y-2">
                <Label htmlFor="filter-minAmount" className="text-xs font-medium text-gray-600">
                  Min Amount
                </Label>
                <Input
                  id="filter-minAmount"
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                  className="h-9 text-sm"
                  min={0}
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-maxAmount" className="text-xs font-medium text-gray-600">
                  Max Amount
                </Label>
                <Input
                  id="filter-maxAmount"
                  type="number"
                  placeholder="0.00"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                  className="h-9 text-sm"
                  min={0}
                  step="0.01"
                />
              </div>

              {/* Record type select */}
              <div className="space-y-2">
                <Label htmlFor="filter-recordType" className="text-xs font-medium text-gray-600">
                  Record Type
                </Label>
                <Select
                  value={filters.recordType}
                  onValueChange={(value) => handleFilterChange("recordType", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="DATA">DATA</SelectItem>
                    <SelectItem value="SUMMARY">SUMMARY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Apply button */}
              <div className="flex items-end">
                <Button
                  onClick={handleApplyFilters}
                  className="w-full h-9 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active filters display */}
        {activeFilterCount > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(appliedFilters).map(([key, value]) => {
              if (!value) return null
              const labelMap: Record<string, string> = {
                date: "Date",
                paymentMethod: "Payment Method",
                confirmationCode: "Confirmation Code",
                currency: "Currency",
                minAmount: "Min Amount",
                maxAmount: "Max Amount",
                buyerName: "Buyer Name",
                recordType: "Record Type",
                originalName: "Original Name",
                reference: "Reference",
                description: "Description",
              }
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="gap-1 pl-2 pr-1 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                >
                  <span className="text-xs font-medium">{labelMap[key]}:</span>
                  <span className="text-xs">{value}</span>
                  <button
                    onClick={() => {
                      const newFilters = { ...appliedFilters, [key]: "" }
                      setFilters(newFilters)
                      setAppliedFilters(newFilters)
                    }}
                    className="ml-1 p-0.5 hover:bg-emerald-300 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        )}

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
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[60px]">
                      originalName
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[140px]">
                      Date
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[120px]">
                      Payment Method
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[140px]">
                      Confirmation Code
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[80px]">
                      Currency
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[120px] text-right">
                      Amount
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[120px] text-right">
                      Commission
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[120px] text-right">
                      Net Amount
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[140px]">
                      Card Number
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[180px]">
                      Reference
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[200px]">
                      Description
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[140px]">
                      Processed At
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                        {activeFilterCount > 0
                          ? "No transactions found matching your filters."
                          : "No transactions available."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction, index) => (
                      <TableRow
                        key={transaction.id}
                        className={`hover:bg-emerald-50/50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                        }`}
                      >
                        <TableCell className="font-mono text-xs border-r border-slate-200'">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span> {transaction.originalName}</span>
                              </TooltipTrigger>
                              <TooltipContent className="py-4">{transaction.originalName}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="font-mono text-xs border-r border-slate-200 whitespace-nowrap">
                          {transaction.date}
                        </TableCell>
                        <TableCell className="border-r border-slate-200">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs"
                          >
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
