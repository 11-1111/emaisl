"use client"

import { useState, useEffect, Suspense } from "react"
import EmailComposer from "@/components/email-composer"
import SentEmailsTable from "@/components/sent-emails-table"
import MerchantManagement from "@/components/merchant-management"
import UploadedRecordsTable from "@/components/uploaded-records-table"
import TransactionsTable from "@/components/transactions-table"
import GeneratedRecordsTable from "@/components/generated-records-table"
import type { Merchant, SentEmail } from "@/lib/types/types"
import { useSearchParams, useRouter } from 'next/navigation'
import { getAccessToken } from "@/lib/auth"
import { Mail, Send, Users, Bell, LogOut, Menu, X, Upload, Receipt, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Loading fallback component
const TabContentLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-pulse space-y-4 w-full max-w-3xl">
      <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
      <div className="h-64 bg-gray-200 rounded-lg w-full"></div>
      <div className="h-12 bg-gray-200 rounded-lg w-2/3"></div>
    </div>
  </div>
)

export default function Home() {
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [token, setToken] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    setUserName(localStorage.getItem("userName"))
    setUserEmail(localStorage.getItem("userEmail"))
  }, [])

  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "compose"
  const [activeTab, setActiveTab] = useState(tab)

  const router = useRouter()

  const [isLoading, setIsLoading] = useState({
    sentEmails: true,
  })

  const [error, setError] = useState({
    sentEmails: false,
  })

  const [page, setPage] = useState<number>(1)
  const [size] = useState<number>(5)
  const [totalPages, setTotalPages] = useState<number>(1)

  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    [tab]: true,
  })

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSidebarOpen(false)
    setVisitedTabs((prev) => ({
      ...prev,
      [value]: true,
    }))
    router.push(`/dashboard?tab=${value}`, { scroll: false })
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("tokenExpiry")
    router.push("/")
  }

  const handleEmailUpdate = (emailId: number, blocked: boolean) => {
    setSentEmails((prevEmails) => prevEmails.map((email) => (email.id === emailId ? { ...email, blocked } : email)))
  }

  const refetchSentEmails = async () => {
    if (!token) return

    try {
      setIsLoading((prev) => ({ ...prev, sentEmails: true }))
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/emails?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/")
          return
        }
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setSentEmails(data.data)
      setTotalPages(data.meta.totalPages || 1)
      setError((prev) => ({ ...prev, sentEmails: false }))
    } catch (error) {
      console.error("Error fetching sent emails:", error)
      setError((prev) => ({ ...prev, sentEmails: true }))
    } finally {
      setIsLoading((prev) => ({ ...prev, sentEmails: false }))
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = localStorage.getItem("tokenExpiry")
      if (expiry && new Date().getTime() > Number.parseInt(expiry)) {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("tokenExpiry")
        router.push("/")
      }
    }, 1000 * 60)

    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      router.push("/")
    } else {
      setToken(token)
    }
  }, [router])

  useEffect(() => {
    setActiveTab(tab)
    setVisitedTabs((prev) => ({
      ...prev,
      [tab]: true,
    }))
  }, [tab])

  useEffect(() => {
    if (!token) return

    const fetchSentEmails = async () => {
      if (tab === "sent" || visitedTabs.sent) {
        try {
          setIsLoading((prev) => ({ ...prev, sentEmails: true }))
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/emails?page=${page}&size=${size}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (!response.ok) {
            if (response.status === 401) {
              router.push("/")
              return
            }
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          const data = await response.json()
          setSentEmails(data.data)
          setTotalPages(data.meta.totalPages || 1)
          setError((prev) => ({ ...prev, sentEmails: false }))
        } catch (error) {
          console.error("Error fetching sent emails:", error)
          setError((prev) => ({ ...prev, sentEmails: true }))
        } finally {
          setIsLoading((prev) => ({ ...prev, sentEmails: false }))
        }
      }
    }

    fetchSentEmails()
  }, [page, size, router, token, tab, visitedTabs])

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "AD"

    const namePart = email.split("@")[0]
    const nameSegments = namePart.split(/[.\-_]/)

    if (nameSegments.length === 1) {
      return nameSegments[0].substring(0, 2).toUpperCase()
    }

    return ((nameSegments[0]?.[0] || "") + (nameSegments[1]?.[0] || "")).toUpperCase()
  }

  const menuItems = [
    { id: "compose", label: "Compose", icon: Mail },
    { id: "sent", label: "Sent Emails", icon: Send },
    { id: "merchant", label: "Merchants", icon: Users },
    { id: "uploads", label: "Uploaded Records", icon: Upload },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "generated", label: "Generated Records", icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50 flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 lg:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#16659e] to-[#1e7bb8] rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-900">Email Scheduler</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="hidden lg:flex items-center space-x-3 p-6 border-b border-gray-200/50">
          <div className="w-10 h-10 bg-gradient-to-r from-[#16659e] to-[#1e7bb8] rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Email Scheduler</h2>
            <p className="text-xs text-gray-500">Management Portal</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[#16659e] to-[#1e7bb8] text-white shadow-lg shadow-[#16659e]/25"
                    : "text-gray-600 hover:bg-gray-100/80"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                <div className="lg:block hidden">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Email Management
                  </h1>
                  <p className="text-sm text-gray-500">Email automation platform</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                        <AvatarFallback className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] text-white">
                          {getInitials(userEmail)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName || "Admin User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {error.sentEmails && (
            <div className="mb-6 sm:mb-8 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800">Demo Mode Active</p>
                  <p className="text-sm text-amber-700">
                    Could not connect to the sent emails API. Showing sample data instead.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {activeTab === "compose" && (
              <Suspense fallback={<TabContentLoader />}>
                <EmailComposer />
              </Suspense>
            )}

            {activeTab === "sent" && (
              <Suspense fallback={<TabContentLoader />}>
                <SentEmailsTable
                  sentEmails={sentEmails}
                  isLoading={isLoading.sentEmails}
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setPage(newPage)}
                  onEmailUpdate={handleEmailUpdate}
                  onRefresh={refetchSentEmails}
                />
              </Suspense>
            )}

            {activeTab === "merchant" && (
              <Suspense fallback={<TabContentLoader />}>
                <MerchantManagement />
              </Suspense>
            )}

            {activeTab === "uploads" && (
              <Suspense fallback={<TabContentLoader />}>
                <UploadedRecordsTable />
              </Suspense>
            )}

            {activeTab === "transactions" && (
              <Suspense fallback={<TabContentLoader />}>
                <TransactionsTable />
              </Suspense>
            )}

            {activeTab === "generated" && (
              <Suspense fallback={<TabContentLoader />}>
                <GeneratedRecordsTable />
              </Suspense>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
