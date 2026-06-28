import type { ReactNode } from 'react'
import ScreenHeader from './ScreenHeader'

type ScreenContainerProps = {
  children: ReactNode
  title: string
  subtitle: string
}

function ScreenContainer({ children, title, subtitle }: ScreenContainerProps) {
  return (
    <section className="screen" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
      <ScreenHeader title={title} subtitle={subtitle} />
      {children}
    </section>
  )
}

export default ScreenContainer
