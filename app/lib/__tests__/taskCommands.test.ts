import { resolveTaskScheduleCommand, splitTaskCommandText } from '../taskCommands';
import type { PreviewTask, V5Task } from '../v5data';
import { offsetFromToday } from '../tasksRepo';

const preview: PreviewTask = {
  id: 'preview', title: 'Зустріч', iso: '2026-07-23', time: '10:00', duration: '1 год',
  category: 'Робота', important: false, needsConfirmation: false,
};

const task = (id: string, time: string, date = '2026-07-23'): V5Task => ({
  id, dueInDays: offsetFromToday(date), title: id, time, category: 'Робота', priority: 'low',
  completed: false, cancelled: false, overdue: false, repeat: false, hasSubtasks: false,
  subtaskCount: 0, durationMinutes: 60, completedAt: null,
});

describe('task schedule voice/text commands', () => {
  it('separates a new task from a following shift command', () => {
    expect(splitTaskCommandText('Зустріч на 10, перемісти все що є в цей період на годину')).toEqual({
      taskText: 'Зустріч на 10',
      commandText: 'перемісти все що є в цей період на годину',
    });
  });

  it('moves every task overlapping the new task period', () => {
    const command = resolveTaskScheduleCommand(
      'перемісти все що є в цей період на годину',
      [preview],
      [task('overlap', '10:30'), task('later', '12:00')],
    );
    expect(command).toEqual(expect.objectContaining({ kind: 'shift', shiftMinutes: 60, taskIds: ['overlap'] }));
  });

  it('soft-cancels all earlier timed tasks before a new meeting', () => {
    const noonPreview = { ...preview, time: '12:00' };
    const command = resolveTaskScheduleCommand(
      'звільни час до зустрічі',
      [noonPreview],
      [task('early', '09:00'), task('after', '13:00')],
    );
    expect(command).toEqual(expect.objectContaining({ kind: 'cancel', taskIds: ['early'], toMinutes: 12 * 60 }));
  });

  it('understands an explicit period without creating a task', () => {
    const split = splitTaskCommandText('Скасуй усі задачі з 10 до 12');
    const command = resolveTaskScheduleCommand(split.commandText, [], [task('inside', '11:00')]);
    expect(split.taskText).toBe('');
    expect(command?.taskIds).toEqual(['inside']);
  });

  it('understands a described period and spoken minutes', () => {
    const split = splitTaskCommandText('Видалити якийсь період завдань з 10 15 до 12 30');
    const command = resolveTaskScheduleCommand(split.commandText, [], [task('inside', '11:00'), task('outside', '13:00')]);
    expect(command).toEqual(expect.objectContaining({
      kind: 'cancel',
      fromMinutes: 10 * 60 + 15,
      toMinutes: 12 * 60 + 30,
      taskIds: ['inside'],
    }));
  });

  it('understands a spoken upper time boundary', () => {
    const split = splitTaskCommandText('Звільни час до 12 30');
    const command = resolveTaskScheduleCommand(split.commandText, [], [task('inside', '12:00'), task('outside', '13:00')]);
    expect(command).toEqual(expect.objectContaining({
      kind: 'cancel',
      toMinutes: 12 * 60 + 30,
      taskIds: ['inside'],
    }));
  });
});
