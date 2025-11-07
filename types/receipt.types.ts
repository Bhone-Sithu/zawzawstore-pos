export interface ReceiptData {
  transactionNumber: string
  date: string
  time: string
  branchName: string
  cashierName: string
  items: Array<{
    name_en: string
    name_mm: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  isStaffCheckout: boolean
  amountPaid?: number
  change?: number
}