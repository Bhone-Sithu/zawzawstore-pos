'use client'

import { useState, useRef } from 'react'
import { Input } from './input'
import { Scan } from 'lucide-react'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'

interface BarcodeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  onScan?: (barcode: string) => void
}

export function BarcodeInput({
  value,
  onChange,
  placeholder = "Scan or type barcode...",
  disabled = false,
  className = "",
  onScan
}: BarcodeInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleScan = (scannedBarcode: string) => {
    onChange(scannedBarcode)
    if (onScan) {
      onScan(scannedBarcode)
    }
  }

  const { isScanning } = useBarcodeScanner({
    onScan: handleScan,
    enabled: isFocused, // Enable when input is focused
    preventDefault: false,
    minLength: 1,
    maxLength: 50,
    timeout: 150
  })

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow normal typing when focused
    if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
    // Trigger search on Enter key
    if (e.key === 'Enter' && onScan && value.trim()) {
      e.preventDefault()
      onScan(value.trim())
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Scan className={`h-4 w-4 transition-colors ${
            isScanning ? 'text-green-500 animate-pulse' : 
            isFocused ? 'text-orange-500' : 'text-gray-400'
          }`} />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          data-barcode-input="true"
          className={`pl-10 ${className}`}
        />
        
      </div>
      
      
    </div>
  )
}