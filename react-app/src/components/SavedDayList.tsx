import type { MockSavedDay } from '../domain/types'
import SavedDayCard from './SavedDayCard'

type SavedDayListProps = {
  days: MockSavedDay[]
  onSelect: (dayId: string) => void
}

function SavedDayList({ days, onSelect }: SavedDayListProps) {
  return (
    <section className="saved-day-list" aria-labelledby="saved-days-title">
      <div className="history-section-heading">
        <h2 id="saved-days-title">Saved days</h2>
        <span>Newest first</span>
      </div>
      <ul className="saved-day-cards">
        {days.map((day) => (
          <li key={day.id}><SavedDayCard day={day} onSelect={() => onSelect(day.id)} /></li>
        ))}
      </ul>
    </section>
  )
}

export default SavedDayList
