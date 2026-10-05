import { HELP_SECTIONS } from './appHelp'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const EXPECTED_IDS = [
  'what-it-does',
  'getting-around',
  'today-quick-add',
  'weekly-history-analytics',
  'backup-restore',
  'data-privacy',
  'accounts-cloud',
  'install-offline-updates',
  'limitations',
  'recovery',
]

assert(
  JSON.stringify(HELP_SECTIONS.map((section) => section.id)) === JSON.stringify(EXPECTED_IDS),
  'help sections cover every roadmap topic in order',
)
assert(new Set(HELP_SECTIONS.map((section) => section.title)).size === HELP_SECTIONS.length, 'titles are unique')

const allText: string[] = []
for (const section of HELP_SECTIONS) {
  assert(section.title.trim() === section.title && section.title.length > 0, `${section.id}: title`)
  assert(section.summary.trim() === section.summary && section.summary.length > 0, `${section.id}: summary`)
  assert(section.blocks.length > 0, `${section.id}: has content`)
  allText.push(section.title, section.summary)
  for (const block of section.blocks) {
    if (block.kind === 'paragraph') {
      assert(block.text.trim().length > 0, `${section.id}: paragraph is not empty`)
      allText.push(block.text)
    } else {
      assert(block.items.length > 0, `${section.id}: list has items`)
      for (const item of block.items) {
        assert(item.trim() === item && item.length > 0, `${section.id}: list item is trimmed and not empty`)
        allText.push(item)
      }
    }
  }
}

const textOf = (id: string): string => {
  const section = HELP_SECTIONS.find((candidate) => candidate.id === id)
  assert(section, `section ${id} exists`)
  return section.blocks
    .flatMap((block) => (block.kind === 'paragraph' ? [block.text] : block.items))
    .join('\n')
}

// Honest statements that must stay true until the roadmap changes them.
assert(textOf('accounts-cloud').includes('not available yet'), 'accounts and cloud are described as not available')
assert(textOf('backup-restore').includes('replaces all current NutriFlow data'), 'restore is described as replacing data')
assert(textOf('backup-restore').includes('does not merge'), 'restore is described as not merging')
assert(textOf('data-privacy').includes('does not send your data to any server'), 'privacy statement present')
assert(textOf('recovery').includes('Recently deleted'), 'recovery mentions Recently deleted')
assert(textOf('recovery').includes('Backup & Restore'), 'recovery mentions Backup & Restore')
assert(textOf('limitations').includes('cloud sync'), 'limitations mention cloud sync')
assert(textOf('today-quick-add').includes('Add More') && textOf('today-quick-add').includes('Add & Return'), 'Quick Add flow buttons are named')

// No stale wording.
for (const text of allText) {
  assert(!/prototype/i.test(text), `no "prototype" wording: ${text}`)
  assert(!/\bTODO\b/.test(text), `no TODO text: ${text}`)
}

console.log('App help verifier: all Task 10.4 assertions passed.')