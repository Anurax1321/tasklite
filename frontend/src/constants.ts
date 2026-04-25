import { Category, Priority } from './types';

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#94a3b8' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

export const PRIORITY_RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2 };

export const ICON_CHOICES = [
  '📝', '🏠', '🛒', '💪', '📚', '🎨', '💰', '🗂️',
  '✈️', '🍽️', '☕', '🎵', '🏃', '💻', '📱', '🎮',
  '🐾', '🌱', '🎯', '🔧', '📞', '🎬', '⚡', '🌟',
];

export const COLOR_CHOICES = [
  '#2563eb', '#8b5cf6', '#10b981', '#f97316',
  '#6366f1', '#ec4899', '#14b8a6', '#6b7280',
  '#ef4444', '#f59e0b', '#84cc16', '#06b6d4',
];

export const SEED_CATEGORIES_GUEST: Category[] = [
  { id: 'guest-cat-work', name: 'Work', icon: '📝', color: '#2563eb', createdAt: '' },
  { id: 'guest-cat-personal', name: 'Personal', icon: '🏠', color: '#8b5cf6', createdAt: '' },
  { id: 'guest-cat-shopping', name: 'Shopping', icon: '🛒', color: '#10b981', createdAt: '' },
  { id: 'guest-cat-health', name: 'Health', icon: '💪', color: '#f97316', createdAt: '' },
  { id: 'guest-cat-study', name: 'Study', icon: '📚', color: '#6366f1', createdAt: '' },
  { id: 'guest-cat-hobby', name: 'Hobby', icon: '🎨', color: '#ec4899', createdAt: '' },
  { id: 'guest-cat-finance', name: 'Finance', icon: '💰', color: '#14b8a6', createdAt: '' },
  { id: 'guest-cat-other', name: 'Other', icon: '🗂️', color: '#6b7280', createdAt: '' },
];
