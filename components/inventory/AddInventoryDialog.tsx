'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AddInventoryForm from './AddInventoryForm'

interface AddInventoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  selectedBranchId?: string
}

export default function AddInventoryDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  selectedBranchId 
}: AddInventoryDialogProps) {
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory Stock</DialogTitle>
        </DialogHeader>
        <AddInventoryForm
          onSuccess={handleSuccess}
          onCancel={onClose}
          selectedBranchId={selectedBranchId}
        />
      </DialogContent>
    </Dialog>
  )
}