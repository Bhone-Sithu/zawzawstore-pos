'use client'

import { useEffect, useRef, useState } from 'react'

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void
  minLength?: number
  maxLength?: number
  timeout?: number
  preventDefault?: boolean
  enabled?: boolean
  global?: boolean // Allow scanning even when other inputs are focused
}

export function useBarcodeScanner({
  onScan,
  minLength = 3,
  maxLength = 50,
  timeout = 100,
  preventDefault = true,
  enabled = true,
  global = false
}: BarcodeScannerOptions) {
  const [isScanning, setIsScanning] = useState(false)
  const scanBuffer = useRef('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle input field checks
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
      const isBarcodeInput = target.dataset.barcodeInput === 'true'
      
      // If global mode is enabled, allow scanning everywhere
      // If not global, only allow in barcode inputs or when no input is focused
      if (!global && isInputField && !isBarcodeInput) {
        return
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Handle Enter key (most scanners end with Enter)
      if (event.key === 'Enter') {
        if (preventDefault) {
          event.preventDefault()
        }
        
        const scannedCode = scanBuffer.current.trim()
        if (scannedCode.length >= minLength && scannedCode.length <= maxLength) {
          onScan(scannedCode)
          setIsScanning(false)
        }
        scanBuffer.current = ''
        return
      }

      // Handle regular characters
      if (event.key.length === 1) {
        if (preventDefault && !isInputField) {
          event.preventDefault()
        }
        
        if (scanBuffer.current === '') {
          setIsScanning(true)
        }
        
        scanBuffer.current += event.key

        // Set timeout to clear buffer if scanning stops
        timeoutRef.current = setTimeout(() => {
          scanBuffer.current = ''
          setIsScanning(false)
        }, timeout)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [onScan, minLength, maxLength, timeout, preventDefault, enabled, global])

  // Manual trigger for testing
  const triggerScan = (barcode: string) => {
    onScan(barcode)
  }

  return {
    isScanning,
    triggerScan
  }
}