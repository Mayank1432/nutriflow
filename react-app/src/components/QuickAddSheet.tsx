import { useEffect } from 'react'
import QuickAddForm, { type QuickAddDraft } from './QuickAddForm'

type QuickAddSheetProps = {
  draft: QuickAddDraft
  onChange: (draft: QuickAddDraft) => void
  onClose: () => void
  onSubmit: () => void
}

function QuickAddSheet({ draft, onChange, onClose, onSubmit }: QuickAddSheetProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        className="quick-add-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <div>
            <p className="eyebrow">Mock entry</p>
            <h2 id="quick-add-title">Quick Add</h2>
          </div>
          <button className="sheet-close" type="button" onClick={onClose} aria-label="Close Quick Add">
            ×
          </button>
        </div>
        <QuickAddForm draft={draft} onChange={onChange} onSubmit={onSubmit} />
      </section>
    </div>
  )
}

export default QuickAddSheet
