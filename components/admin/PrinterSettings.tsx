'use client'

import { useState } from 'react'
import { useReceiptPrinter } from '@/contexts/ReceiptPrinterContext'
import type { PrinterMethod } from '@/lib/qz-tray-printer'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Printer, Wifi, Cable, Globe, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react'

export function PrinterSettings() {
  const {
    isConnected,
    isConnecting,
    connectPrinter,
    disconnectPrinter,
    isWebSerialSupported,
    isQZTraySupported,
    currentMethod,
    setMethod,
    setPrinterName,
    getAvailablePrinters,
    config,
    printReceipt
  } = useReceiptPrinter()

  const [availablePrinters, setAvailablePrinters] = useState<string[]>([])
  const [loadingPrinters, setLoadingPrinters] = useState(false)
  const [testPrinting, setTestPrinting] = useState(false)

  // Don't auto-load printers when method changes to prevent connection issues
  // useEffect(() => {
  //   if (currentMethod === 'qz-tray') {
  //     loadPrinters()
  //   }
  // }, [currentMethod])

  const loadPrinters = async () => {
    setLoadingPrinters(true)
    try {
      const printers = await getAvailablePrinters()
      setAvailablePrinters(printers)
    } catch (error) {
      console.error('Failed to load printers:', error)
    } finally {
      setLoadingPrinters(false)
    }
  }

  const handleMethodChange = (method: PrinterMethod) => {
    setMethod(method)
  }

  const handlePrinterChange = (printerName: string) => {
    setPrinterName(printerName)
  }

  const handleTestPrint = async () => {
    setTestPrinting(true)
    try {
      const testReceipt = {
        transactionNumber: 'TEST-001',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        branchName: 'Test Branch',
        cashierName: 'System Test',
        items: [
          {
            name_en: 'Test Item 1',
            name_mm: 'စမ်းသပ်ပစ္စည်း 1',
            quantity: 1,
            price: 5.50,
            total: 5.50
          },
          {
            name_en: 'Test Item 2',
            name_mm: 'စမ်းသပ်ပစ္စည်း 2',
            quantity: 2,
            price: 3.25,
            total: 6.50
          }
        ],
        subtotal: 12.00,
        tax: 0.00,
        total: 12.00,
        paymentMethod: 'cash',
        isStaffCheckout: false
      }

      await printReceipt(testReceipt)
    } catch (error) {
      console.error('Test print failed:', error)
    } finally {
      setTestPrinting(false)
    }
  }

  const getMethodIcon = (method: PrinterMethod) => {
    switch (method) {
      case 'web-serial':
        return <Cable className="h-4 w-4" />
      case 'qz-tray':
        return <Wifi className="h-4 w-4" />
      case 'browser-fallback':
        return <Globe className="h-4 w-4" />
      default:
        return <Printer className="h-4 w-4" />
    }
  }

  const getMethodDescription = (method: PrinterMethod) => {
    switch (method) {
      case 'web-serial':
        return 'Direct USB/Serial connection to thermal printer'
      case 'qz-tray':
        return 'Thermal printer via QZ Tray (recommended)'
      case 'browser-fallback':
        return 'Print using browser (fallback option)'
      default:
        return 'Unknown method'
    }
  }

  const getConnectionStatus = () => {
    if (currentMethod === 'browser-fallback') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Browser Ready
        </Badge>
      )
    }

    if (isConnected) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>
      )
    }

    if (isConnecting) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 animate-pulse" />
          Connecting...
        </Badge>
      )
    }

    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Disconnected
      </Badge>
    )
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-orange-600" />
          Printer Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Printer className="h-6 w-6 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Printer Status</p>
              <p className="text-sm text-gray-600 capitalize">{currentMethod.replace('-', ' ')} Mode</p>
            </div>
          </div>
          {getConnectionStatus()}
        </div>

        <Separator />

        {/* Printer Method Selection */}
        <div className="space-y-4">
          <div>
            <label htmlFor="printer-method" className="text-sm font-medium text-gray-900 mb-2 block">
              Printer Method
            </label>
            <Select value={currentMethod} onValueChange={handleMethodChange}>
              <SelectTrigger id="printer-method" className="cursor-pointer">
                <SelectValue placeholder="Select printer method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web-serial" disabled={!isWebSerialSupported}>
                  <div className="flex items-center gap-2">
                    {getMethodIcon('web-serial')}
                    <div>
                      <p className="font-medium">Web Serial (Direct USB)</p>
                      <p className="text-xs text-gray-500">
                        {isWebSerialSupported ? 'Supported' : 'Not supported in this browser'}
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="qz-tray" disabled={!isQZTraySupported}>
                  <div className="flex items-center gap-2">
                    {getMethodIcon('qz-tray')}
                    <div>
                      <p className="font-medium">QZ Tray (Thermal Printer)</p>
                      <p className="text-xs text-gray-500">
                        {isQZTraySupported ? 'Supported' : 'QZ Tray not running'}
                      </p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="browser-fallback">
                  <div className="flex items-center gap-2">
                    {getMethodIcon('browser-fallback')}
                    <div>
                      <p className="font-medium">Browser Print</p>
                      <p className="text-xs text-gray-500">Always available (fallback)</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 mt-1">
              {getMethodDescription(currentMethod)}
            </p>
          </div>

          {/* QZ Tray Printer Selection */}
          {currentMethod === 'qz-tray' && (
            <div>
              <label htmlFor="available-printers" className="text-sm font-medium text-gray-900 mb-2 block">
                Available Printers
              </label>
              <div className="flex gap-2">
                <Select 
                  value={config.printerName || ''} 
                  onValueChange={handlePrinterChange}
                  disabled={loadingPrinters || availablePrinters.length === 0}
                >
                  <SelectTrigger id="available-printers" className="flex-1">
                    <SelectValue placeholder={
                      loadingPrinters 
                        ? "Loading printers..." 
                        : availablePrinters.length === 0 
                          ? "Click 'Load Printers' to scan for printers" 
                          : "Select a printer"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrinters.map((printer) => (
                      <SelectItem key={printer} value={printer}>
                        {printer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPrinters}
                  disabled={loadingPrinters}
                  className="whitespace-nowrap"
                >
                  {loadingPrinters ? "Loading..." : "Load Printers"}
                </Button>
              </div>
              {availablePrinters.length === 0 && !loadingPrinters && (
                <p className="text-xs text-gray-600 mt-1">
                  Click &quot;Load Printers&quot; to scan for available printers. Make sure QZ Tray is running.
                </p>
              )}
            </div>
          )}

          {/* Web Serial Information */}
          {currentMethod === 'web-serial' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Web Serial Mode:</strong> Click connect to select your USB thermal printer. 
                Make sure your printer is connected and powered on.
              </p>
            </div>
          )}

          {/* QZ Tray Information */}
          {currentMethod === 'qz-tray' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>QZ Tray Mode:</strong> Download and install QZ Tray from qz.io, then configure your thermal printer. 
                This is the recommended method for thermal receipt printers.
              </p>
            </div>
          )}

          {/* Browser Fallback Information */}
          {currentMethod === 'browser-fallback' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Browser Print Mode:</strong> Receipts will open in a new window for printing. 
                This works with any printer but requires manual interaction.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Connection Actions */}
        <div className="flex gap-3">
          {currentMethod !== 'browser-fallback' && (
            <div className="flex gap-3">
              {!isConnected ? (
                <Button
                  onClick={connectPrinter}
                  disabled={isConnecting}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isConnecting ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2 animate-pulse" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-2" />
                      Connect Printer
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={disconnectPrinter}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          )}
          
          <Button
            onClick={handleTestPrint}
            disabled={testPrinting || (currentMethod !== 'browser-fallback' && !isConnected)}
            variant="outline"
            className="border-gray-300"
          >
            {testPrinting ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2 animate-pulse" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Test Print
              </>
            )}
          </Button>
        </div>

        {/* Support Information */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">System Support</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Web Serial API:</span>
              <Badge variant={isWebSerialSupported ? "default" : "secondary"} className={isWebSerialSupported ? "bg-green-100 text-green-800" : ""}>
                {isWebSerialSupported ? "Supported" : "Not Supported"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>QZ Tray:</span>
              <Badge variant={isQZTraySupported ? "default" : "secondary"} className={isQZTraySupported ? "bg-green-100 text-green-800" : ""}>
                {isQZTraySupported ? "Connected" : "Not Running"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}