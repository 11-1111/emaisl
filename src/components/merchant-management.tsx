"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Edit, Loader2, Plus, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

// Types
type Merchant = {
  id: number
  merchant_name: string
  recipient_emails: string[]
  created_at: string
}

export default function MerchantManagement() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // New merchant form
  const [newMerchantName, setNewMerchantName] = useState("")
  const [newRecipientEmail, setNewRecipientEmail] = useState("")
  const [recipientEmails, setRecipientEmails] = useState<string[]>([])

  // Edit merchant form
  const [editMerchantId, setEditMerchantId] = useState<number | null>(null)
  const [editMerchantName, setEditMerchantName] = useState("")
  const [editRecipientEmails, setEditRecipientEmails] = useState<string[]>([])
  const [editNewEmail, setEditNewEmail] = useState("")

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add these state variables after the other state declarations
  const [merchantToDelete, setMerchantToDelete] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [deletingMerchant, setDeletingMerchant] = useState(false)

  // Fetch merchants on component mount
  useEffect(() => {
    fetchMerchants()
  }, [])

  // Fetch merchants from API
  const fetchMerchants = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/merchants`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMerchants(data)
      } else {
        const errorData = await response.json()
        toast.error(`Error: ${errorData.message || "Failed to fetch merchants"}`)
      }
    } catch (error) {
      console.error("Error fetching merchants:", error)
      toast.error("An error occurred while fetching merchants")
    } finally {
      setLoading(false)
    }
  }

  // Refresh merchants list
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMerchants()
    setRefreshing(false)
  }

  // Add recipient email to the list
  const handleAddRecipientEmail = () => {
    if (!newRecipientEmail.trim()) return
    if (!newRecipientEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setRecipientEmails([...recipientEmails, newRecipientEmail])
    setNewRecipientEmail("")
  }

  // Remove recipient email from the list
  const handleRemoveRecipientEmail = (email: string) => {
    setRecipientEmails(recipientEmails.filter((e) => e !== email))
  }

  // Add new merchant to API
  const handleSubmitMerchant = async () => {
    if (!newMerchantName.trim()) {
      toast.error("Please enter a merchant name")
      return
    }

    if (recipientEmails.length === 0) {
      toast.error("Please add at least one recipient email")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        merchant_name: newMerchantName,
        recipient_emails: recipientEmails,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/merchants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(`Merchant "${newMerchantName}" added successfully`)
        // Reset form
        setNewMerchantName("")
        setRecipientEmails([])
        // Refresh merchants list
        fetchMerchants()
      } else {
        const errorData = await response.json()
        toast.error(`Error: ${errorData.message || "Failed to add merchant"}`)
      }
    } catch (error) {
      console.error("Error adding merchant:", error)
      toast.error("An error occurred while adding merchant")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Replace the handleDeleteMerchant function with this updated version
  const handleDeleteMerchant = async (id: number) => {
    // The actual delete operation is now moved to confirmDeleteMerchant
    setMerchantToDelete(id)
    setShowDeleteConfirm(true)
  }

  // Add this new function after handleDeleteMerchant
  const confirmDeleteMerchant = async () => {
    if (!merchantToDelete) return

    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deletion")
      return
    }

    setDeletingMerchant(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/merchants/${merchantToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ reason: deleteReason }),
      })

      if (response.ok) {
        toast.success("Merchant deleted successfully")
        // Update local state
        setMerchants(merchants.filter((m) => m.id !== merchantToDelete))
        // Reset delete state
        setShowDeleteConfirm(false)
        setMerchantToDelete(null)
        setDeleteReason("")
      } else {
        const errorData = await response.json()
        toast.error(`Error: ${errorData.message || "Failed to delete merchant"}`)
      }
    } catch (error) {
      console.error("Error deleting merchant:", error)
      toast.error("An error occurred while deleting merchant")
    } finally {
      setDeletingMerchant(false)
    }
  }

  // Open edit dialog with merchant data
  const handleEditMerchant = (merchant: Merchant) => {
    setEditMerchantId(merchant.id)
    setEditMerchantName(merchant.merchant_name)
    setEditRecipientEmails([...merchant.recipient_emails])
  }

  // Add email to edit form
  const handleAddEditEmail = () => {
    if (!editNewEmail.trim()) return
    if (!editNewEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setEditRecipientEmails([...editRecipientEmails, editNewEmail])
    setEditNewEmail("")
  }

  // Remove email from edit form
  const handleRemoveEditEmail = (email: string) => {
    setEditRecipientEmails(editRecipientEmails.filter((e) => e !== email))
  }

  // Update merchant
  const handleUpdateMerchant = async () => {
    if (!editMerchantName.trim()) {
      toast.error("Please enter a merchant name")
      return
    }

    if (editRecipientEmails.length === 0) {
      toast.error("Please add at least one recipient email")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        merchant_name: editMerchantName,
        recipient_emails: editRecipientEmails,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/merchants/${editMerchantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Merchant updated successfully")
        // Reset form
        setEditMerchantId(null)
        setEditMerchantName("")
        setEditRecipientEmails([])
        // Refresh merchants list
        fetchMerchants()
      } else {
        const errorData = await response.json()
        toast.error(`Error: ${errorData.message || "Failed to update merchant"}`)
      }
    } catch (error) {
      console.error("Error updating merchant:", error)
      toast.error("An error occurred while updating merchant")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 mb-12">
      <Card className="border-0 shadow-none bg-slate-50">
        <CardContent>
          {/* Add New Merchant Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Add New Merchant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid w-full items-center gap-1.5 mb-6">
                  <Label htmlFor="merchantName">Merchant Name</Label>
                  <Input
                    id="merchantName"
                    placeholder="Enter merchant name"
                    value={newMerchantName}
                    onChange={(e) => setNewMerchantName(e.target.value)}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5 mb-6">
                  <Label htmlFor="recipientEmail">Recipient Emails</Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipientEmail"
                      placeholder="Enter email address"
                      type="email"
                      value={newRecipientEmail}
                      onChange={(e) => setNewRecipientEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddRecipientEmail()
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddRecipientEmail}
                      className="rounded-[4px] transition-all duration-200 hover:scale-105 hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {recipientEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {recipientEmails.map((email, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-1">
                        {email}
                        <button
                          className="rounded-[4px] ml-2 text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveRecipientEmail(email)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitMerchant}
                    disabled={isSubmitting}
                    className="rounded-[4px] transition-all duration-200 hover:scale-105 hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Add Merchant
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Merchants Table */}
          <Card className="">
            <CardHeader className="">
              <CardTitle className="text-lg">Existing Merchants</CardTitle>
            </CardHeader>
            <CardContent className="">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : merchants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No merchants found. Add your first merchant above.
                </div>
              ) : (
                <div className="">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Merchant Name</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {merchants.map((merchant) => (
                        <TableRow key={merchant.id}>
                          <TableCell>{merchant.id}</TableCell>
                          <TableCell className="font-medium">{merchant.merchant_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {merchant.recipient_emails.map((email, index) => (
                                <Badge key={index} variant="outline" className="px-2 py-0.5">
                                  {email}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(merchant.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditMerchant(merchant)}
                                    className="rounded-[4px] transition-all duration-200 hover:scale-105 hover:bg-accent"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Merchant</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="grid w-full items-center gap-1.5">
                                      <Label htmlFor="editMerchantName">Merchant Name</Label>
                                      <Input
                                        id="editMerchantName"
                                        placeholder="Enter merchant name"
                                        value={editMerchantName}
                                        onChange={(e) => setEditMerchantName(e.target.value)}
                                      />
                                    </div>

                                    <div className="grid w-full items-center gap-1.5">
                                      <Label htmlFor="editRecipientEmail">Recipient Emails</Label>
                                      <div className="flex gap-2">
                                        <Input
                                          id="editRecipientEmail"
                                          placeholder="Enter email address"
                                          type="email"
                                          value={editNewEmail}
                                          onChange={(e) => setEditNewEmail(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault()
                                              handleAddEditEmail()
                                            }
                                          }}
                                        />
                                        <Button
                                          onClick={handleAddEditEmail}
                                          className="rounded-[4px] transition-all duration-200 hover:scale-105 hover:bg-primary/90"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {editRecipientEmails.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {editRecipientEmails.map((email, index) => (
                                          <Badge key={index} variant="secondary" className="px-2 py-1">
                                            {email}
                                            <button
                                              className="rounded-[4px] ml-2 text-red-500 hover:text-red-700"
                                              onClick={() => handleRemoveEditEmail(email)}
                                            >
                                              ×
                                            </button>
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={handleUpdateMerchant}
                                      disabled={isSubmitting}
                                      className="rounded-[4px] transition-all duration-200 hover:scale-105 hover:bg-primary/90"
                                    >
                                      {isSubmitting ? "Updating..." : "Update Merchant"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMerchant(merchant.id)}
                                className="rounded-[4px] transition-all duration-200 hover:scale-105 hover:bg-accent/80"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                Are you sure you want to delete this merchant? This action cannot be undone.
              </p>
              <p className="text-sm text-muted-foreground">
                For accountability purposes, please provide a reason for deletion:
              </p>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="deleteReason">Reason for deletion</Label>
                <Input
                  id="deleteReason"
                  placeholder="Enter reason for deletion"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false)
                setMerchantToDelete(null)
                setDeleteReason("")
              }}
              className="rounded-[4px] transition-all duration-200 hover:scale-105 hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMerchant}
              disabled={deletingMerchant}
              className="rounded-[4px] transition-all duration-200 hover:scale-105 hover:bg-destructive/90"
            >
              {deletingMerchant ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Merchant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
