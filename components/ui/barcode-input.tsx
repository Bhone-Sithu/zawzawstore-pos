'use client'

import { useState, useRef } from 'react'
import { Input } from './input'
import { Button } from './button'
import { Scan, X } from 'lucide-react'
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
    enabled: isFocused,
    preventDefault: true,
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

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow normal typing when focused
    if (e.key === 'Escape') {
      inputRef.current?.blur()
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
          className={`pl-10 pr-10 ${className}`}
        />
        
        {value && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-gray-100 cursor-pointer"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      {(isScanning || isFocused) && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border border-gray-200 rounded-md shadow-sm text-xs z-10">
          {isScanning ? (
            <div className="flex items-center gap-2 text-green-600">
              <Scan className="h-3 w-3 animate-pulse" />
              <span>Scanning barcode...</span>
            </div>
          ) : (
            <div className="text-gray-500">
              <div>• Scan with barcode scanner</div>
              <div>• Or type manually</div>
              <div>• Press ESC to cancel</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}