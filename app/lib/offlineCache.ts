/**
 * Offline cache and pending-insert queue.
 *
 * Backed by in-memory maps for now. The contract other modules depend on is
 * the function signatures below — swapping the storage for expo-sqlite tables
 * is a self-contained change that does not touch callers.
 */

export interface CachedTask {
  id: string;
  title: string;
  due_date?: string | null;
  due_time?: string | null;
  status?: string;
  [key: string]: unknown;
}

let cachedTasks: CachedTask[] = [];
let pendingInserts: CachedTask[] = [];

export async function cacheTasks(tasks: CachedTask[]): Promise<void> {
  cachedTasks = tasks;
}

export async function getCachedTasks(): Promise<CachedTask[]> {
  return cachedTasks;
}

export async function queuePendingInsert(task: CachedTask): Promise<void> {
  pendingInserts.push(task);
}

export async function getPendingInserts(): Promise<CachedTask[]> {
  return pendingInserts;
}

/**
 * Attempts to send every queued task. Tasks whose insert fails stay in the
 * queue so a flaky network never silently drops a user's task.
 */
export async function flushPendingInserts(
  insertFn: (task: CachedTask) => Promise<void>,
): Promise<void> {
  const stillPending: CachedTask[] = [];

  for (const task of pendingInserts) {
    try {
      await insertFn(task);
    } catch {
      stillPending.push(task);
    }
  }

  pendingInserts = stillPending;
}

export function __resetForTests(): void {
  cachedTasks = [];
  pendingInserts = [];
}
