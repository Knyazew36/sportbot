/** Три точки «печатает…», как в мессенджерах. */
export const TypingDots = () => (
  <span
    className='scw:inline-flex scw:items-center scw:gap-0.75'
    aria-hidden
  >
    {[0, 1, 2].map(index => (
      <span
        key={index}
        className='scw:size-1.5 scw:animate-typing scw:rounded-full scw:bg-muted'
        style={{ animationDelay: `${index * 0.16}s` }}
      />
    ))}
  </span>
)
