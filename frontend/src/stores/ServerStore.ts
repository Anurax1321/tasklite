import { categoriesApi, tasksApi } from '../api';
import { TaskStore, CategoryStore } from './types';

export const ServerTaskStore: TaskStore = {
  list: () => tasksApi.list(),
  create: input => tasksApi.create(input),
  update: (id, patch) => tasksApi.update(id, patch),
  remove: id => tasksApi.remove(id),
};

export const ServerCategoryStore: CategoryStore = {
  list: () => categoriesApi.list(),
  create: input => categoriesApi.create(input),
  update: (id, patch) => categoriesApi.update(id, patch),
  remove: id => categoriesApi.remove(id),
};
