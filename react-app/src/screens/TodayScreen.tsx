import MacroStatCard from '../components/MacroStatCard'
import MealPlaceholderCard from '../components/MealPlaceholderCard'
import PlaceholderActionButton from '../components/PlaceholderActionButton'
import ScreenContainer from '../components/ScreenContainer'
import SectionHeader from '../components/SectionHeader'
import SummaryCard from '../components/SummaryCard'

const macros = [
  { label: 'Calories', value: '1,840 kcal', accent: '#ff8b6a' },
  { label: 'Carbs', value: '186 g', accent: '#f1bb42' },
  { label: 'Fat', value: '58 g', accent: '#6da9ff' },
  { label: 'Fibre', value: '24 g', accent: '#8f73de' },
  { label: 'Cost', value: '₹214', accent: '#48b988' },
]

const meals = [
  { label: 'Breakfast', note: '2 placeholder ingredients', color: '#ffd85f' },
  { label: 'Lunch', note: '3 placeholder ingredients', color: '#54c893' },
  { label: 'Dinner', note: 'Nothing planned yet', color: '#ff8d73' },
  { label: 'Snacks', note: '1 placeholder ingredient', color: '#7da7ff' },
]

function TodayScreen() {
  return (
    <ScreenContainer title="Today" subtitle="A friendly snapshot of your day.">
      <SummaryCard label="Protein progress" value="82 / 120 g">
        <div className="progress-track" aria-label="Protein progress: 68 percent">
          <span style={{ width: '68%' }} />
        </div>
        <small>Static prototype values</small>
      </SummaryCard>

      <div className="macro-grid">
        {macros.map((macro) => (
          <MacroStatCard key={macro.label} {...macro} />
        ))}
      </div>

      <SectionHeader title="Meals" detail="4 meals" />
      <div className="meal-list">
        {meals.map((meal) => (
          <MealPlaceholderCard key={meal.label} {...meal} />
        ))}
      </div>

      <div className="quick-add">
        <div>
          <p className="eyebrow">Quick Add preview</p>
          <h3>Add something delicious</h3>
          <p>Search and quantity controls arrive in a later task.</p>
        </div>
        <PlaceholderActionButton label="Quick Add" />
      </div>
    </ScreenContainer>
  )
}

export default TodayScreen
