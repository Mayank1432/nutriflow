export type HelpBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }

export type HelpSection = {
  id: string
  title: string
  summary: string
  blocks: HelpBlock[]
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'what-it-does',
    title: 'What NutriFlow does',
    summary: 'A protein-first nutrition planner.',
    blocks: [
      {
        kind: 'paragraph',
        text: 'NutriFlow helps you log what you eat, plan your week, and see how your protein, calories, and cost add up. Protein comes first, and calories and cost always stay visible.',
      },
      {
        kind: 'list',
        items: [
          'Today: log foods by meal and watch protein, calories, and cost against your Macro Goals.',
          'Weekly Planner: plan meals for each day of the week.',
          'History: review past days and fix mistakes.',
          'Analytics: see seven-day trends for protein, calories, spending, macros, and meals.',
          'Shopping List and Pantry / Stock: keep track of what to buy and what is running low.',
          'Cost / Protein Table: compare foods by protein, calories, and cost.',
        ],
      },
    ],
  },
  {
    id: 'getting-around',
    title: 'Getting around',
    summary: 'The bottom bar and the menu.',
    blocks: [
      {
        kind: 'list',
        items: [
          'The bottom bar has the four main screens: Today, Weekly, History, and Analytics.',
          'The menu (the three-line button at the top left) opens everything else: Quick Add, Shopping List, Pantry / Stock, Today Tools, Backup & Restore, Settings, and this Help screen.',
          'Sign in / Sign out, Account, Cloud Sync, and Multi-user Sharing in the menu are placeholders. They do not work yet.',
        ],
      },
    ],
  },
  {
    id: 'today-quick-add',
    title: 'Today and Quick Add',
    summary: 'Logging food, quantities, and staples.',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Today is where you log food. Pick a meal (Breakfast, Lunch, Dinner, or Snacks), then add foods to it.',
      },
      {
        kind: 'list',
        items: [
          'Quick Add opens your food library. Search, or filter by category such as High protein or Low cost, choose a food, and enter the quantity.',
          'Add More keeps the library open so you can add another food. Add & Return takes you back to Today.',
          'On a meal card you can change a food\'s quantity or remove the food.',
          'Daily Staples are foods you eat often. Set them up once under Today Tools in the menu.',
          'Custom Ingredient lets you add your own foods, with protein, calories, and cost per 100 g or per unit.',
          'When the date changes, the day you logged is saved to History automatically the next time you open the app.',
        ],
      },
    ],
  },
  {
    id: 'weekly-history-analytics',
    title: 'Weekly, History, and Analytics',
    summary: 'Planning ahead, fixing the past, and seeing trends.',
    blocks: [
      {
        kind: 'list',
        items: [
          'Weekly Planner: choose a weekday and plan its meals. Copy Day copies a day\'s meals to another weekday and replaces that day\'s plan. Clear Day empties a day.',
          'History: lists your saved days. Open a day and choose Edit day to change a quantity, add a missing food, or remove a food.',
          'Delete day moves a day to Recently deleted, where you can restore it or delete it permanently.',
          'Analytics: shows the last seven days of your saved History, including protein, calories, spending, macro trends, macro split, and protein by meal. Days with nothing saved are left out instead of being counted as zero.',
        ],
      },
    ],
  },
  {
    id: 'backup-restore',
    title: 'Backup, export, import, and restore',
    summary: 'Keep a safe copy of your data.',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Backup & Restore (in the menu) saves all your NutriFlow data to one file, and restores it from a file.',
      },
      {
        kind: 'list',
        items: [
          'Download backup creates a file named nutriflow-backup-YYYY-MM-DD.json. Keep it somewhere safe, such as cloud storage.',
          'Choose backup file shows what the file contains before anything changes.',
          'Restore replaces all current NutriFlow data on this device with the backup. It does not merge. Export a backup first if you want to keep what you have now.',
          'If a restore cannot finish, your current data is left as it was. After a restore, the app reloads.',
          'Back up regularly. Clearing your browser data erases NutriFlow data unless you have a backup file.',
        ],
      },
    ],
  },
  {
    id: 'data-privacy',
    title: 'Your data and privacy',
    summary: 'Local-first: your data stays on this device.',
    blocks: [
      {
        kind: 'paragraph',
        text: 'NutriFlow is local-first. Everything you enter is stored in your browser on this device.',
      },
      {
        kind: 'list',
        items: [
          'NutriFlow does not send your data to any server. It has no accounts, and the app contains no analytics or advertising code.',
          'You own your data. You can export all of it at any time with Backup & Restore.',
          'Data is kept separately for each browser and each device, and separately from the original NutriFlow app.',
          'After your first visit the app only needs the internet to download updates.',
        ],
      },
    ],
  },
  {
    id: 'accounts-cloud',
    title: 'Accounts and cloud sync',
    summary: 'Not available yet.',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Accounts and cloud sync are not available yet. There is no sign-in, no account, and no sync today. Your data lives only on this device.',
      },
      {
        kind: 'list',
        items: [
          'Sign in / Sign out, Account, Cloud Sync, and Multi-user Sharing in the menu are placeholders for features planned for later.',
          'Until cloud sync exists, use Backup & Restore to keep a safe copy or to move your data to another device.',
        ],
      },
    ],
  },
  {
    id: 'install-offline-updates',
    title: 'Install, offline, and updates',
    summary: 'Using NutriFlow like an app.',
    blocks: [
      {
        kind: 'list',
        items: [
          'Install: in desktop Chrome or Edge, use the install icon in the address bar or the browser menu. In Android Chrome, open the menu and choose Install app or Add to Home screen. In Safari on iPhone, tap Share, then Add to Home Screen. Menu names differ by browser.',
          'Offline: after your first visit the app works without internet. Everything you log is saved on your device.',
          'Updates: a new version downloads in the background when you are online. Close and reopen the app, or reload the page, to start using it.',
          'On some devices an installed app keeps its data separately from the browser. If you switch between them, use Backup & Restore to carry your data across.',
        ],
      },
    ],
  },
  {
    id: 'limitations',
    title: 'Known limitations',
    summary: 'What NutriFlow does not do yet.',
    blocks: [
      {
        kind: 'list',
        items: [
          'No accounts, sign-in, cloud sync, or sharing yet.',
          'Your data lives in one browser on one device. It does not follow you to other devices.',
          'Restoring a backup replaces everything. There is no merge.',
          'There is no barcode scanning and no food photos yet.',
        ],
      },
    ],
  },
  {
    id: 'recovery',
    title: 'If something goes wrong',
    summary: 'Fixes for common problems.',
    blocks: [
      {
        kind: 'list',
        items: [
          'My data is missing. Check that you are using the same browser and the same site address as before, because data is stored per browser. If you have a backup file, restore it from Backup & Restore.',
          'I deleted a day by mistake. Open History, find Recently deleted, and choose Restore.',
          'A past day has wrong amounts. Open it in History, choose Edit day, and fix a quantity, add a missing food, or remove a wrong one.',
          'The app looks out of date. Close every NutriFlow tab or window and open it again while you are online.',
          'A backup file was rejected. The message explains why, and your current data is not changed. Only files downloaded from NutriFlow\'s Backup & Restore can be restored.',
          'I cannot find the install option. Installing needs a supported browser. On iPhone, use the Share menu in Safari.',
          'I need my data from the original app. It is still in the original app, which stays available at the /classic/ address of this site. It is not imported into this app.',
        ],
      },
    ],
  },
]