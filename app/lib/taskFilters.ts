import type { Priority } from '../theme';
import type { V5Task } from './v5data';

export interface TaskFilters {
  priorities: Priority[];
  categories: string[];
}

export function matchesTaskFilters(task: V5Task, filters: TaskFilters): boolean {
  const priorityMatches = filters.priorities.length === 0 || filters.priorities.includes(task.priority);
  const categoryMatches = filters.categories.length === 0 || filters.categories.includes(task.category);
  return priorityMatches && categoryMatches;
}

export function taskFilterCount(filters: TaskFilters): number {
  return filters.priorities.length + filters.categories.length;
}
