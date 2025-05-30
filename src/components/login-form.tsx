"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Eye, EyeOff, Loader2, User, Lock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
const onSubmit = async (values: z.infer<typeof formSchema>) => {
  setIsLoading(true);
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: values.email,
        password: values.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || "Authentication failed");
      return;
    }

    const { token, expires_in } = data;
    const expiryTime = new Date().getTime() + expires_in * 1000;

    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    console.log("payloooooooood:", payload)

    localStorage.setItem("accessToken", token);
    localStorage.setItem("tokenExpiry", expiryTime.toString());
    localStorage.setItem("userName", payload.name);
    localStorage.setItem("userEmail", payload.email);

    router.push("/dashboard");
  } catch (err: any) {
    toast.error(err.message || "System connection failed");
  } finally {
    setIsLoading(false);
  }
};



  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="employee@company.com"
                      className="pl-10 h-12 bg-white/50 border-gray-200/50 focus:border-[#16659e] focus:ring-[#16659e]/20 rounded-xl transition-all duration-200"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-gray-700">System Password</FormLabel>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      className="pl-10 pr-12 h-12 bg-white/50 border-gray-200/50 focus:border-[#16659e] focus:ring-[#16659e]/20 rounded-xl transition-all duration-200"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100/50 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#1e7bb8] hover:to-[#16659e] text-white font-medium rounded-xl shadow-lg shadow-[#16659e]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#16659e]/30 hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Access System Dashboard
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Security Notice */}
      {/* <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/30">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Security Notice</p>
            <p className="text-xs text-amber-700 mt-1">
              This is an internal system for authorized personnel only. All activities are logged and monitored.
            </p>
          </div>
        </div>
      </div> */}

    </div>
  )
}
