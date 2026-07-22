import { render, waitFor } from '@testing-library/react-native';
import TaskListScreen, { groupByDate } from '../TaskListScreen';
import type { Task } from '../../types';

const mockUnsubscribe = jest.fn();
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  unsubscribe: mockUnsubscribe,
};
const mockSelect = jest.fn(() => Promise.resolve({ data: mockRows }));

function isoDay(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const mockRows = [
  { id: '1', title: 'Today task', due_date: isoDay(0), due_time: null, status: 'pending' },
  { id: '2', title: 'Tomorrow task', due_date: isoDay(1), due_time: null, status: 'pending' },
  { id: '3', title: 'Later task', due_date: isoDay(9), due_time: null, status: 'pending' },
];

const mockSetOptions = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), setOptions: mockSetOptions }),
}));

jest.mock('../../lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({ select: mockSelect }),
    channel: () => mockChannel,
  }),
}));

jest.mock('../../lib/useAuth', () => ({ signOut: jest.fn() }));

function ddmmyyyy(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const iso = d.toISOString().slice(0, 10);
  const [y, m, day] = iso.split('-');
  return `${day}-${m}-${y}`;
}

function ddmmyyyyToIso(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

describe('groupByDate', () => {
  it('labels today/tomorrow by name and later days by their date', () => {
    const sections = groupByDate(mockRows as unknown as Task[]);
    expect(sections.map((s) => s.title)).toEqual(['Today', 'Tomorrow', ddmmyyyy(9)]);
  });

  it('omits empty sections', () => {
    const sections = groupByDate([mockRows[0]] as unknown as Task[]);
    expect(sections.map((s) => s.title)).toEqual(['Today']);
  });

  it('groups distinct future dates into separate chronological sections', () => {
    const list = [
      { id: 'a', title: 'x', due_date: ddmmyyyyToIso(9), due_time: null, status: 'pending' },
      { id: 'b', title: 'y', due_date: ddmmyyyyToIso(5), due_time: null, status: 'pending' },
    ];
    const sections = groupByDate(list as unknown as Task[]);
    expect(sections.map((s) => s.title)).toEqual([ddmmyyyy(5), ddmmyyyy(9)]);
  });

  it('puts tasks with no date into a "Без дати" section last', () => {
    const list = [
      { ...mockRows[0] },
      { id: 'z', title: 'no date', due_date: null, due_time: null, status: 'pending' },
    ];
    const sections = groupByDate(list as unknown as Task[]);
    expect(sections[sections.length - 1].title).toBe('Без дати');
  });
});

describe('TaskListScreen', () => {
  it('loads tasks from the database for grouped rendering', async () => {
    render(<TaskListScreen />);
    await waitFor(() => expect(mockSelect).toHaveBeenCalledWith('*'));
  });

  it('subscribes to realtime changes and unsubscribes on unmount', async () => {
    const { unmount } = render(<TaskListScreen />);
    await waitFor(() => expect(mockChannel.subscribe).toHaveBeenCalled());

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
