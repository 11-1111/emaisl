"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { Mail, Clock, Users, FileText, Calendar, Zap, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [systemStats, setSystemStats] = useState({
    totalEmails: 0,
    totalMerchants: 0,
    isLoading: true,
  })

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        // Fetch summary data
        const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/summary`)
        const summaryData = await summaryResponse.json()
        console.log("emilsData:", summaryData.meta)


        setSystemStats({
          totalEmails: summaryData.totalEmails || 0,
          totalMerchants: summaryData.totalMerchants || 0,
          isLoading: false,
        })
      } catch (error) {
        console.error("Error fetching system stats:", error)
        setSystemStats({
          totalEmails: 0,
          totalMerchants: 0,
          isLoading: false,
        })
      }
    }

    fetchSystemStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50">
      <div className="container relative flex-col items-start justify-center min-h-screen grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left Side - System Overview */}
        <div className="relative hidden h-full flex-col p-10 text-white lg:flex">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#16659e] via-[#1e7bb8] to-[#0f4c75]">
            <div className="absolute inset-0 bg-black/20"></div>
            {/* Decorative elements representing scheduled tasks */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-40 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/10 rounded-full blur-lg animate-pulse delay-500"></div>
          </div>

          {/* Logo and Brand */}
          <div className="relative z-20 flex items-center justify-center text-xl font-bold">
            {/* <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
              <Clock className="h-6 w-6 text-white" />
            </div> */}
            EMAIL SCHEDULER
          </div>

          {/* System Overview */}
          <div className="relative z-20 py-10 flex flex-col justify-center">
            {/* System Features */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Cron Job Scheduling</h3>
                  <p className="text-white/70">Queue emails for precise delivery timing</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Merchant Management</h3>
                  <p className="text-white/70">Organize recipients and contact lists</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Attachment Handling</h3>
                  <p className="text-white/70">Upload and manage email attachments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time System Status */}
          <div className="relative z-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h4 className="font-semibold mb-4 text-center">Live System Status</h4>
              {systemStats.isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-white/70" />
                  <span className="ml-2 text-white/70">Loading stats...</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-sm font-medium">Active</span>
                    </div>
                    <div className="text-xs text-white/70">Cron Jobs</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{systemStats.totalEmails}</div>
                    <div className="text-xs text-white/70">Total Emails</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{systemStats.totalMerchants}</div>
                    <div className="text-xs text-white/70">Active Merchants</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:py-8 px-4 flex items-center justify-center">
          <div className="mx-auto flex w-full flex-col justify-center space-y-8 p-8">
            {/* Mobile Logo */}
            <div className="flex items-center justify-center lg:hidden mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-[#16659e] to-[#1e7bb8] rounded-xl flex items-center justify-center mr-3">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">EMAIL SCHEDULER</span>
            </div>

            {/* Login Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex flex-col space-y-6 text-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    System Access
                  </h1>
                  <p className="text-gray-600 mt-2">Sign in to manage scheduled email campaigns</p>
                </div>
              </div>

              <LoginForm />

              {/* System Info */}

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
