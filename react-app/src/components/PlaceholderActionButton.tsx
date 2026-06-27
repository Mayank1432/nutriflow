type PlaceholderActionButtonProps = {
  label: string
}

function PlaceholderActionButton({ label }: PlaceholderActionButtonProps) {
  return (
    <button className="primary-action" type="button">
      <span aria-hidden="true">+</span>
      {label}
    </button>
  )
}

export default PlaceholderActionButton
