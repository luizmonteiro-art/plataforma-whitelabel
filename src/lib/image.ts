/**
 * Redimensiona uma imagem no navegador antes do upload.
 *
 * O Supabase Free tem só 1GB de storage; fotos de câmera/celular sem
 * redimensionar enchem isso rápido com poucas lojas cadastrando catálogo.
 * Mantém o formato original (preserva transparência de PNG/logo).
 */
const MAX_DIMENSION = 1600

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)

    const quality = file.type === 'image/png' ? undefined : 0.82
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, file.type, quality))
    if (!blob || blob.size >= file.size) return file

    return new File([blob], file.name, { type: file.type })
  } catch {
    return file
  }
}
