'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ReceiptPrinter, getReceiptPrinter, printReceiptFallback } from '@/lib/receipt-printer'
import { ReceiptData } from '@/types/receipt.types'

interface ReceiptPrinterContextType {
  isConnected: boolean
  isConnecting: boolean
  connectPrinter: () => Promise<boolean>
  disconnectPrinter: () => Promise<void>
  printReceipt: (data: ReceiptData) => Promise<boolean>
  openCashDrawer: () => Promise<void>
  isSupported: boolean
}

const ReceiptPrinterContext = createContext<ReceiptPrinterContextType | undefined>(undefined)

interface ReceiptPrinterProviderProps {
  children: ReactNode
}

export function ReceiptPrinterProvider({ children }: ReceiptPrinterProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [printer] = useState(() => getReceiptPrinter())
  const [isSupported] = useState(() => ReceiptPrinter.isSupported())

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
      if (isConnected) {
        // Try direct printing first
        const success = await printer.printReceipt(data)
        if (success) {
          return true
        }
      }
      
      // Fallback to browser print (but still automatic)
      printReceiptFallback(data)
      return true
    } catch (error) {
      console.error('Failed to print receipt:', error)
      // Still fallback to browser print
      printReceiptFallback(data)
      return true
    }
  }

  const openCashDrawer = async (): Promise<void> => {
    if (isConnected) {
      await printer.openCashDrawer()
    }
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
    openCashDrawer,
    isSupported
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