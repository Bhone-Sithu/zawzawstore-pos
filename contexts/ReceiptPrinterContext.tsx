'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { printReceiptFallback } from '@/lib/receipt-printer'
import { QZTrayPrinter, getQZTrayPrinter, type PrinterMethod, type PrinterConfig } from '@/lib/qz-tray-printer'
import type { ReceiptData } from '@/types/receipt.types'

interface ReceiptPrinterContextType {
  isConnected: boolean
  isConnecting: boolean
  connectPrinter: () => Promise<boolean>
  disconnectPrinter: () => Promise<void>
  printReceipt: (data: ReceiptData) => Promise<boolean>
  printBarcodeSticker: (product: { name_en: string; base_price: number; barcode: string }) => Promise<boolean>
  openCashDrawer: () => Promise<void>
  isWebSerialSupported: boolean
  isQZTraySupported: boolean
  currentMethod: PrinterMethod
  setMethod: (method: PrinterMethod) => void
  setPrinterName: (name: string) => void
  getAvailablePrinters: () => Promise<string[]>
  config: PrinterConfig
}

const ReceiptPrinterContext = createContext<ReceiptPrinterContextType | undefined>(undefined)

interface ReceiptPrinterProviderProps {
  children: ReactNode
}

export function ReceiptPrinterProvider({ children }: ReceiptPrinterProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [printer] = useState(() => getQZTrayPrinter())
  const [isWebSerialSupported] = useState(() => QZTrayPrinter.isWebSerialSupported())
  const [isQZTraySupported, setIsQZTraySupported] = useState(false)
  
  // Check QZ Tray support on mount
  useEffect(() => {
    QZTrayPrinter.isQZTraySupported().then(setIsQZTraySupported)
  }, [])

  const connectPrinter = async (): Promise<boolean> => {
    if (isConnecting || isConnected) return isConnected

    setIsConnecting(true)
    try {
      const connected = await printer.connect()
      setIsConnected(connected)
      return connected
    } catch (error) {
      console.error('Failed to connect printer:', error)
      setIsConnected(false)
      
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Printer Connection Failed:\n\n${error.message}`)
      } else {
        alert('Failed to connect to printer. Please check your printer setup.')
      }
      
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectPrinter = async (): Promise<void> => {
    try {
      await printer.disconnect()
      setIsConnected(false)
    } catch (error) {
      console.error('Failed to disconnect printer:', error)
    }
  }

  const printReceipt = async (data: ReceiptData): Promise<boolean> => {
    try {
      return await printer.printReceipt(data)
    } catch (error) {
      console.error('Failed to print receipt:', error)
      
      // Show user-friendly error message for QZ Tray
      if (printer.getCurrentMethod() === 'qz-tray') {
        if (error instanceof Error) {
          alert(`Printing Failed:\n\n${error.message}`)
        } else {
          alert('Failed to print receipt. Please check your printer connection.')
        }
        return false
      }
      
      // Fallback to browser print for other methods
      printReceiptFallback(data)
      return true
    }
  }

  const printBarcodeSticker = async (product: { name_en: string; base_price: number; barcode: string }): Promise<boolean> => {
    console.log('printBarcodeSticker called with:', product)
    console.log('Printer method:', printer.getCurrentMethod(), 'Connected:', isConnected)
    
    try {
      const result = await printer.printBarcodeSticker(product)
      console.log('Printer result:', result)
      return result
    } catch (error) {
      console.error('Failed to print barcode sticker:', error)
      
      // Always try browser fallback if QZ Tray fails
      console.log('Attempting browser fallback for sticker printing...')
      try {
        // Force browser fallback printing
        printer.setConfig({ ...printer.getConfig(), method: 'browser-fallback' })
        const fallbackResult = await printer.printBarcodeSticker(product)
        console.log('Browser fallback result:', fallbackResult)
        return fallbackResult
      } catch (fallbackError) {
        console.error('Browser fallback also failed:', fallbackError)
        
        // Show user-friendly error message
        if (error instanceof Error) {
          alert(`Sticker Printing Failed:\n\n${error.message}`)
        } else {
          alert('Failed to print barcode sticker. Please check your printer connection.')
        }
        return false
      }
    }
  }

  const openCashDrawer = async (): Promise<void> => {
    if (isConnected) {
      await printer.openCashDrawer()
    }
  }

  const setMethod = (method: PrinterMethod): void => {
    const currentConfig = printer.getConfig()
    printer.setConfig({ ...currentConfig, method })
    // Disconnect if switching methods
    if (isConnected) {
      disconnectPrinter()
    }
  }

  const setPrinterName = (name: string): void => {
    const currentConfig = printer.getConfig()
    printer.setConfig({ ...currentConfig, printerName: name })
  }

  const getAvailablePrinters = async (): Promise<string[]> => {
    return printer.getAvailablePrinters()
  }

  // Auto-disconnect on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isConnected) {
        printer.disconnect()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (isConnected) {
        printer.disconnect()
      }
    }
  }, [isConnected, printer])

  const value: ReceiptPrinterContextType = {
    isConnected,
    isConnecting,
    connectPrinter,
    disconnectPrinter,
    printReceipt,
    printBarcodeSticker,
    openCashDrawer,
    isWebSerialSupported,
    isQZTraySupported,
    currentMethod: printer.getCurrentMethod(),
    setMethod,
    setPrinterName,
    getAvailablePrinters,
    config: printer.getConfig()
  }

  return (
    <ReceiptPrinterContext.Provider value={value}>
      {children}
    </ReceiptPrinterContext.Provider>
  )
}

export function useReceiptPrinter(): ReceiptPrinterContextType {
  const context = useContext(ReceiptPrinterContext)
  if (context === undefined) {
    throw new Error('useReceiptPrinter must be used within a ReceiptPrinterProvider')
  }
  return context
}