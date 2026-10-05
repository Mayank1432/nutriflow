import { useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { HELP_SECTIONS, type HelpBlock } from '../domain/appHelp'
import { CURRENT_REACT_SCHEMA_VERSION } from '../storage'

type AppInfoHelpScreenProps = {
  onOpenBackup: () => void
}

const renderBlock = (block: HelpBlock, index: number) => (
  block.kind === 'paragraph'
    ? <p key={index}>{block.text}</p>
    : <ul key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>
)

function AppInfoHelpScreen({ onOpenBackup }: AppInfoHelpScreenProps) {
  const [installed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
  )
  const info: Array<[string, string]> = [
    ['Version', __APP_VERSION__],
    ['Build date', __BUILD_DATE__],
    ['Build', __BUILD_COMMIT__],
    ['Release', import.meta.env.PROD ? 'Production build' : 'Development build'],
    ['Running as', installed ? 'Installed app' : 'Browser tab'],
    ['Data format', `Version ${CURRENT_REACT_SCHEMA_VERSION}`],
    ['Data stored', 'On this device'],
    ['Accounts and cloud sync', 'Not available yet'],
  ]

  return (
    <ScreenContainer title="App Info / Help" subtitle="About NutriFlow and how to use it.">
      <section className="settings-card" aria-labelledby="app-info-title">
        <div className="settings-card-header">
          <div>
            <h3 id="app-info-title">NutriFlow</h3>
            <p>A protein-first nutrition planner that keeps your data on this device.</p>
          </div>
        </div>
        <dl className="help-info-list" aria-label="App information">
          {info.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </section>

      <div className="help-sections">
        {HELP_SECTIONS.map((section) => (
          <details key={section.id} className="help-section">
            <summary>
              <span className="help-section-heading">
                <span className="help-section-title">{section.title}</span>
                <span className="help-section-summary">{section.summary}</span>
              </span>
            </summary>
            <div className="help-section-body">
              {section.blocks.map(renderBlock)}
            </div>
          </details>
        ))}
      </div>

      <section className="settings-card" aria-labelledby="help-more-title">
        <div className="settings-card-header">
          <div>
            <h3 id="help-more-title">More</h3>
            <p>Keep a safe copy of your data, or open the original NutriFlow app.</p>
          </div>
        </div>
        <div className="help-footer">
          <button className="secondary-action" type="button" onClick={onOpenBackup}>Open Backup &amp; Restore</button>
          <a href={`${import.meta.env.BASE_URL}classic/`}>Open the original NutriFlow app</a>
        </div>
      </section>
    </ScreenContainer>
  )
}

export default AppInfoHelpScreen