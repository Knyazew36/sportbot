import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/shared/lib/utils"

// Российский формат: 8 и 7 в начале считаем кодом страны, остальное — 10 цифр номера
export function formatPhone(raw: string) {
  let digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  if (digits[0] === "8" || digits[0] === "7") digits = digits.slice(1)
  digits = digits.slice(0, 10)

  let result = "+7"
  if (digits.length > 0) result += ` (${digits.slice(0, 3)}`
  if (digits.length >= 3) result += ")"
  if (digits.length > 3) result += ` ${digits.slice(3, 6)}`
  if (digits.length > 6) result += `-${digits.slice(6, 8)}`
  if (digits.length > 8) result += `-${digits.slice(8, 10)}`
  return result
}

function Input({ className, type, onChange, value, defaultValue, ...props }: React.ComponentProps<"input">) {
  const isPhone = type === "tel"

  // Маска применяется до onChange: и управляемое, и неуправляемое поле получают уже отформатированное значение
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isPhone) {
      const input = event.currentTarget
      const isDeleting = (event.nativeEvent as InputEvent).inputType?.startsWith("delete")
      // При стирании не дописываем скобку/дефис обратно, иначе символ-разделитель невозможно удалить
      if (!isDeleting) input.value = formatPhone(input.value)
    }
    onChange?.(event)
  }

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      inputMode={isPhone ? "tel" : props.inputMode}
      autoComplete={isPhone ? "tel" : props.autoComplete}
      placeholder={isPhone ? (props.placeholder ?? "+7 (___) ___-__-__") : props.placeholder}
      maxLength={isPhone ? 18 : props.maxLength}
      value={value}
      defaultValue={isPhone && typeof defaultValue === "string" ? formatPhone(defaultValue) : defaultValue}
      onChange={handleChange}
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-transparent bg-input px-4 py-1 text-base text-foreground transition-[color,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-smoke focus-visible:border-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        isPhone && "tabular-nums",
        className
      )}
      {...props}
    />
  )
}

export { Input }
