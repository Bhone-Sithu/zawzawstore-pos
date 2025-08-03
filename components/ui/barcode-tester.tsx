'use client'

import { useState } from 'react'
import { BarcodeInput } from './barcode-input'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

export function BarcodeTester() {
  const [scannedCodes, setScannedCodes] = useState<string[]>([])
  const [currentValue, setCurrentValue] = useState('')

  const handleScan = (barcode: string) => {
    setScannedCodes(prev => [barcode, ...prev.slice(0, 9)]) // Keep last 10 scans
  }

  const testScan = (testBarcode: string) => {
    setCurrentValue(testBarcode)
    handleScan(testBarcode)
  }

  const clearHistory = () => {
    setScannedCodes([])
    setCurrentValue('')
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Barcode Scanner Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BarcodeInput
          value={currentValue}
          onChange={setCurrentValue}
          onScan={handleScan}
          placeholder="Focus here and scan a barcode..."
        />
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Test with sample barcodes:</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testScan('123456789012')}
              className="cursor-pointer"
            >
              Test UPC
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testScan('1234567890123')}
              className="cursor-pointer"
            >
              Test EAN
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testScan('ABC123DEF456')}
              className="cursor-pointer"
            >
              Test Code
            </Button>
          </div>
        </div>

        {scannedCodes.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Scan History:</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="cursor-pointer"
              >
                Clear
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {scannedCodes.map((code, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded border">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}