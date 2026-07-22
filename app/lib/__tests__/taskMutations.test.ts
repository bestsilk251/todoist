import { isoFromOffset, updateTaskFields } from '../tasksRepo';
import { getSupabaseClient } from '../supabase';

jest.mock('../supabase', () => ({ getSupabaseClient: jest.fn() }));

describe('task mutations', () => {
  const eq = jest.fn();
  const update = jest.fn();
  const from = jest.fn();

  beforeEach(() => {
    eq.mockReset().mockResolvedValue({ error: null });
    update.mockReset().mockReturnValue({ eq });
    from.mockReset().mockReturnValue({ update });
    (getSupabaseClient as jest.Mock).mockReturnValue({ from });
  });

  it('persists a postponed task on the requested calendar day', async () => {
    await updateTaskFields('task-1', { dueInDays: 1 });

    expect(from).toHaveBeenCalledWith('tasks');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ due_date: isoFromOffset(1) }));
    expect(eq).toHaveBeenCalledWith('id', 'task-1');
  });

  it('can remove the date without changing unrelated task fields', async () => {
    await updateTaskFields('task-2', { dueInDays: null });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ due_date: null }));
    const patch = update.mock.calls[0][0] as Record<string, unknown>;
    expect(patch).not.toHaveProperty('due_time');
    expect(patch).not.toHaveProperty('status');
  });

  it('persists a calendar drag as a timed task without changing its date', async () => {
    await updateTaskFields('task-3', { time: '10:15' });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      due_time: '10:15',
      duration_minutes: 60,
      is_all_day: false,
    }));
    const patch = update.mock.calls[0][0] as Record<string, unknown>;
    expect(patch).not.toHaveProperty('due_date');
    expect(eq).toHaveBeenCalledWith('id', 'task-3');
  });
});
