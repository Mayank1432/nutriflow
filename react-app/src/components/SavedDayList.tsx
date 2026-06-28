import type { MockSavedDay } from '../domain/types'
import SavedDayCard from './SavedDayCard'

type SavedDayListProps = {
  days: MockSavedDay[]
  selectedId: string
  onSelect: (dayId: string) => void
}

function SavedDayList({ days, selectedId, onSelect }: SavedDayListProps) {
  return (
    <section className="saved-day-list" aria-labelledby="saved-days-title">
      <div className="history-section-heading">
        <h3 id="saved-days-title">Saved days</h3>
        <span>Newest first</span>
      </div>
      <div className="saved-day-cards">
        {days.map((day) => (
          <SavedDayCard
            key={day.id}
            day={day}
            active={day.id === selectedId}
            onSelect={() => onSelect(day.id)}
          />
        ))}
      </div>
    </section>
  )
}

export default SavedDayList
