export const StorageKeys = {
  theme: 'tasklite:theme',
  guestTasks: 'tasklite:guest-tasks',
  guestCategories: 'tasklite:guest-categories',
  guestBannerDismissed: 'tasklite:guest-banner-dismissed',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
