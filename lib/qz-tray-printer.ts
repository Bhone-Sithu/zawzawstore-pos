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
      // Create ESC/POS commands for thermal printer
      const commands = this.buildESCPOSCommands(receiptData)
      
      const config = qz.configs.create(this.selectedPrinter)
      
      const data = [{
        type: 'raw' as const,
        format: 'command' as const,
        data: commands
      }]

      await qz.print(config, data)
      return true
    } catch (error) {
      console.error('Error printing with QZ Tray:', error)
      throw new Error(`Failed to print to ${this.selectedPrinter}. Please check the printer connection.`)
    }
  }

  // Build ESC/POS commands for thermal printer
  private buildESCPOSCommands(receiptData: ReceiptData): string[] {
    const commands: string[] = []
    
    // ESC/POS command constants
    const ESC = '\x1B'
    const GS = '\x1D'
    
    // Initialize printer
    commands.push(ESC + '@')
    
    // Header - Center aligned, bold, double height
    commands.push(ESC + 'a' + '1') // Center align
    commands.push(GS + '!' + '\x11') // Double size
    commands.push(ESC + 'E' + '1') // Bold on
    commands.push('GROCERY STORE\n')
    
    // Normal size, still bold
    commands.push(GS + '!' + '\x00') // Normal size
    commands.push(`${receiptData.branchName}\n`)
    commands.push(ESC + 'E' + '0') // Bold off
    commands.push('POS & Inventory Management\n\n')

    // Transaction details - Left aligned
    commands.push(ESC + 'a' + '0') // Left align
    commands.push('--------------------------------\n')
    commands.push(`Receipt #: ${receiptData.transactionNumber}\n`)
    commands.push(`Date: ${receiptData.date}\n`)
    commands.push(`Time: ${receiptData.time}\n`)
    commands.push(`Cashier: ${receiptData.cashierName}\n`)
    
    if (receiptData.isStaffCheckout) {
      commands.push(ESC + 'a' + '1') // Center align
      commands.push(ESC + 'E' + '1') // Bold on
      commands.push('*** STAFF PURCHASE ***\n')
      commands.push(ESC + 'E' + '0') // Bold off
      commands.push(ESC + 'a' + '0') // Left align
    }
    
    commands.push('--------------------------------\n')

    // Items header
    commands.push(ESC + 'E' + '1') // Bold on
    commands.push('ITEM                QTY  PRICE  TOTAL\n')
    commands.push(ESC + 'E' + '0') // Bold off
    commands.push('--------------------------------\n')

    // Items
    for (const item of receiptData.items) {
      // Item name (English) - Bold
      commands.push(ESC + 'E' + '1')
      commands.push(`${item.name_en.substring(0, 32)}\n`)
      commands.push(ESC + 'E' + '0')
      
      // Item name (Myanmar)
      commands.push(`${item.name_mm.substring(0, 32)}\n`)
      
      // Quantity, price, and total - Right aligned
      const qtyPriceTotal = `${item.quantity.toString().padStart(3)}  RM${item.price.toFixed(2).padStart(6)}  RM${item.total.toFixed(2)}`
      commands.push(ESC + 'a' + '2') // Right align
      commands.push(`${qtyPriceTotal}\n`)
      commands.push(ESC + 'a' + '0') // Left align
      commands.push('\n')
    }

    // Total
    commands.push('--------------------------------\n')
    commands.push(ESC + 'a' + '2') // Right align
    commands.push(GS + '!' + '\x11') // Double size
    commands.push(ESC + 'E' + '1') // Bold on
    commands.push(`TOTAL: RM ${receiptData.total.toFixed(2)}\n`)
    commands.push(GS + '!' + '\x00') // Normal size
    commands.push(ESC + 'E' + '0') // Bold off
    commands.push(ESC + 'a' + '0') // Left align
    
    commands.push('--------------------------------\n')

    // Payment method
    commands.push(`Payment: ${receiptData.paymentMethod.toUpperCase()}\n`)
    commands.push('--------------------------------\n')

    // Footer - Center aligned
    commands.push(ESC + 'a' + '1') // Center align
    commands.push('\n')
    commands.push('Thank you for your purchase!\n')
    commands.push('Please keep this receipt\n')
    commands.push('for your records\n')
    commands.push('Visit us again soon!\n')
    commands.push('\n')
    commands.push('--------------------------------\n')
    commands.push('Generated by Grocery Store POS\n')
    
    // Extra spacing and cut paper
    commands.push('\n\n\n')
    commands.push(GS + 'V' + 'A' + '0') // Cut paper

    return commands
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
    } else if (this.config.method === 'qz-tray' && this.selectedPrinter) {
      try {
        const config = qz.configs.create(this.selectedPrinter)
        const data = [{
          type: 'raw' as const,
          format: 'command' as const,
          data: ['\x1Bp\x00\x19\xFA'] // Standard cash drawer command
        }]
        await qz.print(config, data)
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