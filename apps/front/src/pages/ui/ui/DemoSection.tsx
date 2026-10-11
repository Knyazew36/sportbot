import type { ReactNode } from 'react'

type DemoSectionProps = {
  title: string
  path: string
  children: ReactNode
}

// Обёртка для витрины: название компонента + путь, откуда его импортировать
const DemoSection = ({ title, path, children }: DemoSectionProps) => {
  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-6">
      <div className="flex flex-col gap-1">
        <h3 className="section-heading text-heading-sm">{title}</h3>
        <code className="mono-label text-slate">{path}</code>
      </div>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  )
}

export default DemoSection
