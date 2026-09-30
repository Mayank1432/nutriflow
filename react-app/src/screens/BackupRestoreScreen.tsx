import { useRef, useState, type ChangeEvent } from 'react'
import DeleteDayConfirm from '../components/DeleteDayConfirm'
import ScreenContainer from '../components/ScreenContainer'
import {
  applyReactBackup,
  createReactBackup,
  parseReactBackup,
  summarizeReactBackup,
  type ReactBackup,
  type ReactBackupSummary,
} from '../storage'

const MAX_BACKUP_BYTES = 10 * 1024 * 1024

type Feedback = { type: 'success' | 'error'; text: string } | null
type PendingImport = { backup: ReactBackup; fileName: string; summary: ReactBackupSummary }

type BackupRestoreScreenProps = {
  onBack: () => void
}

const formatExportedAt = (value: string): string => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

function BackupRestoreScreen({ onBack }: BackupRestoreScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [restored, setRestored] = useState(false)

  const handleExport = () => {
    try {
      const backup = createReactBackup()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nutriflow-backup-${backup.exportedAt.slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setFeedback({ type: 'success', text: 'Backup downloaded. Keep the file somewhere safe.' })
    } catch {
      setFeedback({ type: 'error', text: 'The backup could not be created. Try again.' })
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setFeedback(null)
    setPending(null)
    if (file.size > MAX_BACKUP_BYTES) {
      setFeedback({ type: 'error', text: 'This file is too large to be a NutriFlow backup.' })
      return
    }
    let text: string
    try {
      text = await file.text()
    } catch {
      setFeedback({ type: 'error', text: 'The file could not be read. Try again.' })
      return
    }
    const result = parseReactBackup(text)
    if (!result.ok) {
      setFeedback({ type: 'error', text: result.message })
      return
    }
    setPending({ backup: result.backup, fileName: file.name, summary: summarizeReactBackup(result.backup) })
  }

  const confirmImport = () => {
    if (!pending) return
    if (!applyReactBackup(pending.backup)) {
      setConfirmError('The backup could not be restored. Your current data was not changed.')
      return
    }
    setConfirmOpen(false)
    setConfirmError('')
    setPending(null)
    setRestored(true)
    window.setTimeout(() => window.location.reload(), 900)
  }

  return (
    <div className="settings-screen">
      <ScreenContainer title="Backup & Restore" subtitle="Save your NutriFlow data to a file, or restore it from a backup.">
        <button className="secondary-action settings-back-action" type="button" onClick={onBack}>← Back to More</button>

        {restored ? (
          <section className="settings-card" aria-live="polite">
            <div className="settings-card-header">
              <div>
                <h3>Backup restored</h3>
                <p>Your data has been replaced. NutriFlow is reloading…</p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="settings-card" aria-labelledby="backup-export-title">
              <div className="settings-card-header">
                <div>
                  <h3 id="backup-export-title">Export backup</h3>
                  <p>Download all your NutriFlow data as one file. Your data stays on this device unless you save the file elsewhere.</p>
                </div>
              </div>
              <div className="backup-actions">
                <button className="primary-action" type="button" onClick={handleExport}>Download backup</button>
              </div>
            </section>

            <section className="settings-card" aria-labelledby="backup-import-title">
              <div className="settings-card-header">
                <div>
                  <h3 id="backup-import-title">Restore from backup</h3>
                  <p>Choose a NutriFlow backup file. You will see what it contains before anything changes.</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={handleFileChange}
              />
              <div className="backup-actions">
                <button className="secondary-action" type="button" onClick={() => fileInputRef.current?.click()}>
                  {pending ? 'Choose a different file' : 'Choose backup file'}
                </button>
              </div>
              {pending && (
                <>
                  <p className="backup-file-note">Selected file: {pending.fileName}</p>
                  <dl className="backup-summary" aria-label="Backup contents">
                    <div><dt>Backup created</dt><dd>{formatExportedAt(pending.summary.exportedAt)}</dd></div>
                    <div><dt>Saved days</dt><dd>{pending.summary.savedDays}</dd></div>
                    <div><dt>Recently deleted days</dt><dd>{pending.summary.deletedDays}</dd></div>
                    <div><dt>Ingredients</dt><dd>{pending.summary.ingredients}</dd></div>
                    <div><dt>Daily Staples</dt><dd>{pending.summary.staples}</dd></div>
                    <div><dt>Pantry items</dt><dd>{pending.summary.pantryItems}</dd></div>
                    <div><dt>Shopping items</dt><dd>{pending.summary.shoppingItems}</dd></div>
                  </dl>
                  <div className="backup-actions">
                    <button
                      className="danger-action"
                      type="button"
                      onClick={() => { setConfirmError(''); setConfirmOpen(true) }}
                    >
                      Restore this backup
                    </button>
                  </div>
                </>
              )}
            </section>

            {feedback && (
              <p
                className={`settings-feedback ${feedback.type}`}
                role={feedback.type === 'success' ? 'status' : 'alert'}
                aria-live={feedback.type === 'success' ? 'polite' : undefined}
              >
                {feedback.text}
              </p>
            )}
          </>
        )}
      </ScreenContainer>
      {confirmOpen && pending && (
        <DeleteDayConfirm
          title="Replace all current data?"
          body={`This replaces everything in NutriFlow on this device with the contents of "${pending.fileName}". Export a backup first if you want to keep your current data. This cannot be undone.`}
          confirmLabel="Replace My Data"
          pendingLabel="Restoring…"
          submitting={false}
          error={confirmError}
          onCancel={() => { setConfirmOpen(false); setConfirmError('') }}
          onConfirm={confirmImport}
        />
      )}
    </div>
  )
}

export default BackupRestoreScreen