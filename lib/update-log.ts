export interface UpdateEntry {
  date: string // ISO date string
  time: string // HH:mm:ss
  id: string // matches i18n key under updates.entries
  changeCount: number // number of changes
  adminOnly?: boolean // hide from non-admin users
}

export const updateLog: UpdateEntry[] = [
  {
    date: '2026-02-11',
    time: '22:00:00',
    id: 'adminImageUpload',
    changeCount: 3,
    adminOnly: true,
  },
  {
    date: '2026-02-11',
    time: '18:00:00',
    id: 'premiumUpgrades',
    changeCount: 5,
  },
  {
    date: '2026-02-02',
    time: '00:49:00',
    id: 'adminPanelMerge',
    changeCount: 3,
    adminOnly: true,
  },
  {
    date: '2026-02-01',
    time: '23:59:00',
    id: 'homepageRedesign',
    changeCount: 4,
  },
  {
    date: '2026-01-29',
    time: '09:54:00',
    id: 'performanceUpdate',
    changeCount: 2,
  },
  {
    date: '2026-01-28',
    time: '21:24:00',
    id: 'receiptVerification',
    changeCount: 3,
    adminOnly: true,
  },
  {
    date: '2026-01-25',
    time: '19:08:00',
    id: 'duitnowPayment',
    changeCount: 2,
  },
]
