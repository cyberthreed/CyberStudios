export const TERMS_VERSION = '2026-11-19-v1'

export function canRegister(value, now = new Date()) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false
  const today = (now.getUTCMonth() + 1) * 100 + now.getUTCDate()
  const years = now.getUTCFullYear() - year - (today < month * 100 + day ? 1 : 0)
  return years >= 13 && years <= 125
}
