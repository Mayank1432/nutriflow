import type { ProteinTrendPoint } from './analyticsCharts'

export type TodayProteinPreviewGeometry = {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
  baselineGap?: number
}

export type TodayProteinPreviewPlotPoint = ProteinTrendPoint & { x: number; y: number }

export type TodayProteinPreviewPlot = {
  domain: readonly [number, number]
  points: TodayProteinPreviewPlotPoint[]
  plotTop: number
  plotBottom: number
  baselineY: number
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

export const buildTodayProteinPreviewDomain = (
  proteinValues: readonly number[],
): readonly [number, number] => {
  const validValues = proteinValues.filter((value) => Number.isFinite(value) && value >= 0)
  const highestValidProtein = validValues.length ? Math.max(...validValues) : 0
  const roundedUpper = Math.ceil(highestValidProtein * 11 / 100) * 10
  return [0, Math.max(150, roundedUpper)]
}

export const buildTodayProteinPreviewPlot = (
  points: readonly ProteinTrendPoint[],
  geometry: Readonly<TodayProteinPreviewGeometry>,
): TodayProteinPreviewPlot => {
  const validPoints = points.filter((point) => Number.isFinite(point.proteinGrams) && point.proteinGrams >= 0 && Number.isFinite(point.dayIndex) && point.dayIndex >= 0 && point.dayIndex <= 6)
  const domain = buildTodayProteinPreviewDomain(validPoints.map((point) => point.proteinGrams))
  const [domainLower, domainUpper] = domain
  const baselineY = geometry.height - geometry.bottom
  const plotTop = geometry.top
  const plotBottom = baselineY - (geometry.baselineGap ?? 0)
  const plotHeight = Math.max(0, plotBottom - plotTop)
  const usableWidth = Math.max(0, geometry.width - geometry.left - geometry.right)
  const span = domainUpper - domainLower
  const plotted = validPoints.map((point) => {
    const normalized = span > 0 ? (point.proteinGrams - domainLower) / span : 0
    return { ...point, x: geometry.left + (point.dayIndex / 6) * usableWidth, y: plotBottom - clamp(normalized, 0, 1) * plotHeight }
  })
  return { domain, points: plotted, plotTop, plotBottom, baselineY }
}
