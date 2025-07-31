import { Shuffle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Category } from '@/types/database.types'
import type { ProductFormData, ProductFormErrors } from '@/types/product.types'

interface ProductFormFieldsProps {
  formData: ProductFormData
  errors: ProductFormErrors
  categories: Category[]
  onUpdateField: (field: keyof ProductFormData, value: string | number) => void
  onGenerateBarcode: () => void
}

export default function ProductFormFields({
  formData,
  errors,
  categories,
  onUpdateField,
  onGenerateBarcode
}: ProductFormFieldsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-600 text-sm">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">General Information</h3>
      </div>

      <div className="space-y-6">
        {/* Product Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name_en" className="block text-sm font-medium text-gray-700 mb-2">
              English Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_en"
              type="text"
              value={formData.name_en}
              onChange={(e) => onUpdateField('name_en', e.target.value)}
              placeholder="Enter English Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {errors.name_en && (
              <p className="mt-1 text-sm text-red-600">{errors.name_en}</p>
            )}
          </div>

          <div>
            <Label htmlFor="name_mm" className="block text-sm font-medium text-gray-700 mb-2">
              Myanmar Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name_mm"
              type="text"
              value={formData.name_mm}
              onChange={(e) => onUpdateField('name_mm', e.target.value)}
              placeholder="မြန်မာ အမည်"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {errors.name_mm && (
              <p className="mt-1 text-sm text-red-600">{errors.name_mm}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </Label>
          <Select 
            value={formData.category_id} 
            onValueChange={(value) => onUpdateField('category_id', value)}
          >
            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Base Price */}
        <div>
          <Label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-2">
            Base Price (RM) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.base_price}
            onChange={(e) => onUpdateField('base_price', Number(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          {errors.base_price && (
            <p className="mt-1 text-sm text-red-600">{errors.base_price}</p>
          )}
        </div>

        {/* Barcode */}
        <div>
          <Label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
            Barcode <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="barcode"
              type="text"
              value={formData.barcode}
              onChange={(e) => onUpdateField('barcode', e.target.value)}
              placeholder="Enter or generate barcode"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              type="button"
              onClick={onGenerateBarcode}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Generate
            </button>
          </div>
          {errors.barcode && (
            <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>
          )}
        </div>

        {/* Expiry Date */}
        <div>
          <Label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date
          </Label>
          <Input
            id="expiry_date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => onUpdateField('expiry_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>
    </div>
  )
}