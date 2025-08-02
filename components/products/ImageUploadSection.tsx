'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { validateImageFile } from '@/lib/storage'
import { compressImage } from '@/lib/utils'

interface ImageUploadSectionProps {
  file?: File | null
  existingImage?: string
  onChange: (file: File | null) => void
  disabled?: boolean
}

export default function ImageUploadSection({ 
  file, 
  existingImage,
  onChange, 
  disabled = false 
}: ImageUploadSectionProps) {
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number
    compressedSize: number
    savings: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    setError(null)
    setCompressing(true)
    
    const validationError = validateImageFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setCompressing(false)
      return
    }

    try {
      // Compress image aggressively for POS system
      const compressedFile = await compressImage(selectedFile, 400, 0.3)
      
      // Create preview URL
      const url = URL.createObjectURL(compressedFile)
      setPreviewUrl(url)
      onChange(compressedFile)
      
      // Calculate compression savings
      const originalSize = selectedFile.size
      const compressedSize = compressedFile.size
      const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100)
      
      setCompressionInfo({
        originalSize,
        compressedSize,
        savings
      })
      
    } catch {
      setError('Failed to compress image')
    } finally {
      setCompressing(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || compressing) return

    const selectedFile = e.dataTransfer.files?.[0]
    if (selectedFile) {
      await handleFileSelect(selectedFile)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setCompressionInfo(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Helper function to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Determine what image to show and component state
  const displayImage = previewUrl || existingImage
  const hasImage = file || existingImage
  const isLoading = compressing

  // Cleanup preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
          <ImageIcon className="h-4 w-4 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Product Image</h3>
      </div>

      <div className="space-y-4">
        {hasImage ? (
          <div className="space-y-3">
            <Image
              src={displayImage || '/placeholder-image.png'}
              alt="Product image"
              width={128}
              height={128}
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              unoptimized
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => !disabled && !isLoading && fileInputRef.current?.click()}
                disabled={disabled || isLoading}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isLoading}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
            {file && compressionInfo && (
              <div className="space-y-1">
                <p className="text-xs text-blue-600">
                  Image compressed and ready (will upload when form is saved)
                </p>
                <div className="text-xs bg-green-50 border border-green-200 rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600">Original:</span>
                    <span className="font-medium">{formatFileSize(compressionInfo.originalSize)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600">Compressed:</span>
                    <span className="font-medium text-blue-600">{formatFileSize(compressionInfo.compressedSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Savings:</span>
                    <span className="font-bold text-green-600">{compressionInfo.savings}%</span>
                  </div>
                </div>
              </div>
            )}
            {isLoading && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Compressing image...
              </p>
            )}
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive 
                ? 'border-orange-400 bg-orange-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !disabled && !isLoading && fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {isLoading ? 'Compressing image...' : 'Select product image'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isLoading ? 'Please wait...' : 'Drag & drop or click to browse'}
                </p>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isLoading}
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>• Supported formats: JPG, PNG, WebP, GIF</p>
          <p>• Maximum file size: 20MB (will be compressed)</p>
          <p>• Images resized to 400px and compressed for storage efficiency</p>
        </div>
      </div>
    </div>
  )
}