"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmailComposer from "@/components/email-composer"
import SentEmailsTable from "@/components/sent-emails-table"
import MerchantManagement from "@/components/merchant-management"
import type { Merchant, SentEmail } from "@/lib/types/types"
import { useSearchParams, useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth"

export default function Home() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [token, setToken] = useState<string | null>(null)
  // const [tab, setTab] = useState('compose')

  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "compose";

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

  const handleTabChange = (value: string) => {
    router.push(`/dashboard?tab=${value}`)
  }
  
  // Session expiry check
  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = localStorage.getItem("tokenExpiry")
      if (expiry && new Date().getTime() > parseInt(expiry)) {
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

  // Fetch data only when token is available
  useEffect(() => {
    if (!token) return

    const fetchMerchants = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/app/merchants`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
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
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/app/emails?page=${page}&size=${size}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
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

    fetchMerchants()
    // fetchSentEmails()
    if (tab === "sent") {
      fetchSentEmails()
    }
  }, [page, size, router, token, tab])

  return (
    <main className="container bg-slate-50 mx-auto py-10 px-4">
      {/* <div className="flex flex-row w-full justify-between">
        <h1 className="text-3xl font-bold mb-8">Email Management System</h1>
      </div> */}

      {(error.merchants || error.sentEmails) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-6">
          <p className="font-medium">Note: Using demo data</p>
          <p className="text-sm">
            {error.merchants && "Could not connect to the merchants API. "}
            {error.sentEmails && "Could not connect to the sent emails API. "}
            Showing sample data instead.
          </p>
        </div>
      )}

<Tabs value={tab} onValueChange={handleTabChange} className="w-full">
<TabsList className="rounded-[4px] grid w-[80%] ml-[10%] grid-cols-3 mb-8 bg-white items-center justify-center">
  <TabsTrigger
          value="compose"
          className="rounded-[4px] data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-[#d4d4d4] data-[state=active]:scale-110 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:z-10 transition-all duration-300"
        >
    Compose Email
  </TabsTrigger>
  <TabsTrigger
    value="sent"
    className=" rounded-[4px] data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-[#d4d4d4] data-[state=active]:scale-110 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:z-10 transition-all duration-300"
  >
    Sent Emails
  </TabsTrigger>
  <TabsTrigger
    value="merchant"
    className="rounded-[4px] data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-[#d4d4d4]  data-[state=active]:scale-110 data-[state=active]:font-medium data-[state=active]:shadow-sm data-[state=active]:z-10 transition-all duration-300"
  >
    Merchant Management
  </TabsTrigger>
</TabsList>


        <TabsContent value="compose" className="px-20">
          <EmailComposer
            merchants={merchants}
            isLoading={isLoading.merchants}
          />
        </TabsContent>

        <TabsContent value="sent">
          <SentEmailsTable
            sentEmails={sentEmails}
            isLoading={isLoading.sentEmails}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </TabsContent>

        <TabsContent value="merchant" className="px-20">
        <MerchantManagement/>
        </TabsContent>
      </Tabs>
    </main>
  )
}
