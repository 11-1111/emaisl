"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search, FileSpreadsheet } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { getAccessToken } from "@/lib/auth"

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

export default function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const token = getAccessToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/emails/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }

      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const filteredTransactions = transactions.filter((transaction) => {
    const query = searchQuery.toLowerCase()
    return true
  })

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
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
          <Button onClick={fetchTransactions} disabled={isLoading} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
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
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table className="excel-table">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 hover:bg-slate-100">
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200 min-w-[60px]">ID</TableHead>
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
                    <TableHead className="font-bold text-slate-700 min-w-[80px]">Type</TableHead>
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
                        <TableCell className="font-mono text-xs border-r border-slate-200">{transaction.id}</TableCell>
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
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {transaction.recordType}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing <span className="font-semibold">{filteredTransactions.length}</span> of{" "}
            <span className="font-semibold">{transactions.length}</span> transactions
          </p>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="text-emerald-600 hover:text-emerald-700">
              Clear search
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
