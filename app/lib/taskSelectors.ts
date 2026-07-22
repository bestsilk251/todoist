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

/** Whether the task was completed on the reference day in the device timezone. */
export function isTaskCompletedOnLocalDay(task: V5Task, referenceDate = new Date()): boolean {
  if (!task.completed || task.cancelled || !task.completedAt) return false;
  const completedAt = new Date(task.completedAt);
  if (Number.isNaN(completedAt.getTime())) return false;
  return completedAt.getFullYear() === referenceDate.getFullYear()
    && completedAt.getMonth() === referenceDate.getMonth()
    && completedAt.getDate() === referenceDate.getDate();
}

/** Calendar never invents its own rows: it only projects dated, non-cancelled tasks. */
export function isTaskOnCalendarDay(task: V5Task, dueInDays: number): boolean {
  return task.dueInDays === dueInDays && getTaskListSection(task) !== 'cancelled';
}
