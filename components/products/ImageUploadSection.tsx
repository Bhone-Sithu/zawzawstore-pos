import { Upload, Image as ImageIcon } from 'lucide-react'

export default function ImageUploadSection() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
          <ImageIcon className="h-4 w-4 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Upload Images</h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Product Images (Up to 6 images)
        </p>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Upload main image</p>
              <p className="text-xs text-gray-500 mt-1">Drag & drop or click to browse</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>• Supported formats: JPG, PNG, GIF</p>
          <p>• Maximum file size: 10MB</p>
          <p>• Recommended size: 800x800px</p>
        </div>
      </div>
    </div>
  )
}