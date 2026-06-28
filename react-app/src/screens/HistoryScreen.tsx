import { useState } from 'react'
import EmptyHistoryState from '../components/EmptyHistoryState'
import HistorySummaryCard from '../components/HistorySummaryCard'
import SavedDayList from '../components/SavedDayList'
import ScreenContainer from '../components/ScreenContainer'
import SelectedHistoryDetail from '../components/SelectedHistoryDetail'
import { mockHistoryPrototype } from '../domain/fixtures'
import { calcHistorySummary } from '../domain/historyMock'
import type { MockHistoryData } from '../domain/types'
import PrototypeNotice from '../components/PrototypeNotice'

function HistoryScreen() {
  const [historyData] = useState<MockHistoryData>(() => structuredClone(mockHistoryPrototype))
  const [selectedHistoryId, setSelectedHistoryId] = useState(
    () => historyData.savedDays[0]?.id ?? '',
  )
  const selectedDay = historyData.savedDays.find((day) => day.id === selectedHistoryId)
  const summary = calcHistorySummary(historyData)

  return (
    <ScreenContainer title="History" subtitle="Review your saved days and track your consistency.">
      <PrototypeNotice>Prototype only — history uses mock saved days. Changes reset on refresh.</PrototypeNotice>
      {historyData.savedDays.length === 0 || !selectedDay ? (
        <EmptyHistoryState />
      ) : (
        <>
          <HistorySummaryCard summary={summary} />
          <div className="history-layout">
            <SavedDayList
              days={historyData.savedDays}
              selectedId={selectedHistoryId}
              onSelect={setSelectedHistoryId}
            />
            <SelectedHistoryDetail day={selectedDay} />
          </div>
        </>
      )}
    </ScreenContainer>
  )
}

export default HistoryScreen
