import AnimateShowcase from './ui/AnimateShowcase'
import ShadcnShowcase from './ui/ShadcnShowcase'

// Витрина всех UI-компонентов шаблона: быстро проверить вид и скопировать пример использования
const UiPage = () => {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-20 px-4 py-20">
      <header className="flex flex-col gap-6">
        <span className="mono-label text-slate">src/shared/ui/shadcn</span>
        <h1 className="display-heading text-heading-lg md:text-display lg:text-display-xl">UI-кит</h1>
        <p className="max-w-[640px] text-subheading text-slate">Все компоненты шаблона в одном месте</p>
      </header>

      <section className="flex flex-col gap-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="display-heading text-heading-lg md:text-display">shadcn/ui</h2>
          <span className="mono-label text-slate">01</span>
        </div>
        <ShadcnShowcase />
      </section>

      <section className="flex flex-col gap-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="display-heading text-heading-lg md:text-display">Animate UI</h2>
          <span className="mono-label text-slate">02</span>
        </div>
        <AnimateShowcase />
      </section>
    </div>
  )
}

export default UiPage
