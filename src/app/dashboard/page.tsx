"use client"

import { useState, useEffect, useTransition, Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmailComposer from "@/components/email-composer"
import SentEmailsTable from "@/components/sent-emails-table"
import MerchantManagement from "@/components/merchant-management"
import type { Merchant, SentEmail } from "@/lib/types/types"
import { useSearchParams, useRouter } from "next/navigation"
import { getAccessToken } from "@/lib/auth"
import { Mail, Send, Users, Bell, LogOut } from "lucide-react"
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
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [token, setToken] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

const [userName, setUserName] = useState<string | null>(null)
const [userEmail, setUserEmail] = useState<string | null>(null)

useEffect(() => {
  setUserName(localStorage.getItem("userName"))
  setUserEmail(localStorage.getItem("userEmail"))
}, [])

  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "compose"

  // Track active tab in local state to avoid full re-renders
  const [activeTab, setActiveTab] = useState(tab)

  const router = useRouter()

  const [isLoading, setIsLoading] = useState({
    merchants: true,
    sentEmails: true,
  })

  const [error, setError] = useState({
    merchants: false,
    sentEmails: false,
  })

  const [page, setPage] = useState<number>(1)
  const [size] = useState<number>(5)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Track which tabs have been visited to keep their content loaded
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    [tab]: true,
  })

  // Optimized tab change handler
  const handleTabChange = (value: string) => {
    // Update local state immediately for a snappy UI
    setActiveTab(value)

    // Mark this tab as visited
    setVisitedTabs((prev) => ({
      ...prev,
      [value]: true,
    }))

    // Update URL in the background with useTransition
    startTransition(() => {
      router.push(`/dashboard?tab=${value}`, { scroll: false })
    })
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("tokenExpiry")
    router.push("/")
  }

  // Function to handle email updates from the table component
  const handleEmailUpdate = (emailId: number, blocked: boolean) => {
    setSentEmails((prevEmails) => prevEmails.map((email) => (email.id === emailId ? { ...email, blocked } : email)))
  }

  // Function to refetch sent emails data
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

  // Session expiry check
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

  // Get token on client only
  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      router.push("/")
    } else {
      setToken(token)
    }
  }, [router])

  // Sync local activeTab state with URL param
  useEffect(() => {
    setActiveTab(tab)
    setVisitedTabs((prev) => ({
      ...prev,
      [tab]: true,
    }))
  }, [tab])

  // Preload data for all tabs
  useEffect(() => {
    if (!token) return

    // Always fetch merchants data since it's needed for multiple tabs
    const fetchMerchants = async () => {
      if (!isLoading.merchants) return // Skip if already loaded

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/merchants`, {
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
        setMerchants(data)
        setError((prev) => ({ ...prev, merchants: false }))
      } catch (error) {
        console.error("Error fetching merchants:", error)
        setError((prev) => ({ ...prev, merchants: true }))
      } finally {
        setIsLoading((prev) => ({ ...prev, merchants: false }))
      }
    }

    const fetchSentEmails = async () => {
      // Only fetch if we're on the sent tab or it's been visited before
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

    fetchMerchants()
    fetchSentEmails()
  }, [page, size, router, token, tab, visitedTabs, isLoading.merchants])

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "AD"

    const namePart = email.split("@")[0]
    const nameSegments = namePart.split(/[.\-_]/) // split by dot, dash, or underscore

    if (nameSegments.length === 1) {
      return nameSegments[0].substring(0, 2).toUpperCase()
    }

    return ((nameSegments[0]?.[0] || "") + (nameSegments[1]?.[0] || "")).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#16659e] to-[#1e7bb8] rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Email Management
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Email automation platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
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

      <main className="container mx-auto py-4 sm:py-8 px-4 sm:px-6">
        {(error.merchants || error.sentEmails) && (
          <div className="mb-6 sm:mb-8 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">Demo Mode Active</p>
                <p className="text-sm text-amber-700">
                  {error.merchants && "Could not connect to the merchants API. "}
                  {error.sentEmails && "Could not connect to the sent emails API. "}
                  Showing sample data instead.
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Responsive Tab Navigation */}
          <div className="flex justify-center mb-8 sm:mb-12">
            <TabsList className="inline-flex h-12 sm:h-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white/60 backdrop-blur-xl p-1 sm:p-2 shadow-lg border border-white/20 w-full max-w-full sm:max-w-fit overflow-x-auto">
              <TabsTrigger
                value="compose"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#16659e] data-[state=active]:to-[#1e7bb8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#16659e]/25 data-[state=active]:scale-105 hover:bg-gray-100/80 text-gray-600 data-[state=active]:text-white flex-1 sm:flex-none sm:min-w-[120px] lg:min-w-[140px]"
              >
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden md:inline">Compose</span>
                <span className="md:hidden">New</span>
              </TabsTrigger>
              <TabsTrigger
                value="sent"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#16659e] data-[state=active]:to-[#1e7bb8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#16659e]/25 data-[state=active]:scale-105 hover:bg-gray-100/80 text-gray-600 data-[state=active]:text-white flex-1 sm:flex-none sm:min-w-[120px] lg:min-w-[140px]"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden md:inline">Sent Emails</span>
                <span className="md:hidden">Sent</span>
              </TabsTrigger>
              <TabsTrigger
                value="merchant"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#16659e] data-[state=active]:to-[#1e7bb8] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#16659e]/25 data-[state=active]:scale-105 hover:bg-gray-100/80 text-gray-600 data-[state=active]:text-white flex-1 sm:flex-none sm:min-w-[120px] lg:min-w-[140px]"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden md:inline">Merchants</span>
                <span className="md:hidden">Users</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content with Smooth Transitions */}
          <div className="space-y-6 sm:space-y-8 tab-content-container">
            {/* Keep all tabs in DOM but hide inactive ones for instant switching */}
            <TabsContent value="compose" className="mt-0 tab-content-transition" forceMount={visitedTabs.compose ? true : undefined}>
              <div className={activeTab === "compose" ? "opacity-100" : "opacity-0 absolute pointer-events-none"}>
                <Suspense fallback={<TabContentLoader />}>
                  <EmailComposer merchants={merchants} isLoading={isLoading.merchants} />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="sent" className="mt-0 tab-content-transition" forceMount={visitedTabs.sent ? true : undefined}>
              <div className={activeTab === "sent" ? "opacity-100" : "opacity-0 absolute pointer-events-none"}>
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
              </div>
            </TabsContent>

            <TabsContent value="merchant" className="mt-0 tab-content-transition" forceMount={visitedTabs.merchant ? true : undefined}>
              <div className={activeTab === "merchant" ? "opacity-100" : "opacity-0 absolute pointer-events-none"}>
                <Suspense fallback={<TabContentLoader />}>
                  <MerchantManagement />
                </Suspense>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}
