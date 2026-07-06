import { useEffect } from 'react'

type SuccessToastProps = {
  message: string
  onDismiss?: () => void
}

function SuccessToast({ message, onDismiss }: SuccessToastProps) {
  useEffect(() => {
    if (!message || !onDismiss) return
    const timeout = window.setTimeout(onDismiss, 2600)
    return () => window.clearTimeout(timeout)
  }, [message, onDismiss])

  if (!message) return null
  return <div className="success-toast" role="status">{message}</div>
}

export default SuccessToast
