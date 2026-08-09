import type { ProteinTrendPoint } from './analyticsCharts'
import { buildTodayProteinPreviewDomain, buildTodayProteinPreviewPlot, type TodayProteinPreviewGeometry } from './todayProteinPreview'

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message) }
const geometry: TodayProteinPreviewGeometry = { width: 320, height: 112, left: 18, right: 18, top: 16, bottom: 24, baselineGap: 2 }
const point = (id: string, dayIndex: number, proteinGrams: number): ProteinTrendPoint => ({ id, date: `2026-01-0${dayIndex + 1}`, dayIndex, dateLabel: `Day ${dayIndex + 1}`, shortDateLabel: `D${dayIndex + 1}`, proteinGrams })
const plot = (values: number[]) => buildTodayProteinPreviewPlot(values.map((value, index) => point(String(index), index * 6 / Math.max(1, values.length - 1), value)), geometry)
const movement = (values: number[]) => { const plotted = plot(values).points; return Math.abs(plotted.at(-1)!.y - plotted[0].y) }

assert(buildTodayProteinPreviewDomain([121]).join(',') === '0,150', '121g uses zero to 150g domain')
assert(buildTodayProteinPreviewDomain([125]).join(',') === '0,150', '125g uses zero to 150g domain')
assert(buildTodayProteinPreviewDomain([130]).join(',') === '0,150', '130g uses zero to 150g domain')
assert(buildTodayProteinPreviewDomain([136]).join(',') === '0,150', '136g remains at the 150g threshold')
assert(buildTodayProteinPreviewDomain([137]).join(',') === '0,160', '137g advances to the 160g threshold')
assert(buildTodayProteinPreviewDomain([145]).join(',') === '0,160', '145g remains at the 160g threshold')
assert(buildTodayProteinPreviewDomain([146]).join(',') === '0,170', '146g advances to the 170g threshold')
assert(buildTodayProteinPreviewDomain([200]).join(',') === '0,220', '200g uses zero to 220g domain')

for (const values of [[0], [121], [125], [130], [136], [137], [145], [146], [200], [60, 120], [120, 121, 130]]) {
  const beforeValues = [...values]
  const domain = buildTodayProteinPreviewDomain(values)
  assert(Number.isFinite(domain[0]) && Number.isFinite(domain[1]), 'Today domain bounds are finite')
  assert(domain[0] === 0 && domain[1] > domain[0], 'Today domain starts at zero and has positive height')
  assert(values.every((value) => value >= domain[0] && value <= domain[1]), 'every valid input remains inside its Today domain')
  assert(JSON.stringify(values) === JSON.stringify(beforeValues), 'Today domain input array is not mutated')
}

for (const values of [[136, 137], [145, 146], [120, 121], [120, 125], [120, 130]]) {
  const orderedPlot = plot(values)
  assert(orderedPlot.points[1].proteinGrams > orderedPlot.points[0].proteinGrams && orderedPlot.points[1].y <= orderedPlot.points[0].y, 'higher Protein maps at or above lower Protein across domain thresholds')
}

const almostFlat = plot([120, 121]); const small = plot([120, 125]); const moderate = plot([120, 130]); const large = plot([120, 60])
for (const [name, result] of [['almost flat', almostFlat], ['small', small], ['moderate', moderate], ['large', large]] as const) assert(result.points.every((item) => Number.isFinite(item.x) && Number.isFinite(item.y)), `${name} movement points finite`)
assert(almostFlat.points[1].y < almostFlat.points[0].y && movement([120, 121]) < movement([120, 125]) && movement([120, 125]) < movement([120, 130]) && movement([120, 130]) < movement([120, 60]), 'movement hierarchy is almost flat then small then moderate then large')

const flat120 = plot([120, 120]); assert(flat120.points[0].y === flat120.points[1].y && flat120.points[0].y > flat120.plotTop && flat120.points[0].y < flat120.plotBottom, 'flat 120 line has room above and below')
const flatZero = plot([0, 0]); assert(flatZero.points[0].y === flatZero.points[1].y && Number.isFinite(flatZero.points[0].y) && flatZero.domain[0] === 0 && flatZero.domain[1] > 0 && flatZero.points[0].y < flatZero.baselineY && flatZero.points[0].y <= flatZero.plotBottom, 'flat zero line remains visible above baseline')
const invalidInput = [point('valid-zero', 0, 0), point('negative', 1, -1), point('nan', 2, NaN), point('infinity', 3, Infinity)]
const invalidPlot = buildTodayProteinPreviewPlot(invalidInput, geometry)
assert(invalidPlot.points.length === 1 && invalidPlot.points[0].proteinGrams === 0, 'invalid Protein values omitted and saved-empty zero retained')

const one = buildTodayProteinPreviewPlot([point('one', 2, 120)], geometry); const expectedOneX = geometry.left + (2 / 6) * (geometry.width - geometry.left - geometry.right)
assert(one.points.length === 1 && Number.isFinite(one.points[0].x) && Number.isFinite(one.points[0].y) && one.points[0].x === expectedOneX, 'one point uses actual calendar dayIndex')

const gapsInput = [point('zero', 0, 100), point('two', 2, 110), point('five', 5, 120)]; const gapsBefore = structuredClone(gapsInput); const geometryBefore = structuredClone(geometry); const gaps = buildTodayProteinPreviewPlot(gapsInput, geometry)
assert(gaps.points.length === 3 && gaps.points[2].x - gaps.points[1].x > gaps.points[1].x - gaps.points[0].x, 'calendar gaps use dayIndex spacing')
for (const result of [almostFlat, small, moderate, large, flat120, flatZero, invalidPlot, one, gaps]) for (const item of result.points) assert(Number.isFinite(item.x) && Number.isFinite(item.y) && item.x >= geometry.left && item.x <= geometry.width - geometry.right && item.y >= geometry.top && item.y <= result.plotBottom, 'coordinates remain inside plot')
assert(JSON.stringify(gapsInput) === JSON.stringify(gapsBefore) && JSON.stringify(geometry) === JSON.stringify(geometryBefore), 'inputs are not mutated')
assert([gaps.domain[0], gaps.domain[1]].every(Number.isFinite) && gaps.domain[0] < gaps.domain[1], 'output domain is finite and ordered')

console.log('Today Protein preview verification passed.')
