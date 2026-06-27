import { useState } from 'react'
import MealPlaceholderCard from '../components/MealPlaceholderCard'
import ScreenContainer from '../components/ScreenContainer'
import SectionHeader from '../components/SectionHeader'
import SummaryCard from '../components/SummaryCard'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function WeeklyScreen() {
  const [selectedDay, setSelectedDay] = useState('Mon')

  return (
    <ScreenContainer title="Weekly" subtitle="Shape the week one day at a time.">
      <SummaryCard label="Week at a glance" value="5 days sketched">
        <p className="summary-copy">
          Placeholder totals will become real after storage and calculations are ported.
        </p>
      </SummaryCard>

      <div className="day-chips" aria-label="Select day">
        {days.map((day) => (
          <button
            className={day === selectedDay ? 'selected' : ''}
            type="button"
            key={day}
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      <SectionHeader title={`${selectedDay}'s meal plan`} detail="Local prototype state" />
      <div className="meal-list">
        <MealPlaceholderCard label="Breakfast" note="Oats, milk, and fruit placeholder" color="#ffd85f" />
        <MealPlaceholderCard label="Lunch" note="Protein bowl placeholder" color="#54c893" />
        <MealPlaceholderCard label="Dinner" note="Plan this meal later" color="#ff8d73" />
      </div>
    </ScreenContainer>
  )
}

export default WeeklyScreen
