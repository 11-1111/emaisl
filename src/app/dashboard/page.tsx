"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmailComposer from "@/components/email-composer"
import SentEmailsTable from "@/components/sent-emails-table"
import MerchantManagement from "@/components/merchant-management"
import type { Merchant, SentEmail } from "@/lib/types/types"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { jwtDecode } from "jwt-decode";

// Mock data for fallback

// const MOCK_SENT_EMAILS: SentEmail[] = [
//   {
//     id: 1,
//     recipients: ["ivy.goko@pesapal.com", "kibet@pesapal.com"],
//     subject: "Test Email",
//     attachmentUrl: "pie.txt",
//     sentAt: "2025-04-08T10:11:30.790Z",
//     merchant: "Pesapal",
//   },
//   {
//     id: 2,
//     recipients: ["ivy.goko@pesapal.com", "kibet@pesapal.com"],
//     subject: "Monthly Report",
//     attachmentUrl: "report.pdf",
//     sentAt: "2025-04-08T10:11:46.127Z",
//     merchant: "Pesapal",
//   },
//   {
//     id: 3,
//     recipients: ["contact@acme.com", "support@acme.com"],
//     subject: "Invoice #12345",
//     attachmentUrl: "invoice.pdf",
//     sentAt: "2025-04-08T10:26:04.166Z",
//     merchant: "Acme Corp",
//   },
// ]

export default function Home() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      console.log("expired ,,,lets log you out")
      router.push("/");
    }


  try {
    const decoded: { exp: number } = jwtDecode(session?.user.accessToken);
    const now = Date.now() / 1000;

    if (decoded.exp < now) {
      console.log("Token has expired, redirecting...");
      router.push("/");
    }
  } catch (error) {
    console.error("Failed to decode token", error);
    router.push("/");
  }
}, [session, status, router]);


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


useEffect(() => {
  if (!session || status === "loading") return;

  const fetchMerchants = async () => {

    console.log("AccessToken for fetching merchants:", session?.user.accessToken);
    try {
      const response = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/api/merchants`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      if (response.status === 401) {
        console.log("Session expired based on API response");
        router.push("/");
        return;
      }

      const data = await response.json();
      setMerchants(data);
      setError((prev) => ({ ...prev, merchants: false }));
    } catch (error) {
      console.error("Error fetching merchants:", error);
      setError((prev) => ({ ...prev, merchants: true }));
    } finally {
      setIsLoading((prev) => ({ ...prev, merchants: false }));
    }
  };

  const fetchSentEmails = async () => {
    try {
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emails?page=${page}&size=${size}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      if (response.status === 401) {
        console.log("Session expired based on API response");
        router.push("/");
        return;
      }

      const data = await response.json();
      setSentEmails(data.data);
      setTotalPages(data.meta.totalPages || 1);
    } catch (error) {
      console.error("Error fetching sent emails:", error);
      setError((prev) => ({ ...prev, sentEmails: true }));
    } finally {
      setIsLoading((prev) => ({ ...prev, sentEmails: false }));
    }
  };

  fetchMerchants();
  fetchSentEmails();
}, [session, status, page, size]);


return (
  <main className="container mx-auto py-10 px-4">
    <div className="flex flex-row w-full justify-between">
    <h1 className="text-3xl font-bold mb-8">Email Management System</h1>
    <MerchantManagement/>
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
