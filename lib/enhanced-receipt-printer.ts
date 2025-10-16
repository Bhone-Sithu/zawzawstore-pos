'use client'

import type { ReceiptData } from '@/types/receipt.types'
import { ReceiptPrinter as WebSerialPrinter } from './receipt-printer'

// Dynamic import for esc-pos-printer to handle client-side only usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- esc-pos-printer has no TypeScript types
let EscPosPrinter: any = null

export type PrinterMethod = 'web-serial' | 'esc-pos' | 'browser-fallback'

export interface PrinterConfig {
  method: PrinterMethod
  printerName?: string
  baudRate?: number
}

export class EnhancedReceiptPrinter {
  private webSerialPrinter: WebSerialPrinter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- esc-pos-printer has no TypeScript types
  private escPosPrinter: any = null
  private config: PrinterConfig
  private isConnected = false

  constructor(config: PrinterConfig = { method: 'web-serial' }) {
    this.webSerialPrinter = new WebSerialPrinter()
    this.config = config
  }

  // Initialize the esc-pos-printer dynamically
  private async initEscPosPrinter() {
    if (EscPosPrinter === null && typeof window !== 'undefined') {
      try {
        const printerModule = await import('esc-pos-printer')
        EscPosPrinter = printerModule.default
        this.escPosPrinter = new EscPosPrinter()
      } catch (error) {
        console.warn('Failed to load esc-pos-printer:', error)
        EscPosPrinter = false // Mark as failed to avoid retry
      }
    }
  }

  // Check if printer methods are supported
  static isWebSerialSupported(): boolean {
    return WebSerialPrinter.isSupported()
  }

  static async isEscPosSupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      const printerModule = await import('esc-pos-printer')
      return !!printerModule.default
    } catch {
      return false
    }
  }

  // Get available printers for esc-pos method
  async getAvailablePrinters(): Promise<string[]> {
    if (this.config.method !== 'esc-pos') return []
    
    await this.initEscPosPrinter()
    if (!this.escPosPrinter) return []

    try {
      const printers = await this.escPosPrinter.getPrinters()
      return printers || []
    } catch (error) {
      console.error('Failed to get printers:', error)
      return []
    }
  }

  // Connect to printer based on configured method
  async connect(): Promise<boolean> {
    try {
      switch (this.config.method) {
        case 'web-serial':
          this.isConnected = await this.webSerialPrinter.connect()
          return this.isConnected

        case 'esc-pos': {
          await this.initEscPosPrinter()
          if (!this.escPosPrinter) {
            console.warn('ESC/POS printer not available, falling back to Web Serial')
            this.config.method = 'web-serial'
            return this.connect()
          }

          if (this.config.printerName) {
            this.escPosPrinter.setPrinterName(this.config.printerName)
            this.isConnected = true
            return true
          }
          
          const printers = await this.getAvailablePrinters()
          if (printers.length > 0) {
            this.escPosPrinter.setPrinterName(printers[0])
            this.isConnected = true
            return true
          }
          return false
        }

        case 'browser-fallback':
          this.isConnected = true
          return true

        default:
          return false
      }
    } catch (error) {
      console.error('Failed to connect printer:', error)
      this.isConnected = false
      return false
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    try {
      switch (this.config.method) {
        case 'web-serial':
          await this.webSerialPrinter.disconnect()
          break
        case 'esc-pos':
          // ESC/POS printer doesn't need explicit disconnect
          break
        case 'browser-fallback':
          // No disconnect needed
          break
      }
      this.isConnected = false
    } catch (error) {
      console.error('Error disconnecting printer:', error)
    }
  }

  // Print receipt using the configured method
  async printReceipt(receiptData: ReceiptData): Promise<boolean> {
    try {
      switch (this.config.method) {
        case 'web-serial':
          if (!this.isConnected) {
            const connected = await this.connect()
            if (!connected) throw new Error('Failed to connect to Web Serial printer')
          }
          return await this.webSerialPrinter.printReceipt(receiptData)

        case 'esc-pos':
          if (!this.isConnected) {
            const connected = await this.connect()
            if (!connected) throw new Error('Failed to connect to ESC/POS printer')
          }
          return await this.printWithEscPos(receiptData)

        case 'browser-fallback':
          this.printBrowserFallback(receiptData)
          return true

        default:
          throw new Error('Unknown printer method')
      }
    } catch (error) {
      console.error('Failed to print receipt:', error)
      // Auto-fallback to browser print
      this.printBrowserFallback(receiptData)
      return true
    }
  }

  // Print using esc-pos-printer library
  private async printWithEscPos(receiptData: ReceiptData): Promise<boolean> {
    if (!this.escPosPrinter) return false

    try {
      // Clear any previous content
      this.escPosPrinter.text("")
      
      // Header
      this.escPosPrinter.alignCenter()
      this.escPosPrinter.printMode({ emphasized: true, doubleHeight: true })
      this.escPosPrinter.text("GROCERY STORE\n")
      
      this.escPosPrinter.printMode({ emphasized: false, doubleHeight: false })
      this.escPosPrinter.text(`${receiptData.branchName}\n`)
      this.escPosPrinter.text("POS & Inventory Management\n\n")

      // Transaction details
      this.escPosPrinter.alignLeft()
      this.escPosPrinter.text("--------------------------------\n")
      this.escPosPrinter.text(`Receipt #: ${receiptData.transactionNumber}\n`)
      this.escPosPrinter.text(`Date: ${receiptData.date}\n`)
      this.escPosPrinter.text(`Time: ${receiptData.time}\n`)
      this.escPosPrinter.text(`Cashier: ${receiptData.cashierName}\n`)
      
      if (receiptData.isStaffCheckout) {
        this.escPosPrinter.alignCenter()
        this.escPosPrinter.printMode({ emphasized: true })
        this.escPosPrinter.text("*** STAFF PURCHASE ***\n")
        this.escPosPrinter.printMode({ emphasized: false })
        this.escPosPrinter.alignLeft()
      }
      
      this.escPosPrinter.text("--------------------------------\n")

      // Items header
      this.escPosPrinter.printMode({ emphasized: true })
      this.escPosPrinter.text("ITEM                QTY  PRICE  TOTAL\n")
      this.escPosPrinter.printMode({ emphasized: false })
      this.escPosPrinter.text("--------------------------------\n")

      // Items
      for (const item of receiptData.items) {
        // Item name (English)
        this.escPosPrinter.printMode({ emphasized: true })
        this.escPosPrinter.text(`${item.name_en.substring(0, 32)}\n`)
        this.escPosPrinter.printMode({ emphasized: false })
        
        // Item name (Myanmar)
        this.escPosPrinter.text(`${item.name_mm.substring(0, 32)}\n`)
        
        // Quantity, price, and total
        const qtyPriceTotal = `${item.quantity.toString().padStart(3)}  RM${item.price.toFixed(2).padStart(6)}  RM${item.total.toFixed(2)}`
        this.escPosPrinter.alignRight()
        this.escPosPrinter.text(`${qtyPriceTotal}\n`)
        this.escPosPrinter.alignLeft()
        this.escPosPrinter.text("\n")
      }

      // Total
      this.escPosPrinter.text("--------------------------------\n")
      this.escPosPrinter.alignRight()
      this.escPosPrinter.printMode({ emphasized: true, doubleHeight: true })
      this.escPosPrinter.text(`TOTAL: RM ${receiptData.total.toFixed(2)}\n`)
      this.escPosPrinter.printMode({ emphasized: false, doubleHeight: false })
      this.escPosPrinter.alignLeft()
      
      this.escPosPrinter.text("--------------------------------\n")

      // Payment method
      this.escPosPrinter.text(`Payment: ${receiptData.paymentMethod.toUpperCase()}\n`)
      this.escPosPrinter.text("--------------------------------\n")

      // Footer
      this.escPosPrinter.alignCenter()
      this.escPosPrinter.text("\n")
      this.escPosPrinter.text("Thank you for your purchase!\n")
      this.escPosPrinter.text("Please keep this receipt\n")
      this.escPosPrinter.text("for your records\n")
      this.escPosPrinter.text("Visit us again soon!\n")
      this.escPosPrinter.text("\n")
      this.escPosPrinter.text("--------------------------------\n")
      this.escPosPrinter.text("Generated by Grocery Store POS\n")
      
      // Extra spacing and cut paper
      this.escPosPrinter.feed(3)
      this.escPosPrinter.cut()

      // Send to printer
      await this.escPosPrinter.print()
      return true
    } catch (error) {
      console.error('Error printing with ESC/POS:', error)
      return false
    }
  }

  // Browser fallback printing
  private printBrowserFallback(receiptData: ReceiptData): void {
    const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes')
    if (!printWindow) {
      alert('Please allow popups for this site to print receipts')
      return
    }
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 10px;
              width: 300px;
              background: white;
            }
            .receipt {
              width: 100%;
              max-width: 300px;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 16px; }
            .small { font-size: 10px; }
            .dashed { border-bottom: 1px dashed #000; }
            .solid { border-bottom: 1px solid #000; }
            .flex { display: flex; justify-content: space-between; }
            .mb-1 { margin-bottom: 3px; }
            .mb-2 { margin-bottom: 5px; }
            .mb-3 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 15px; }
            .pt-2 { padding-top: 5px; }
            .pt-3 { padding-top: 10px; }
            .staff-badge {
              text-align: center;
              margin-top: 5px;
              padding: 3px;
              background: #f0f0f0;
              border: 1px solid #ccc;
              font-size: 10px;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 5mm; }
              @page { size: 80mm auto; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center mb-4">
              <div class="bold large">GROCERY STORE</div>
              <div class="mb-1">${receiptData.branchName}</div>
              <div class="small">POS & Inventory Management</div>
            </div>

            <div class="mb-4 dashed pb-2">
              <div class="flex mb-1">
                <span>Receipt #:</span>
                <span class="bold">${receiptData.transactionNumber}</span>
              </div>
              <div class="flex mb-1">
                <span>Date:</span>
                <span>${receiptData.date}</span>
              </div>
              <div class="flex mb-1">
                <span>Time:</span>
                <span>${receiptData.time}</span>
              </div>
              <div class="flex mb-1">
                <span>Cashier:</span>
                <span>${receiptData.cashierName}</span>
              </div>
              ${receiptData.isStaffCheckout ? '<div class="staff-badge">STAFF PURCHASE</div>' : ''}
            </div>

            <div class="mb-4">
              <div class="flex bold solid mb-2">
                <span>ITEM</span>
                <span>QTY</span>
                <span>PRICE</span>
                <span>TOTAL</span>
              </div>
              
              ${receiptData.items.map(item => `
                <div class="mb-3">
                  <div class="bold mb-1">${item.name_en}</div>
                  <div class="small mb-1">${item.name_mm}</div>
                  <div class="flex small">
                    <span style="width: 40%"></span>
                    <span style="width: 15%; text-align: center">${item.quantity}</span>
                    <span style="width: 20%; text-align: right">RM ${item.price.toFixed(2)}</span>
                    <span style="width: 25%; text-align: right; font-weight: bold">RM ${item.total.toFixed(2)}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="dashed pt-3 mb-4">
              <div class="flex bold large">
                <span>TOTAL:</span>
                <span>RM ${receiptData.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="mb-4 dashed pb-2">
              <div class="flex">
                <span>Payment Method:</span>
                <span class="bold">${receiptData.paymentMethod.toUpperCase()}</span>
              </div>
            </div>

            <div class="center small">
              <div class="mb-1">Thank you for your purchase!</div>
              <div class="mb-1">Please keep this receipt for your records</div>
              <div class="mb-3">Visit us again soon!</div>
              <div class="small solid pt-2">Generated by Grocery Store POS System</div>
            </div>
          </div>
          
          <script>
            window.print();
            setTimeout(() => window.close(), 500);
          </script>
        </body>
      </html>
    `
    
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
  }

  // Open cash drawer (only works with direct printer connection)
  async openCashDrawer(): Promise<void> {
    if (this.config.method === 'web-serial' && this.isConnected) {
      await this.webSerialPrinter.openCashDrawer()
    } else if (this.config.method === 'esc-pos' && this.escPosPrinter) {
      try {
        // ESC/POS command for opening cash drawer
        this.escPosPrinter.text('\x1Bp\x00\x19\xFA') // Standard cash drawer command
        await this.escPosPrinter.print()
      } catch (error) {
        console.error('Failed to open cash drawer:', error)
      }
    }
  }

  // Update printer configuration
  setConfig(config: PrinterConfig): void {
    this.config = { ...this.config, ...config }
  }

  // Get current configuration
  getConfig(): PrinterConfig {
    return { ...this.config }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  // Get printer method
  getCurrentMethod(): PrinterMethod {
    return this.config.method
  }
}

// Singleton instance
let enhancedPrinterInstance: EnhancedReceiptPrinter | null = null

export const getEnhancedReceiptPrinter = (config?: PrinterConfig): EnhancedReceiptPrinter => {
  if (!enhancedPrinterInstance) {
    enhancedPrinterInstance = new EnhancedReceiptPrinter(config)
  } else if (config) {
    enhancedPrinterInstance.setConfig(config)
  }
  return enhancedPrinterInstance
}