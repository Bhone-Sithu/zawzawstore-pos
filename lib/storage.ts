import { supabase } from './supabase'

export interface UploadResult {
  url: string | null
  error: string | null
}

export async function uploadImage(file: File, folder: string = 'products'): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { url: null, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    return { url: urlData.publicUrl, error: null }
  } catch {
    return { url: null, error: 'Failed to upload image' }
  }
}

export async function deleteImage(url: string): Promise<{ error: string | null }> {
  try {
    // Extract path from URL
    const path = url.split('/').slice(-2).join('/')
    
    const { error } = await supabase.storage
      .from('product-images')
      .remove([path])

    return { error: error?.message || null }
  } catch {
    return { error: 'Failed to delete image' }
  }
}

export function validateImageFile(file: File): string | null {
  const maxSize = 20 * 1024 * 1024 // 20MB (before compression)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)'
  }

  if (file.size > maxSize) {
    return 'Image size must be less than 20MB'
  }

  return null
}

// Upload image during form submission
export async function uploadImageFile(file: File, folder: string = 'products'): Promise<UploadResult> {
  try {
    const validationError = validateImageFile(file)
    if (validationError) {
      return { url: null, error: validationError }
    }

    return await uploadImage(file, folder)
  } catch {
    return { url: null, error: 'Failed to upload image' }
  }
}