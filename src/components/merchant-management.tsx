"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Edit,
  Loader2,
  Plus,
  Send,
  Trash2,
  Users,
  Mail,
  Calendar,
  Building2,
  UserPlus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")

  // New merchant form
  const [newMerchantName, setNewMerchantName] = useState("")
  const [newRecipientEmail, setNewRecipientEmail] = useState("")
  const [recipientEmails, setRecipientEmails] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)

  // Edit merchant form
  const [editMerchantId, setEditMerchantId] = useState<number | null>(null)
  const [editMerchantName, setEditMerchantName] = useState("")
  const [editRecipientEmails, setEditRecipientEmails] = useState<string[]>([])
  const [editNewEmail, setEditNewEmail] = useState("")

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirmation state
  const [merchantToDelete, setMerchantToDelete] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [deletingMerchant, setDeletingMerchant] = useState(false)

  // Fetch merchants on component mount
  useEffect(() => {
    fetchMerchants()
  }, [])

  // Filter merchants based on search term
  const filteredMerchants = merchants.filter(
    (merchant) =>
      merchant.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.recipient_emails.some((email) => email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

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
    if (recipientEmails.includes(newRecipientEmail)) {
      toast.error("Email already added")
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
        setShowAddForm(false)
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

  const handleDeleteMerchant = async (id: number) => {
    setMerchantToDelete(id)
    setShowDeleteConfirm(true)
  }

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
        setMerchants(merchants.filter((m) => m.id !== merchantToDelete))
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
    if (editRecipientEmails.includes(editNewEmail)) {
      toast.error("Email already added")
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
        setEditMerchantId(null)
        setEditMerchantName("")
        setEditRecipientEmails([])
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

  const getMerchantInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString))
  }

  return (
    <div className="space-y-8">


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{merchants.length}</p>
                <p className="text-sm text-gray-600">Total Merchants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {merchants.reduce((total, merchant) => total + merchant.recipient_emails.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Recipients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    merchants.filter((m) => new Date(m.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                      .length
                  }
                </p>
                <p className="text-sm text-gray-600">Added This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search merchants or emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/70 border-gray-200/50 focus:border-[#16659e] focus:ring-[#16659e]/20 rounded-xl"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 rounded-xl border-gray-200 hover:bg-gray-50"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            Refresh
          </Button>

          <Button
            onClick={() => setShowAddForm(true)}
            className="gap-2 bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#1e7bb8] hover:to-[#16659e] text-white rounded-xl shadow-lg shadow-[#16659e]/25 hover:shadow-xl hover:shadow-[#16659e]/30 hover:scale-[1.02] transition-all duration-300"
          >
            <UserPlus className="h-4 w-4" />
            Add Merchant
          </Button>
        </div>
      </div>

      {/* Add Merchant Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#16659e]" />
              Add New Merchant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="merchantName" className="text-sm font-medium">
                Merchant Name
              </Label>
              <Input
                id="merchantName"
                placeholder="Enter merchant name"
                value={newMerchantName}
                onChange={(e) => setNewMerchantName(e.target.value)}
                className="rounded-xl border-gray-200/50 focus:border-[#16659e] focus:ring-[#16659e]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientEmail" className="text-sm font-medium">
                Recipient Emails
              </Label>
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
                  className="rounded-xl border-gray-200/50 focus:border-[#16659e] focus:ring-[#16659e]/20"
                />
                <Button
                  onClick={handleAddRecipientEmail}
                  size="icon"
                  className="rounded-xl bg-[#16659e] hover:bg-[#1e7bb8]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {recipientEmails.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Added Recipients</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200/50">
                  {recipientEmails.map((email, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 rounded-lg">
                      {email}
                      <button
                        className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                        onClick={() => handleRemoveRecipientEmail(email)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false)
                setNewMerchantName("")
                setRecipientEmails([])
                setNewRecipientEmail("")
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitMerchant}
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#1e7bb8] hover:to-[#16659e]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Add Merchant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merchants Table */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gray-50/80 border-b border-gray-200/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-[#16659e]" />
            Merchants ({filteredMerchants.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#16659e]" />
              <p className="text-gray-600 font-medium">Loading merchants...</p>
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {searchTerm ? "No merchants found" : "No merchants yet"}
                </h3>
                <p className="text-gray-500 mt-1">
                  {searchTerm ? "Try adjusting your search terms" : "Add your first merchant to get started"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-b border-gray-200/50">
                    <TableHead className="px-6 py-4 font-semibold text-gray-900">Merchant</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-gray-900">Recipients</TableHead>
                    <TableHead className="px-6 py-4 font-semibold text-gray-900">Created</TableHead>
                    <TableHead className="px-6 py-4 text-right font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow
                      key={merchant.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={`/placeholder.svg?height=48&width=48&query=${getMerchantInitials(merchant.merchant_name)}`}
                              alt={merchant.merchant_name}
                            />
                            <AvatarFallback className="bg-gradient-to-r from-[#16659e] to-[#1e7bb8] text-white font-medium">
                              {getMerchantInitials(merchant.merchant_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{merchant.merchant_name}</p>
                            <p className="text-sm text-gray-500">ID: {merchant.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {merchant.recipient_emails.length} recipient
                              {merchant.recipient_emails.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {merchant.recipient_emails.slice(0, 2).map((email, index) => (
                              <Badge key={index} variant="outline" className="text-xs rounded-lg">
                                {email}
                              </Badge>
                            ))}
                            {merchant.recipient_emails.length > 2 && (
                              <Badge variant="secondary" className="text-xs rounded-lg">
                                +{merchant.recipient_emails.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{formatDate(merchant.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMerchant(merchant)}
                                className="rounded-xl border-gray-200 hover:bg-gray-50 hover:border-[#16659e] transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Edit className="h-5 w-5 text-[#16659e]" />
                                  Edit Merchant
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="editMerchantName" className="text-sm font-medium">
                                    Merchant Name
                                  </Label>
                                  <Input
                                    id="editMerchantName"
                                    placeholder="Enter merchant name"
                                    value={editMerchantName}
                                    onChange={(e) => setEditMerchantName(e.target.value)}
                                    className="rounded-xl border-gray-200/50 focus:border-[#16659e] focus:ring-[#16659e]/20"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="editRecipientEmail" className="text-sm font-medium">
                                    Recipient Emails
                                  </Label>
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
                                      className="rounded-xl border-gray-200/50 focus:border-[#16659e] focus:ring-[#16659e]/20"
                                    />
                                    <Button
                                      onClick={handleAddEditEmail}
                                      size="icon"
                                      className="rounded-xl bg-[#16659e] hover:bg-[#1e7bb8]"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {editRecipientEmails.length > 0 && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Current Recipients</Label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200/50">
                                      {editRecipientEmails.map((email, index) => (
                                        <Badge key={index} variant="secondary" className="px-3 py-1 rounded-lg">
                                          {email}
                                          <button
                                            className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                            onClick={() => handleRemoveEditEmail(email)}
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setEditMerchantId(null)}
                                  className="rounded-xl"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleUpdateMerchant}
                                  disabled={isSubmitting}
                                  className="rounded-xl bg-gradient-to-r from-[#16659e] to-[#1e7bb8] hover:from-[#1e7bb8] hover:to-[#16659e]"
                                >
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Update Merchant
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMerchant(merchant.id)}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm font-medium text-red-800">Are you sure you want to delete this merchant?</p>
              <p className="text-sm text-red-700 mt-1">
                This action cannot be undone and will remove all associated data.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deleteReason" className="text-sm font-medium">
                Reason for deletion <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deleteReason"
                placeholder="Enter reason for deletion"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="rounded-xl border-gray-200/50 focus:border-red-300 focus:ring-red-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false)
                setMerchantToDelete(null)
                setDeleteReason("")
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMerchant}
              disabled={deletingMerchant || !deleteReason.trim()}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              {deletingMerchant ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Merchant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
