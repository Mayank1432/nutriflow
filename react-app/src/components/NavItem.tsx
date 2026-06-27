type NavItemProps = {
  active: boolean
  icon: string
  label: string
  onSelect: () => void
}

function NavItem({ active, icon, label, onSelect }: NavItemProps) {
  return (
    <button
      className={`nav-item${active ? ' active' : ''}`}
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
    >
      <span className="nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  )
}

export default NavItem
