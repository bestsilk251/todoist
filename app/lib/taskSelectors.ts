import type { V5Task } from './v5data';

export type TaskListSection = 'active' | 'overdue' | 'completed' | 'cancelled';

/** One canonical lifecycle classification shared by list and calendar screens. */
export function getTaskListSection(task: V5Task): TaskListSection {
  if (task.cancelled) return 'cancelled';
  if (task.completed) return 'completed';
  if (task.overdue) return 'overdue';
  return 'active';
}

export function isTaskInListSection(task: V5Task, section: TaskListSection): boolean {
  return getTaskListSection(task) === section;
}

/** Calendar never invents its own rows: it only projects dated, non-cancelled tasks. */
export function isTaskOnCalendarDay(task: V5Task, dueInDays: number): boolean {
  return task.dueInDays === dueInDays && getTaskListSection(task) !== 'cancelled';
}
