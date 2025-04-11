"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, Trash2, UserPlus, Send } from "lucide-react"
import { addRecipient, deleteMerchant, deleteRecipient } from "@/lib/actions/sendMailAction"
import { toast } from "sonner"
import { useSession } from "next-auth/react";

// Types
type Merchant = {
  id: string
  name: string
  recipients: Recipient[]
}

type Recipient = {
  id: string
  email: string
  merchantId: string
}

export default function MerchantManagement() {
  const [merchants, setMerchants] = useState<Merchant[]>([])

  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [newMerchantName, setNewMerchantName] = useState("")
  const [newRecipientEmail, setNewRecipientEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

   const { data: session, status } = useSession();
  const handleAddMerchant = () => {
    if (!newMerchantName.trim()) return
    const newId = `m${Date.now()}`
    const newMerchant: Merchant = {
      id: newId,
      name: newMerchantName,
      recipients: [],
    }
    setMerchants([...merchants, newMerchant])
    setNewMerchantName("")
    toast("Merchant added to the table")
  }

  const handleSubmitToAPI = async () => {
    if (merchants.length === 0) {
      toast("Please add at least one merchant before submitting")
      return
    }

    setIsSubmitting(true)

 
    try {
      for (const merchant of merchants) {
        const recipientEmails = merchant.recipients.map((r) => r.email)
    
        const payload = {
          merchant_name: merchant.name,
          recipient_emails: recipientEmails,
        }
    
        console.log("Submitting data to API:", payload)
    
        const response = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/api/merchants`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
          body: JSON.stringify(payload),
        })
    
        if (response.ok) {
          toast(`Merchant "${merchant.name}" submitted successfully`)
        } else {
          const errorData = await response.json()
          if (Array.isArray(errorData.message)) {
            errorData.message.forEach((msg: string) => {
              toast.error(`Error: ${msg}`)
            })
          } else if (typeof errorData.message === "string") {
            toast.error(`Error: ${errorData.message}`)
          } else {
            toast.error(`Failed to submit merchant "${merchant.name}"`)
          }
        }
      }
    } catch (error) {
      console.error("Error submitting merchants:", error)
      toast.error("An error occurred while submitting merchants")
    } finally {
      setIsSubmitting(false)
    }
    
  }

  const handleDeleteMerchant = async (id: string) => {
    await deleteMerchant(id)

    setMerchants(merchants.filter((m) => m.id !== id))
    if (selectedMerchant?.id === id) {
      setSelectedMerchant(null)
    }
  }

  const handleAddRecipient = async (merchantId: string) => {
    if (!newRecipientEmail.trim()) return
    const newRecipient: Recipient = {
      id: `r${Date.now()}`,
      email: newRecipientEmail,
      merchantId,
    }
    await addRecipient(newRecipient)

    setMerchants(
      merchants.map((m) => {
        if (m.id === merchantId) {
          return {
            ...m,
            recipients: [...m.recipients, newRecipient],
          }
        }
        return m
      }),
    )

    if (selectedMerchant?.id === merchantId) {
      setSelectedMerchant({
        ...selectedMerchant,
        recipients: [...selectedMerchant.recipients, newRecipient],
      })
    }

    setNewRecipientEmail("")
  }

  const handleDeleteRecipient = async (merchantId: string, recipientId: string) => {
    await deleteRecipient(recipientId)

    setMerchants(
      merchants.map((m) => {
        if (m.id === merchantId) {
          return {
            ...m,
            recipients: m.recipients.filter((r) => r.id !== recipientId),
          }
        }
        return m
      }),
    )

    if (selectedMerchant?.id === merchantId) {
      setSelectedMerchant({
        ...selectedMerchant,
        recipients: selectedMerchant.recipients.filter((r) => r.id !== recipientId),
      })
    }
  }

  return (
    <div className="space-y-6 mb-12">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className="justify-end">Add a new Merchant</AccordionTrigger>
          <AccordionContent className="min-w-[700px]">
            <Card>
              <CardHeader>
                <CardTitle>Merchants</CardTitle>
                <CardDescription>Add and manage merchants and their recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 mb-6">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="merchantName">Merchant Name</Label>
                    <Input
                      id="merchantName"
                      placeholder="Enter merchant name"
                      value={newMerchantName}
                      onChange={(e) => setNewMerchantName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddMerchant}>
                    <Plus className="mr-2 h-4 w-4" /> Add Merchant
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merchant Name</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchants.map((merchant) => (
                      <TableRow key={merchant.id}>
                        <TableCell className="font-medium">{merchant.name}</TableCell>
                        <TableCell>{merchant.recipients.length} recipients</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedMerchant(merchant)}>
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Manage Recipients for {merchant.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="flex items-end gap-4">
                                    <div className="grid w-full items-center gap-1.5">
                                      <Label htmlFor="recipientEmail">Recipient Email</Label>
                                      <Input
                                        id="recipientEmail"
                                        placeholder="Enter email address"
                                        type="email"
                                        value={newRecipientEmail}
                                        onChange={(e) => setNewRecipientEmail(e.target.value)}
                                      />
                                    </div>
                                    <Button onClick={() => handleAddRecipient(merchant.id)}>Add</Button>
                                  </div>

                                  <div className="border rounded-md">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Email</TableHead>
                                          <TableHead className="w-[80px]">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {merchant.recipients.map((recipient) => (
                                          <TableRow key={recipient.id}>
                                            <TableCell>{recipient.email}</TableCell>
                                            <TableCell>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteRecipient(merchant.id, recipient.id)}
                                              >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button type="button">Done</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Button variant="ghost" size="sm" onClick={() => handleDeleteMerchant(merchant.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {merchants.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSubmitToAPI} disabled={isSubmitting} className="hover:bg-0d4b7c">
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit Details"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
