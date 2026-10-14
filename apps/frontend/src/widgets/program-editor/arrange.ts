/** Порядок по списку id; id, которых нет в списке, — в конце как были */
export const arrangeBy = <T extends { id: number }>(items: T[], ids: number[] | undefined): T[] => {
  if (!ids) return items
  const at = new Map(ids.map((id, i) => [id, i]))
  return [...items].sort((a, b) => (at.get(a.id) ?? ids.length) - (at.get(b.id) ?? ids.length))
}
