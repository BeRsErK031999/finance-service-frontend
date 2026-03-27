const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const amountFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type FormattableDate = string | number | Date

export function formatDate(value: FormattableDate) {
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: FormattableDate) {
  return dateTimeFormatter.format(new Date(value))
}

export function formatOptionalDate(
  value: FormattableDate | null | undefined,
  fallback = 'Not set',
) {
  return value ? formatDate(value) : fallback
}

export function formatOptionalDateTime(
  value: FormattableDate | null | undefined,
  fallback = 'Not set',
) {
  return value ? formatDateTime(value) : fallback
}

export function formatAmount(value: number | string) {
  const numericValue = typeof value === 'number' ? value : Number(value)

  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return amountFormatter.format(numericValue)
}
