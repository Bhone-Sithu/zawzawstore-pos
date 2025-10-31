'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

interface EnhancedBarcodeScannerOptions {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
  enabled?: boolean
  
  // Keyboard scanner options
  keyboardEnabled?: boolean
  minLength?: number
  maxLength?: number
  timeout?: number
  preventDefault?: boolean
  global?: boolean
  
  // Camera scanner options
  cameraEnabled?: boolean
  videoElementId?: string
  continuous?: boolean
  formats?: BarcodeFormat[]
}

export function useEnhancedBarcodeScanner({
  onScan,
  onError,
  enabled = true,
  keyboardEnabled = true,
  minLength = 3,
  maxLength = 50,
  timeout = 100,
  preventDefault = true,
  global = false,
  cameraEnabled = false,
  videoElementId = 'barcode-scanner-video',
  continuous = true,
  formats = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.QR_CODE
  ]
}: EnhancedBarcodeScannerOptions) {
  
  // Keyboard scanner state
  const [isKeyboardScanning, setIsKeyboardScanning] = useState(false)
  const scanBuffer = useRef('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Camera scanner state
  const [isCameraScanning, setIsCameraScanning] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)
  const scannerControls = useRef<IScannerControls | null>(null)

  // Initialize camera scanner
  useEffect(() => {
    if (!cameraEnabled) return

    codeReader.current = new BrowserMultiFormatReader()
    
    // Set up hints for better performance
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats)
    hints.set(DecodeHintType.TRY_HARDER, true)
    codeReader.current.setHints(hints)

    // Get available video devices
    const getVideoDevices = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        setAvailableDevices(devices)
        
        // Select back camera if available, otherwise use first available
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        )
        setSelectedDeviceId(backCamera?.deviceId || devices[0]?.deviceId || null)
      } catch (error) {
        console.error('Error getting video devices:', error)
        setCameraError('Failed to access camera devices')
        onError?.('Failed to access camera devices')
      }
    }

    getVideoDevices()

    return () => {
      stopCameraScanning()
    }
  }, [cameraEnabled, formats, onError])

  // Keyboard barcode scanner (existing logic)
  useEffect(() => {
    if (!enabled || !keyboardEnabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
      const isBarcodeInput = target.dataset.barcodeInput === 'true'
      
      if (!global && isInputField && !isBarcodeInput) {
        return
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (event.key === 'Enter') {
        if (preventDefault) {
          event.preventDefault()
        }
        
        const scannedCode = scanBuffer.current.trim()
        if (scannedCode.length >= minLength && scannedCode.length <= maxLength) {
          onScan(scannedCode)
          setIsKeyboardScanning(false)
        }
        scanBuffer.current = ''
        return
      }

      if (event.key.length === 1) {
        if (preventDefault && !isInputField) {
          event.preventDefault()
        }
        
        if (scanBuffer.current === '') {
          setIsKeyboardScanning(true)
        }
        
        scanBuffer.current += event.key

        timeoutRef.current = setTimeout(() => {
          scanBuffer.current = ''
          setIsKeyboardScanning(false)
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
  }, [onScan, minLength, maxLength, timeout, preventDefault, enabled, keyboardEnabled, global])

  // Start camera scanning
  const startCameraScanning = useCallback(async () => {
    if (!cameraEnabled || !codeReader.current || !selectedDeviceId) {
      onError?.('Camera scanning not available')
      return
    }

    try {
      setIsCameraScanning(true)
      setIsCameraActive(true)
      setCameraError(null)

      const videoElement = document.getElementById(videoElementId) as HTMLVideoElement
      if (!videoElement) {
        throw new Error(`Video element with id "${videoElementId}" not found`)
      }

      if (continuous) {
        scannerControls.current = await codeReader.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoElement,
          (result, error) => {
            if (result) {
              onScan(result.getText())
            }
            if (error && error.name !== 'NotFoundException') {
              console.error('Camera scan error:', error)
            }
          }
        )
      } else {
        const result = await codeReader.current.decodeOnceFromVideoDevice(
          selectedDeviceId,
          videoElement
        )
        if (result) {
          onScan(result.getText())
        }
        setIsCameraScanning(false)
        setIsCameraActive(false)
      }
    } catch (error) {
      console.error('Error starting camera scanner:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start camera scanner'
      setCameraError(errorMessage)
      onError?.(errorMessage)
      setIsCameraScanning(false)
      setIsCameraActive(false)
    }
  }, [cameraEnabled, selectedDeviceId, videoElementId, continuous, onScan, onError])

  // Stop camera scanning
  const stopCameraScanning = useCallback(() => {
    if (scannerControls.current) {
      scannerControls.current.stop()
      scannerControls.current = null
    }
    setIsCameraScanning(false)
    setIsCameraActive(false)
    setCameraError(null)
  }, [])

  // Switch camera device
  const switchCamera = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId)
    if (isCameraActive) {
      stopCameraScanning()
      // Restart with new device after a short delay
      setTimeout(() => {
        startCameraScanning()
      }, 100)
    }
  }, [isCameraActive, stopCameraScanning, startCameraScanning])

  // Manual trigger for testing
  const triggerScan = useCallback((barcode: string) => {
    onScan(barcode)
  }, [onScan])

  return {
    // Keyboard scanner
    isKeyboardScanning,
    
    // Camera scanner
    isCameraScanning,
    isCameraActive,
    cameraError,
    availableDevices,
    selectedDeviceId,
    
    // Controls
    startCameraScanning,
    stopCameraScanning,
    switchCamera,
    triggerScan,
    
    // Combined state
    isScanning: isKeyboardScanning || isCameraScanning
  }
}