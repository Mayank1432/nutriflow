import type { ReactNode } from 'react'
import MobileHeader from './MobileHeader'

type ScreenContainerProps = {
  children: ReactNode
  title: string
  subtitle: string
  showDateRow?: boolean
  dateLabel?: string
}

function ScreenContainer({
  children,
  title,
  subtitle,
  showDateRow,
  dateLabel,
}: ScreenContainerProps) {
  return (
    <section className="screen" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
      <MobileHeader
        screenTitle={title}
        subtitle={subtitle}
        showDateRow={showDateRow}
        dateLabel={dateLabel}
      />
      {children}
    </section>
  )
}

export default ScreenContainer
