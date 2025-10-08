'use client'

import { ReceiptData } from '@/types/receipt.types'

// Web Serial API types
interface SerialPort {
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
}

interface SerialOptions {
  baudRate: number
  dataBits?: number
  stopBits?: number
  parity?: 'none' | 'even' | 'odd'
  bufferSize?: number
  flowControl?: 'none' | 'hardware'
}

interface Serial {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
  getPorts(): Promise<SerialPort[]>
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[]
}

interface SerialPortFilter {
  usbVendorId?: number
  usbProductId?: number
}

declare global {
  interface Navigator {
    serial?: Serial
  }
}

// ESC/POS command constants
const ESC = '\x1B'
const GS = '\x1D'

// ESC/POS Commands
const COMMANDS = {
  INIT: ESC + '@',              // Initialize printer
  ALIGN_CENTER: ESC + 'a' + '1', // Center alignment
  ALIGN_LEFT: ESC + 'a' + '0',   // Left alignment
  ALIGN_RIGHT: ESC + 'a' + '2',  // Right alignment
  BOLD_ON: ESC + 'E' + '1',      // Bold on
  BOLD_OFF: ESC + 'E' + '0',     // Bold off
  SIZE_NORMAL: GS + '!' + '\x00', // Normal size
  SIZE_DOUBLE: GS + '!' + '\x11', // Double size
  CUT_PAPER: GS + 'V' + 'A' + '0', // Cut paper
  LINE_FEED: '\n',               // Line feed
  DRAWER_OPEN: ESC + 'p' + '0' + '25' + '250', // Open cash drawer
  UNDERLINE_ON: ESC + '-' + '1', // Underline on
  UNDERLINE_OFF: ESC + '-' + '0' // Underline off
}

export class ReceiptPrinter {
  private port: SerialPort | null = null
  private writer: WritableStreamDefaultWriter | null = null

  // Check if Web Serial API is supported
  static isSupported(): boolean {
    return 'serial' in navigator
  }

  // Connect to receipt printer
  async connect(): Promise<boolean> {
    if (!ReceiptPrinter.isSupported()) {
      console.warn('Web Serial API not supported')
      return false
    }

    try {
      // Request port access
      if (!navigator.serial) {
        throw new Error('Web Serial API not available')
      }
      
      this.port = await navigator.serial.requestPort({
        filters: [
          // Common receipt printer vendor IDs
          { usbVendorId: 0x04b8 }, // Epson
          { usbVendorId: 0x0519 }, // Star Micronics
          { usbVendorId: 0x154f }, // Bixolon
          { usbVendorId: 0x0fe6 }, // ICS Electronics
        ]
      })

      // Open the port
      await this.port.open({ 
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      })

      this.writer = this.port.writable?.getWriter() || null
      
      // Initialize printer
      await this.sendCommand(COMMANDS.INIT)
      
      return true
    } catch (error) {
      console.error('Failed to connect to printer:', error)
      return false
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.close()
        this.writer = null
      }
      if (this.port) {
        await this.port.close()
        this.port = null
      }
    } catch (error) {
      console.error('Error disconnecting printer:', error)
    }
  }

  // Send command to printer
  private async sendCommand(command: string): Promise<void> {
    if (!this.writer) return
    
    const encoder = new TextEncoder()
    await this.writer.write(encoder.encode(command))
  }

  // Send text to printer
  private async sendText(text: string): Promise<void> {
    if (!this.writer) return
    
    const encoder = new TextEncoder()
    await this.writer.write(encoder.encode(text))
  }

  // Format text to specific width with padding
  private formatLine(left: string, right: string = '', width: number = 32): string {
    const totalLength = left.length + right.length
    if (totalLength >= width) {
      return (left + right).substring(0, width)
    }
    const spaces = ' '.repeat(width - totalLength)
    return left + spaces + right
  }

  // Print dashed line
  private async printDashedLine(width: number = 32): Promise<void> {
    await this.sendText('-'.repeat(width) + COMMANDS.LINE_FEED)
  }

  // Print receipt
  async printReceipt(receiptData: ReceiptData): Promise<boolean> {
    if (!this.writer) {
      console.error('Printer not connected')
      return false
    }

    try {
      // Initialize and set font
      await this.sendCommand(COMMANDS.INIT)
      
      // Header
      await this.sendCommand(COMMANDS.ALIGN_CENTER)
      await this.sendCommand(COMMANDS.SIZE_DOUBLE)
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.sendText('GROCERY STORE' + COMMANDS.LINE_FEED)
      
      await this.sendCommand(COMMANDS.SIZE_NORMAL)
      await this.sendCommand(COMMANDS.BOLD_OFF)
      await this.sendText(receiptData.branchName + COMMANDS.LINE_FEED)
      await this.sendText('POS & Inventory Management' + COMMANDS.LINE_FEED)
      await this.sendText(COMMANDS.LINE_FEED)

      // Transaction details
      await this.sendCommand(COMMANDS.ALIGN_LEFT)
      await this.printDashedLine()
      
      await this.sendText(this.formatLine('Receipt #:', receiptData.transactionNumber) + COMMANDS.LINE_FEED)
      await this.sendText(this.formatLine('Date:', receiptData.date) + COMMANDS.LINE_FEED)
      await this.sendText(this.formatLine('Time:', receiptData.time) + COMMANDS.LINE_FEED)
      await this.sendText(this.formatLine('Cashier:', receiptData.cashierName) + COMMANDS.LINE_FEED)
      
      if (receiptData.isStaffCheckout) {
        await this.sendCommand(COMMANDS.ALIGN_CENTER)
        await this.sendCommand(COMMANDS.BOLD_ON)
        await this.sendText('*** STAFF PURCHASE ***' + COMMANDS.LINE_FEED)
        await this.sendCommand(COMMANDS.BOLD_OFF)
        await this.sendCommand(COMMANDS.ALIGN_LEFT)
      }
      
      await this.printDashedLine()

      // Items header
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.sendText(this.formatLine('ITEM', 'QTY  PRICE  TOTAL') + COMMANDS.LINE_FEED)
      await this.sendCommand(COMMANDS.BOLD_OFF)
      await this.printDashedLine()

      // Items
      for (const item of receiptData.items) {
        // Item name (English)
        await this.sendCommand(COMMANDS.BOLD_ON)
        await this.sendText(item.name_en.substring(0, 32) + COMMANDS.LINE_FEED)
        await this.sendCommand(COMMANDS.BOLD_OFF)
        
        // Item name (Myanmar) - smaller font
        await this.sendText(item.name_mm.substring(0, 32) + COMMANDS.LINE_FEED)
        
        // Quantity, price, and total
        const qtyPriceTotal = `${item.quantity}  RM${item.price.toFixed(2)}  RM${item.total.toFixed(2)}`
        await this.sendCommand(COMMANDS.ALIGN_RIGHT)
        await this.sendText(qtyPriceTotal + COMMANDS.LINE_FEED)
        await this.sendCommand(COMMANDS.ALIGN_LEFT)
        await this.sendText(COMMANDS.LINE_FEED)
      }

      // Total
      await this.printDashedLine()
      await this.sendCommand(COMMANDS.ALIGN_RIGHT)
      await this.sendCommand(COMMANDS.SIZE_DOUBLE)
      await this.sendCommand(COMMANDS.BOLD_ON)
      await this.sendText(`TOTAL: RM ${receiptData.total.toFixed(2)}` + COMMANDS.LINE_FEED)
      await this.sendCommand(COMMANDS.SIZE_NORMAL)
      await this.sendCommand(COMMANDS.BOLD_OFF)
      await this.sendCommand(COMMANDS.ALIGN_LEFT)
      
      await this.printDashedLine()

      // Payment method
      await this.sendText(this.formatLine('Payment:', receiptData.paymentMethod.toUpperCase()) + COMMANDS.LINE_FEED)
      await this.printDashedLine()

      // Footer
      await this.sendCommand(COMMANDS.ALIGN_CENTER)
      await this.sendText(COMMANDS.LINE_FEED)
      await this.sendText('Thank you for your purchase!' + COMMANDS.LINE_FEED)
      await this.sendText('Please keep this receipt' + COMMANDS.LINE_FEED)
      await this.sendText('for your records' + COMMANDS.LINE_FEED)
      await this.sendText('Visit us again soon!' + COMMANDS.LINE_FEED)
      await this.sendText(COMMANDS.LINE_FEED)
      await this.printDashedLine()
      await this.sendText('Generated by Grocery Store POS' + COMMANDS.LINE_FEED)
      
      // Extra spacing and cut paper
      await this.sendText(COMMANDS.LINE_FEED + COMMANDS.LINE_FEED + COMMANDS.LINE_FEED)
      await this.sendCommand(COMMANDS.CUT_PAPER)

      return true
    } catch (error) {
      console.error('Error printing receipt:', error)
      return false
    }
  }

  // Open cash drawer (if connected)
  async openCashDrawer(): Promise<void> {
    if (!this.writer) return
    await this.sendCommand(COMMANDS.DRAWER_OPEN)
  }
}

// Singleton instance
let printerInstance: ReceiptPrinter | null = null

export const getReceiptPrinter = (): ReceiptPrinter => {
  if (!printerInstance) {
    printerInstance = new ReceiptPrinter()
  }
  return printerInstance
}

// Fallback to browser print if direct printing fails
export const printReceiptFallback = (receiptData: ReceiptData): void => {
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
          // Auto print immediately without dialog
          window.print();
          // Close window after a short delay
          setTimeout(() => window.close(), 500);
        </script>
      </body>
    </html>
  `
  
  printWindow.document.write(receiptHTML)
  printWindow.document.close()
}