'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import Pagination from '@/components/ui/pagination'
import { SupplierService, CreateSupplierData, UpdateSupplierData } from '@/services/supplier-service'
import type { Supplier } from '@/types/database.types'
import { Plus, Search, Edit, Trash2, Phone, Mail, User, MapPin, FileText, RefreshCw } from 'lucide-react'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState<CreateSupplierData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    contact_person: '',
    notes: ''
  })

  const itemsPerPage = 10

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await SupplierService.getSuppliers(
        currentPage,
        itemsPerPage,
        searchTerm,
        !showInactive
      )
      setSuppliers(result.suppliers)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
      alert('Failed to load suppliers. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, showInactive])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      contact_person: '',
      notes: ''
    })
    setSelectedSupplier(null)
  }

  // Handle create supplier
  const handleCreateSupplier = async () => {
    if (!formData.name.trim()) {
      alert('Supplier name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await SupplierService.createSupplier(formData)
      setIsCreateDialogOpen(false)
      resetForm()
      fetchSuppliers()
      alert('Supplier created successfully!')
    } catch (error) {
      console.error('Failed to create supplier:', error)
      alert('Failed to create supplier. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit supplier
  const handleEditSupplier = async () => {
    if (!selectedSupplier || !formData.name.trim()) {
      alert('Supplier name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await SupplierService.updateSupplier(selectedSupplier.id, formData as UpdateSupplierData)
      setIsEditDialogOpen(false)
      resetForm()
      fetchSuppliers()
      alert('Supplier updated successfully!')
    } catch (error) {
      console.error('Failed to update supplier:', error)
      alert('Failed to update supplier. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete supplier
  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to deactivate supplier "${supplier.name}"?`)) {
      return
    }

    try {
      await SupplierService.deleteSupplier(supplier.id)
      fetchSuppliers()
      alert('Supplier deactivated successfully!')
    } catch (error) {
      console.error('Failed to delete supplier:', error)
      alert('Failed to deactivate supplier. Please try again.')
    }
  }

  // Handle reactivate supplier
  const handleReactivateSupplier = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to reactivate supplier "${supplier.name}"?`)) {
      return
    }

    try {
      await SupplierService.reactivateSupplier(supplier.id)
      fetchSuppliers()
      alert('Supplier reactivated successfully!')
    } catch (error) {
      console.error('Failed to reactivate supplier:', error)
      alert('Failed to reactivate supplier. Please try again.')
    }
  }

  // Open edit dialog
  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      contact_person: supplier.contact_person || '',
      notes: supplier.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchSuppliers()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600">Manage your suppliers and vendor information</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchSuppliers} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogDescription>
                  Create a new supplier profile for your inventory management.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ABC Distributors"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+60123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@supplier.com"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Business Street, City, State"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional information about the supplier..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSupplier}
                  disabled={isSubmitting}
                  className="bg-orange-500 hover:bg-orange-600 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Supplier'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search suppliers by name, phone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" size="sm">Search</Button>
            </form>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-inactive" className="text-sm">Show Inactive</Label>
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Suppliers ({totalCount})</span>
            {totalCount > 0 && (
              <Badge variant="outline">
                Page {currentPage} of {totalPages}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2">Loading suppliers...</span>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No suppliers found</p>
              <p className="text-sm">Add your first supplier to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            {supplier.address && (
                              <p className="text-sm text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {supplier.address}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.contact_person ? (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              {supplier.contact_person}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {supplier.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center text-sm">
                                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                {supplier.email}
                              </div>
                            )}
                            {!supplier.phone && !supplier.email && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={supplier.is_active ? "default" : "secondary"}
                            className={supplier.is_active ? "bg-green-100 text-green-800" : ""}
                          >
                            {supplier.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(supplier.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(supplier)}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {supplier.is_active ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSupplier(supplier)}
                                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReactivateSupplier(supplier)}
                                className="cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    showingFrom={(currentPage - 1) * itemsPerPage + 1}
                    showingTo={Math.min(currentPage * itemsPerPage, totalCount)}
                    totalItems={totalCount}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information and contact details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Supplier Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ABC Distributors"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-contact_person">Contact Person</Label>
              <Input
                id="edit-contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+60123456789"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@supplier.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Business Street, City, State"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information about the supplier..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSupplier}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 cursor-pointer"
            >
              {isSubmitting ? 'Updating...' : 'Update Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}