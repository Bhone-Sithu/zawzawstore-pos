'use client'

import qz from 'qz-tray'
import type { ReceiptData } from '@/types/receipt.types'
import { ReceiptPrinter as WebSerialPrinter } from './receipt-printer'

export type PrinterMethod = 'web-serial' | 'qz-tray' | 'browser-fallback'

export interface PrinterConfig {
  method: PrinterMethod
  printerName?: string
  baudRate?: number
}

export class QZTrayPrinter {
  private webSerialPrinter: WebSerialPrinter
  private config: PrinterConfig
  private isConnected = false
  private selectedPrinter: string | null = null

  constructor(config: PrinterConfig = { method: 'qz-tray' }) {
    this.webSerialPrinter = new WebSerialPrinter()
    this.config = config
    this.selectedPrinter = null
  }

  // Check if QZ Tray is available
  static async isQZTraySupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect()
      }
      return qz.websocket.isActive()
    } catch (error) {
      console.warn('QZ Tray not available:', error)
      return false
    }
  }

  // Check if Web Serial is supported
  static isWebSerialSupported(): boolean {
    return WebSerialPrinter.isSupported()
  }

  // Get available printers from QZ Tray
  async getAvailablePrinters(): Promise<string[]> {
    if (this.config.method !== 'qz-tray') return []
    
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect()
      }
      
      const printers = await qz.printers.find()
      return printers || []
    } catch (error) {
      console.error('Failed to get printers from QZ Tray:', error)
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

        case 'qz-tray': {
          // Connect to QZ Tray
          if (!qz.websocket.isActive()) {
            await qz.websocket.connect()
          }

          if (!qz.websocket.isActive()) {
            throw new Error('QZ Tray is not running. Please start QZ Tray and try again.')
          }

          // Set printer
          if (this.config.printerName) {
            this.selectedPrinter = this.config.printerName
          } else {
            // Auto-select first available printer
            const printers = await this.getAvailablePrinters()
            if (printers.length === 0) {
              throw new Error('No printers found. Please ensure your thermal printer is connected and configured.')
            }
            this.selectedPrinter = printers[0]
          }

          this.isConnected = true
          return true
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
      throw error
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    try {
      switch (this.config.method) {
        case 'web-serial':
          await this.webSerialPrinter.disconnect()
          break
        case 'qz-tray':
          // QZ Tray doesn't need explicit disconnect for printers
          this.selectedPrinter = null
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

        case 'qz-tray':
          if (!this.isConnected) {
            await this.connect()
          }
          return await this.printWithQZTray(receiptData)

        case 'browser-fallback':
          this.printBrowserFallback(receiptData)
          return true

        default:
          throw new Error('Unknown printer method')
      }
    } catch (error) {
      console.error('Failed to print receipt:', error)
      
      // Only fallback to browser print if method is NOT qz-tray
      if (this.config.method !== 'qz-tray') {
        console.log('Falling back to browser print')
        this.printBrowserFallback(receiptData)
        return true
      }
      
      // For QZ Tray, throw the error instead of falling back
      throw error
    }
  }

  // Print using QZ Tray
  private async printWithQZTray(receiptData: ReceiptData): Promise<boolean> {
    if (!this.selectedPrinter) {
      throw new Error('No printer selected')
    }

    try {
      const config = qz.configs.create(this.selectedPrinter)
      
      // Use plain text for ALL printers (no ESC/POS commands)
      const plainText = this.buildPlainTextReceipt(receiptData)
      const data = [{
        type: 'raw' as const,
        format: 'plain' as const,
        data: plainText
      }]

      await qz.print(config, data)
      return true
    } catch (error) {
      console.error('Error printing with QZ Tray:', error)
      throw new Error(`Failed to print to ${this.selectedPrinter}. Please check the printer connection.`)
    }
  }


  // Build plain text receipt for office printers
  private buildPlainTextReceipt(receiptData: ReceiptData): string {
    const lines: string[] = []
    const width = 48 // Adjust for office printer width
    
    // Helper function to center text
    const centerText = (text: string): string => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2))
      return ' '.repeat(padding) + text
    }
    
    // Helper function to justify text (left-right)
    const justifyText = (left: string, right: string): string => {
      const totalLength = left.length + right.length
      if (totalLength >= width) {
        return (left + right).substring(0, width)
      }
      const spaces = ' '.repeat(width - totalLength)
      return left + spaces + right
    }
    
    // Header
    lines.push(centerText('GROCERY STORE'))
    lines.push(centerText(receiptData.branchName))
    
    // Transaction details
    lines.push(''.padEnd(width, '-'))
    lines.push(justifyText('Receipt #:', receiptData.transactionNumber))
    lines.push(justifyText('Date:', receiptData.date))
    lines.push(justifyText('Time:', receiptData.time))
    lines.push(justifyText('Cashier:', receiptData.cashierName))
    
    if (receiptData.isStaffCheckout) {
      lines.push(centerText('*** STAFF PURCHASE ***'))
    }
    
    lines.push(''.padEnd(width, '-'))
    
    // Items header
    lines.push(`ITEM${' '.repeat(20)}QTY  PRICE    TOTAL`)
    lines.push(''.padEnd(width, '-'))
    
    // Items
    for (const item of receiptData.items) {
      // Item name (English only - skip Myanmar for office printers)
      lines.push(item.name_en.substring(0, width))
      
      // Quantity, price, and total
      const qtyStr = item.quantity.toString().padStart(3)
      const priceStr = `RM${item.price.toFixed(2)}`.padStart(8)
      const totalStr = `RM${item.total.toFixed(2)}`
      const itemLine = `${' '.repeat(24)}${qtyStr}  ${priceStr}  ${totalStr}`
      lines.push(itemLine)
    }
    
    // Total
    lines.push(''.padEnd(width, '-'))
    const totalLine = justifyText('TOTAL:', `RM ${receiptData.total.toFixed(2)}`)
    lines.push(totalLine)
    lines.push(''.padEnd(width, '-'))
    
    // Payment method
    lines.push(justifyText('Payment:', receiptData.paymentMethod.toUpperCase()))
    lines.push(''.padEnd(width, '-'))
    
    // Footer
    lines.push(centerText('Thank you for your purchase!'))
    lines.push(centerText('Please keep this receipt'))
    lines.push(centerText('for your records'))
    lines.push(centerText('Visit us again soon!'))
    lines.push('')
    lines.push('')
    lines.push('')
    lines.push('')
    lines.push('')
    lines.push('')
    lines.push('')
    lines.push('')
    lines.push('')
    
    
    return lines.join('\n')
  }


  // Browser fallback printing
  private printBrowserFallback(receiptData: ReceiptData): void {
    const printWindow = window.open('', '_blank', 'width=400,scrollbars=yes,resizable=yes')
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
              body { 
                margin: 0; 
                padding: 0; 
                width: 80mm;
                font-size: 12px;
              }
              @page { 
                size: 80mm auto; 
                margin: 0; 
              }
              .receipt {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              * {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center mb-4">
              <div class="mb-1">GROCERY STORE</div>
              <div class="mb-1">${receiptData.branchName}</div>
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
    } else if (this.config.method === 'qz-tray' && this.selectedPrinter) {
      // Cash drawer functionality not available for plain text mode
      console.warn('Cash drawer not supported in plain text mode')
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

  // Get selected printer name
  getSelectedPrinter(): string | null {
    return this.selectedPrinter
  }
}

// Singleton instance
let qzPrinterInstance: QZTrayPrinter | null = null

export const getQZTrayPrinter = (config?: PrinterConfig): QZTrayPrinter => {
  if (!qzPrinterInstance) {
    qzPrinterInstance = new QZTrayPrinter(config)
  } else if (config) {
    qzPrinterInstance.setConfig(config)
  }
  return qzPrinterInstance
}