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
  scannerSpeed?: number // Time threshold to detect fast input (barcode scanner vs human)
}

export function useBarcodeScanner({
  onScan,
  minLength = 3,
  maxLength = 50,
  timeout = 100,
  preventDefault = true,
  enabled = true,
  global = false,
  scannerSpeed = 50 // ms - time window to detect scanner speed
}: BarcodeScannerOptions) {
  const [isScanning, setIsScanning] = useState(false)
  const scanBuffer = useRef('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKeyTime = useRef<number>(0)
  const firstKeyTime = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle input field checks
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
      const isBarcodeInput = target.dataset.barcodeInput === 'true'
      
      // If global mode is enabled, still respect barcode input focus
      // Allow scanning when: 1) no input focused, 2) barcode input focused, or 3) very fast input (scanner)
      if (isInputField && !isBarcodeInput && !global) {
        return
      }
      
      // For global mode, detect if user is actively typing in a regular input
      if (global && isInputField && !isBarcodeInput) {
        // Check if this might be manual typing (slower) vs scanner (very fast)
        const currentTime = Date.now()
        const timeSinceLastKey = currentTime - lastKeyTime.current
        
        // If user is actively typing (reasonable pace), don't interfere
        if (timeSinceLastKey > 100 && timeSinceLastKey < 2000) {
          return
        }
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      const currentTime = Date.now()

      // Handle Enter key (most scanners end with Enter)
      if (event.key === 'Enter') {
        if (preventDefault) {
          event.preventDefault()
        }
        
        const scannedCode = scanBuffer.current.trim()
        const scanDuration = currentTime - firstKeyTime.current
        
        // Check if this looks like a barcode scanner (fast input)
        const isFastInput = scanDuration < (scanBuffer.current.length * scannerSpeed)
        
        if (scannedCode.length >= minLength && scannedCode.length <= maxLength) {
          // For very fast input (likely barcode scanner), process immediately
          // For slower input, still process but may be manual entry
          onScan(scannedCode)
          setIsScanning(false)
        }
        
        // Reset everything
        scanBuffer.current = ''
        firstKeyTime.current = 0
        lastKeyTime.current = 0
        return
      }

      // Handle regular characters
      if (event.key.length === 1) {
        if (preventDefault && !isInputField) {
          event.preventDefault()
        }
        
        // Record timing for scanner detection
        if (scanBuffer.current === '') {
          setIsScanning(true)
          firstKeyTime.current = currentTime
        }
        
        // Check for consecutive fast keystrokes (barcode scanner characteristic)
        const timeBetweenKeys = currentTime - lastKeyTime.current
        lastKeyTime.current = currentTime
        
        scanBuffer.current += event.key

        // For very fast consecutive input, reduce timeout for immediate processing
        const isFastConsecutive = timeBetweenKeys < scannerSpeed && scanBuffer.current.length > 1
        const effectiveTimeout = isFastConsecutive ? timeout / 2 : timeout

        // Set timeout to clear buffer if scanning stops
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          // Auto-trigger scan for longer codes that might not end with Enter
          const scannedCode = scanBuffer.current.trim()
          const scanDuration = Date.now() - firstKeyTime.current
          const avgTimePerChar = scanDuration / scannedCode.length
          
          // If input was very fast and looks like a complete barcode, auto-scan
          if (scannedCode.length >= minLength && 
              scannedCode.length <= maxLength && 
              avgTimePerChar < scannerSpeed) {
            onScan(scannedCode)
          }
          
          // Clear buffer and reset
          scanBuffer.current = ''
          setIsScanning(false)
          firstKeyTime.current = 0
          lastKeyTime.current = 0
        }, effectiveTimeout)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [onScan, minLength, maxLength, timeout, preventDefault, enabled, global, scannerSpeed])

  // Manual trigger for testing
  const triggerScan = (barcode: string) => {
    onScan(barcode)
  }

  return {
    isScanning,
    triggerScan
  }
}