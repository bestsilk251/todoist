import type { V5Task } from './v5data';

const priorityKeywords: Record<V5Task['priority'], string> = {
  urgent: 'терміновий термінова критичний важливий',
  high: 'високий висока важливий пріоритет',
  medium: 'середній середня звичайний',
  low: 'низький низька без пріоритету',
};

function normalize(value: string): string {
  return value.toLocaleLowerCase('uk-UA').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
}

export function matchesTaskSearch(task: V5Task, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  const stateKeywords = task.completed
    ? 'виконано виконані завершено завершені'
    : task.overdue
      ? 'прострочено прострочені пропущено'
      : 'активні заплановано';
  const searchable = normalize([
    task.title,
    task.category,
    task.time,
    priorityKeywords[task.priority],
    stateKeywords,
  ].join(' '));
  return normalizedQuery.split(' ').every((token) => searchable.includes(token));
}
