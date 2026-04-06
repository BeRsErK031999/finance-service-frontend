export const ACCEPTED_FILE_TYPES =
  '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx'

export const UPLOAD_REQUIREMENTS_HINT =
  'Можно загрузить PDF, PNG, JPG, DOC, DOCX, XLS или XLSX размером до 20 МБ.'

export function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} Б`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} КБ`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} МБ`
}

export function mergeUniqueFiles(currentFiles: File[], nextFiles: File[]) {
  const filesBySignature = new Map(
    currentFiles.map((file) => [toFileSignature(file), file] as const),
  )

  nextFiles.forEach((file) => {
    filesBySignature.set(toFileSignature(file), file)
  })

  return [...filesBySignature.values()]
}

export function toFileSignature(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}
