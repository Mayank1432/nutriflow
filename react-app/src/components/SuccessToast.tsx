type SuccessToastProps = {
  message: string
}

function SuccessToast({ message }: SuccessToastProps) {
  if (!message) return null
  return <div className="success-toast" role="status">{message}</div>
}

export default SuccessToast
