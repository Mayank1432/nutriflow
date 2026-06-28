type PrototypeNoticeProps = {
  children: string
}

function PrototypeNotice({ children }: PrototypeNoticeProps) {
  return (
    <p className="prototype-notice" role="note">
      <span aria-hidden="true">i</span>
      {children}
    </p>
  )
}

export default PrototypeNotice
