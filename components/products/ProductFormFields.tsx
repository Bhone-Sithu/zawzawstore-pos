import { Shuffle, FileText } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { BarcodeInput } from '@/components/ui/barcode-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import type { Category } from '@/types/database.types'
import type { ProductFormSchema } from '@/schemas/product.schema'

interface ProductFormFieldsProps {
  form: UseFormReturn<ProductFormSchema>
  categories: Category[]
  onGenerateBarcode: () => void
}

export default function ProductFormFields({
  form,
  categories,
  onGenerateBarcode
}: ProductFormFieldsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
          <FileText className="h-4 w-4 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">General Information</h3>
      </div>

      <div className="space-y-6">
        {/* Product Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>English Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter English Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name_mm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Myanmar Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="မြန်မာ အမည်"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50 max-h-60 overflow-auto">
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id} className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">
                      {category.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
            )}
          />

        {/* Supplier Price */}
        <FormField
          control={form.control}
          name="supplier_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Price (RM)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter supplier price (e.g., 8.50)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  {...field}
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value === '' ? 0 : Number(value) || 0)
                  }}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-gray-500">Optional: The price you pay to your supplier for this product</p>
            </FormItem>
          )}
        />

        {/* Base Price */}
        <FormField
          control={form.control}
          name="base_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Price (RM) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter price (e.g., 10.50)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  {...field}
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value === '' ? 0 : Number(value) || 0)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Barcode */}
        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barcode *</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <BarcodeInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Scan or type barcode..."
                    className="flex-1"
                    onScan={(barcode) => {
                      field.onChange(barcode)
                    }}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={onGenerateBarcode}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 cursor-pointer"
                >
                  <Shuffle className="h-4 w-4" />
                  Generate
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>
    </div>
  )
}