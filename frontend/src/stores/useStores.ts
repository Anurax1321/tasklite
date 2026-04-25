import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LocalCategoryStore, LocalTaskStore } from './LocalStore';
import { ServerCategoryStore, ServerTaskStore } from './ServerStore';
import { CategoryStore, TaskStore } from './types';

export function useStores(): { tasks: TaskStore; categories: CategoryStore; isGuest: boolean } {
  const { user } = useAuth();
  return useMemo(() => {
    const isGuest = !user;
    return {
      tasks: isGuest ? LocalTaskStore : ServerTaskStore,
      categories: isGuest ? LocalCategoryStore : ServerCategoryStore,
      isGuest,
    };
  }, [user]);
}
