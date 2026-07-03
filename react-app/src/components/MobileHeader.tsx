type MobileHeaderProps = {
  screenTitle: string
  subtitle?: string
  showDateRow?: boolean
  dateLabel?: string
  onMenuClick?: () => void
}

function MobileHeader({
  screenTitle,
  subtitle,
  showDateRow = false,
  dateLabel,
  onMenuClick,
}: MobileHeaderProps) {
  const openDrawer = useOpenDrawer()
  const titleId = `${screenTitle.toLowerCase().replace(/\s+/g, '-')}-title`

  return (
    <header className="mobile-header">
      <div className="mobile-header-top">
        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick ?? openDrawer}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <div className="mobile-brand">
          <span className="mobile-brand-mark" aria-hidden="true">NF</span>
          <span>NutriFlow</span>
        </div>
      </div>
      <div className="mobile-screen-heading">
        <h1 id={titleId}>{screenTitle}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {showDateRow && dateLabel && (
        <p className="mobile-date-row">
          <span aria-hidden="true">◷</span>
          <span>{dateLabel}</span>
        </p>
      )}
    </header>
  )
}

export default MobileHeader
import { useOpenDrawer } from './DrawerContext'
