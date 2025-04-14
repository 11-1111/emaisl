"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmailComposer from "@/components/email-composer"
import SentEmailsTable from "@/components/sent-emails-table"
import MerchantManagement from "@/components/merchant-management"
import type { Merchant, SentEmail } from "@/lib/types/types"
import { useRouter } from "next/navigation"
import { getAccessToken } from "@/lib/auth"

export default function Home() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const router = useRouter()
  const token = getAccessToken()

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

  // Fetch data
  useEffect(() => {
    const fetchMerchants = async () => {
      console.log("AccessToken for fetching merchants:", token)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/merchants`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        console.log("apiiiiiiiiiiiiiiiiiii:" ,response)
        if (!response.ok) {
          console.log(response)
          if (response.status === 401) {
            console.log("Session expired based on API response")
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
          `${process.env.NEXT_PUBLIC_API_URL}/api/emails?page=${page}&size=${size}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          if (response.status === 401) {
            console.log("Session expired based on API response")
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
    fetchSentEmails()
  }, [page, size, router, token])

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-row w-full justify-between">
        <h1 className="text-3xl font-bold mb-8">Email Management System</h1>
        <MerchantManagement />
      </div>

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

      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="compose">Compose Email</TabsTrigger>
          <TabsTrigger value="sent">Sent Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <EmailComposer merchants={merchants} isLoading={isLoading.merchants} />
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
      </Tabs>
    </main>
  )
}
