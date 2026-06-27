type SectionHeaderProps = {
  title: string
  detail?: string
}

function SectionHeader({ title, detail }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <h3>{title}</h3>
      {detail && <span>{detail}</span>}
    </div>
  )
}

export default SectionHeader
