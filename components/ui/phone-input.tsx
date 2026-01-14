'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  showCountryCode?: boolean
}

// Format phone number with spaces for Malaysian numbers
// Input: "0125128508" or "125128508" or "60125128508"
// Output display: "12 512 8508" (without country code prefix in the input)
function formatPhoneDisplay(phone: string): string {
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '')

  // Remove country code if present
  if (digits.startsWith('60')) {
    digits = digits.slice(2)
  }
  // Remove leading 0 if present
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  // Format based on length
  // Malaysian mobile: 1X XXX XXXX (9 digits after removing 0)
  // Or: 1X XXXX XXXX (10 digits)
  if (digits.length === 0) return ''

  let formatted = ''

  if (digits.length <= 2) {
    formatted = digits
  } else if (digits.length <= 5) {
    formatted = `${digits.slice(0, 2)} ${digits.slice(2)}`
  } else if (digits.length <= 9) {
    formatted = `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  } else {
    // 10+ digits: XX XXXX XXXX
    formatted = `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`
  }

  return formatted
}

// Get raw digits from formatted or unformatted input
function getRawDigits(phone: string): string {
  let digits = phone.replace(/\D/g, '')

  // Remove country code if present
  if (digits.startsWith('60')) {
    digits = digits.slice(2)
  }
  // Remove leading 0 if present
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  return digits
}

// Convert to storage format (with leading 0)
function toStorageFormat(digits: string): string {
  if (!digits) return ''
  // Add leading 0 for storage (Malaysian format)
  return digits.startsWith('0') ? digits : `0${digits}`
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, showCountryCode = true, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    // Update display value when prop value changes
    React.useEffect(() => {
      setDisplayValue(formatPhoneDisplay(value || ''))
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value

      // Only allow digits and spaces
      const cleaned = input.replace(/[^\d\s]/g, '')

      // Get raw digits (max 10 for Malaysian mobile)
      const rawDigits = cleaned.replace(/\s/g, '').slice(0, 10)

      // Format for display
      const formatted = formatPhoneDisplay(rawDigits)
      setDisplayValue(formatted)

      // Return storage format (with leading 0)
      onChange(toStorageFormat(rawDigits))
    }

    return (
      <div className={cn(
        'flex items-center h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}>
        {showCountryCode && (
          <div className="flex items-center gap-1.5 pl-3 pr-2 border-r border-input text-muted-foreground select-none">
            <span className="text-base">🇲🇾</span>
            <span className="text-sm font-medium">+60</span>
          </div>
        )}
        <input
          type="tel"
          inputMode="numeric"
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'flex-1 h-full px-3 bg-transparent outline-none',
            'placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed'
          )}
          placeholder="12 345 6789"
          {...props}
        />
      </div>
    )
  }
)
PhoneInput.displayName = 'PhoneInput'

export { PhoneInput, formatPhoneDisplay, getRawDigits, toStorageFormat }
