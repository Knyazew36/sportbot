/** Буква комплекса по месту в очереди: A, B, C… */
export const complexLetter = (index: number): string => String.fromCharCode(65 + (index % 26))

/** План подходов: «3 × 8–12» или «3 × 10» */
export const planText = (sets: number, repsMin: number, repsMax: number): string =>
  `${sets} × ${repsMin === repsMax ? repsMin : `${repsMin}–${repsMax}`}`
