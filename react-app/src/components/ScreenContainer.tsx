import type { ReactNode } from 'react'

type ScreenContainerProps = {
  children: ReactNode
  title: string
  subtitle: string
}

function ScreenContainer({ children, title, subtitle }: ScreenContainerProps) {
  return (
    <section className="screen" aria-labelledby={`${title.toLowerCase()}-title`}>
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Prototype view</p>
          <h2 id={`${title.toLowerCase()}-title`}>{title}</h2>
        </div>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

export default ScreenContainer
