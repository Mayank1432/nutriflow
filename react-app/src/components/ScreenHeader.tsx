type ScreenHeaderProps = {
  title: string
  subtitle: string
}

function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const titleId = `${title.toLowerCase().replace(/\s+/g, '-')}-title`

  return (
    <header className="screen-header">
      <p className="eyebrow">Prototype view</p>
      <h2 id={titleId}>{title}</h2>
      <p>{subtitle}</p>
    </header>
  )
}

export default ScreenHeader
