'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEnhancedBarcodeScanner } from '@/hooks/useEnhancedBarcodeScanner'
import { 
  Camera, 
  CameraOff, 
  Keyboard, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  X,
  Scan
} from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose?: () => void
  className?: string
  title?: string
}

export function BarcodeScanner({ 
  onScan, 
  onClose, 
  className = '',
  title = 'Barcode Scanner'
}: BarcodeScannerProps) {
  const [scanMode, setScanMode] = useState<'keyboard' | 'camera'>('keyboard')
  const [lastScannedCode, setLastScannedCode] = useState<string>('')

  const handleScan = (barcode: string) => {
    setLastScannedCode(barcode)
    onScan(barcode)
  }

  const {
    isCameraActive,
    cameraError,
    availableDevices,
    selectedDeviceId,
    startCameraScanning,
    stopCameraScanning,
    switchCamera,
    triggerScan,
    isScanning
  } = useEnhancedBarcodeScanner({
    onScan: handleScan,
    keyboardEnabled: scanMode === 'keyboard',
    cameraEnabled: scanMode === 'camera',
    global: scanMode === 'keyboard',
    continuous: true,
    onError: (error) => {
      console.error('Barcode scanner error:', error)
    }
  })

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={scanMode === 'keyboard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (isCameraActive) stopCameraScanning()
              setScanMode('keyboard')
            }}
            className={`cursor-pointer ${
              scanMode === 'keyboard' 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'hover:bg-orange-50'
            }`}
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Keyboard
          </Button>
          <Button
            variant={scanMode === 'camera' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScanMode('camera')}
            className={`cursor-pointer ${
              scanMode === 'camera' 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'hover:bg-orange-50'
            }`}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scanning Status */}
        {isScanning && (
          <div className={`p-3 rounded-lg border flex items-center gap-3 ${
            scanMode === 'keyboard' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <Scan className={`h-5 w-5 ${
              scanMode === 'keyboard' ? 'text-blue-600' : 'text-green-600'
            } animate-pulse`} />
            <div>
              <p className={`font-medium ${
                scanMode === 'keyboard' ? 'text-blue-800' : 'text-green-800'
              }`}>
                {scanMode === 'keyboard' ? 'Detecting barcode input...' : 'Scanning for barcode...'}
              </p>
              <p className={`text-sm ${
                scanMode === 'keyboard' ? 'text-blue-600' : 'text-green-600'
              }`}>
                {scanMode === 'keyboard' 
                  ? 'Use your barcode scanner or type manually' 
                  : 'Point camera at barcode'
                }
              </p>
            </div>
          </div>
        )}

        {/* Keyboard Mode */}
        {scanMode === 'keyboard' && (
          <div className="space-y-3">
            <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Keyboard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Ready for barcode input</p>
              <p className="text-sm text-gray-500 mt-1">
                Scan with your barcode scanner or focus and type
              </p>
            </div>
            
            {/* Test Button */}
            <Button
              variant="outline"
              onClick={() => triggerScan('123456789')}
              className="w-full cursor-pointer"
              size="sm"
            >
              Test with Sample Code
            </Button>
          </div>
        )}

        {/* Camera Mode */}
        {scanMode === 'camera' && (
          <div className="space-y-3">
            {/* Camera Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={isCameraActive ? 'default' : 'secondary'}>
                  {isCameraActive ? 'Active' : 'Inactive'}
                </Badge>
                {cameraError && (
                  <Badge variant="destructive" className="bg-red-100 text-red-700">
                    Error
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {!isCameraActive ? (
                  <Button
                    onClick={startCameraScanning}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button
                    onClick={stopCameraScanning}
                    size="sm"
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </div>

            {/* Camera Device Selector */}
            {availableDevices.length > 1 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Camera Device:</p>
                <div className="flex flex-wrap gap-2">
                  {availableDevices.map((device) => (
                    <Button
                      key={device.deviceId}
                      variant={selectedDeviceId === device.deviceId ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => switchCamera(device.deviceId)}
                      className={`cursor-pointer text-xs ${
                        selectedDeviceId === device.deviceId
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'hover:bg-orange-50'
                      }`}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      {device.label || `Camera ${device.deviceId.slice(-4)}`}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Video Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                id="barcode-scanner-video"
                className="w-full h-48 object-cover"
                playsInline
                muted
              />
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                  <div className="text-center text-white">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Camera not active</p>
                  </div>
                </div>
              )}
              {isCameraActive && (
                <div className="absolute inset-0 border-2 border-orange-500 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-24 border-2 border-orange-400 rounded-lg bg-orange-500 bg-opacity-10">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-400"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Error */}
            {cameraError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Camera Error</p>
                  <p className="text-sm text-red-600">{cameraError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Last Scanned Code */}
        {lastScannedCode && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-800">Last Scanned:</p>
              <p className="text-sm text-green-600 font-mono break-all">{lastScannedCode}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLastScannedCode('')}
              className="cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}