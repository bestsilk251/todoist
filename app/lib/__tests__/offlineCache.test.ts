import {
  cacheTasks,
  getCachedTasks,
  queuePendingInsert,
  getPendingInserts,
  flushPendingInserts,
  __resetForTests,
} from '../offlineCache';

describe('offlineCache', () => {
  beforeEach(() => __resetForTests());

  it('round-trips cached tasks', async () => {
    await cacheTasks([{ id: '1', title: 'Buy milk' }]);
    expect(await getCachedTasks()).toEqual([{ id: '1', title: 'Buy milk' }]);
  });

  it('clears the queue when every insert succeeds', async () => {
    await queuePendingInsert({ id: '1', title: 'Works' });
    const okInsert = jest.fn().mockResolvedValue(undefined);

    await flushPendingInserts(okInsert);

    expect(okInsert).toHaveBeenCalledWith({ id: '1', title: 'Works' });
    expect(await getPendingInserts()).toEqual([]);
  });

  it('keeps a task queued if its insert fails', async () => {
    await queuePendingInsert({ id: '2', title: 'Fails' });
    const failingInsert = jest.fn().mockRejectedValue(new Error('network down'));

    await flushPendingInserts(failingInsert);

    expect(failingInsert).toHaveBeenCalledWith({ id: '2', title: 'Fails' });
    expect(await getPendingInserts()).toEqual([{ id: '2', title: 'Fails' }]);
  });

  it('retains only the failed task when the queue is mixed', async () => {
    await queuePendingInsert({ id: '1', title: 'Works' });
    await queuePendingInsert({ id: '2', title: 'Fails' });

    const insert = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('network down'));

    await flushPendingInserts(insert);

    expect(await getPendingInserts()).toEqual([{ id: '2', title: 'Fails' }]);
  });
});
