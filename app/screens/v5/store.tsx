/**
 * Central state + actions for the v5 dark UI, backed by Supabase.
 *
 * Tasks are loaded from the `tasks` table on mount and kept live via a realtime
 * subscription; mutations update the DB (with an optimistic local echo). Quick
 * add and voice both route free text through the parse-task Edge Function, then
 * open the preview sheet before anything is saved.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import { seedAllDay, type V5Task, type V5AllDay, type PreviewTask } from '../../lib/v5data';
import { categoryColors as seedCategories } from '../../theme';
import { getSupabaseClient } from '../../lib/supabase';
import {
  fetchTasks, insertTasks, setStatus, removeTask, setDueDate, parseTaskText,
  rowToV5, previewFromParsed, previewToInsert, isoOf, isoFromOffset,
} from '../../lib/tasksRepo';

export type TabKey = 'home' | 'list' | 'calendar' | 'profile';
export type VoiceState = 'idle' | 'recording' | 'processing';
export type CalendarView = 'day' | 'week' | 'month';

interface V5State {
  activeTab: TabKey;
  tasks: V5Task[];
  loading: boolean;
  categories: Record<string, string>;
  quickText: string;
  quickFocused: boolean;
  voiceState: VoiceState;
  recordSeconds: number;
  partialText: string;
  isPaused: boolean;
  previewOpen: boolean;
  previewTasks: PreviewTask[];
  editingPreviewId: string | null;
  timePickerId: string | null;
  timePickerHour: number;
  timePickerMinute: number;
  categoryEditorOpen: boolean;
  showCompleted: boolean;
  listAddMenuOpen: boolean;
  listAddMode: 'text' | null;
  listSearchOpen: boolean;
  listSearchQuery: string;
  avatarMenuOpen: boolean;
  logoutConfirmOpen: boolean;
  userName: string;
  userFullName: string;
  userEmail: string;
  userInitials: string;
  taskDetailId: string | null;
  shareSheetOpen: boolean;
  calendarView: CalendarView;
  calendarDayOffset: number;
  calendarAllDay: V5AllDay[];
  openSwipeId: string | null;
}

const initialState: V5State = {
  activeTab: 'home',
  tasks: [],
  loading: true,
  categories: { ...seedCategories },
  quickText: '',
  quickFocused: false,
  voiceState: 'idle',
  recordSeconds: 0,
  partialText: '',
  isPaused: false,
  previewOpen: false,
  previewTasks: [],
  editingPreviewId: null,
  timePickerId: null,
  timePickerHour: 9,
  timePickerMinute: 0,
  categoryEditorOpen: false,
  showCompleted: false,
  listAddMenuOpen: false,
  listAddMode: null,
  listSearchOpen: false,
  listSearchQuery: '',
  avatarMenuOpen: false,
  logoutConfirmOpen: false,
  userName: 'друже',
  userFullName: 'Користувач',
  userEmail: '',
  userInitials: '—',
  taskDetailId: null,
  shareSheetOpen: false,
  calendarView: 'day',
  calendarDayOffset: 0,
  calendarAllDay: seedAllDay,
  openSwipeId: null,
};

const PARTIAL_PHRASES = ['', 'Зустріч', 'Зустріч із командою', 'Зустріч із командою завтра', 'Зустріч із командою завтра ввечері'];

function buzz(pattern?: number | number[]) {
  try { Vibration.vibrate(pattern ?? 15); } catch { /* no-op on web */ }
}

function getSpeechRecognition(): any | null {
  if (Platform.OS !== 'web') return null;
  const w = globalThis as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface V5Store extends V5State {
  set: (patch: Partial<V5State> | ((s: V5State) => Partial<V5State>)) => void;
  onSignOut?: () => void;
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  postponeTask: (id: string) => void;
  setOpenSwipe: (id: string | null) => void;
  setTab: (t: TabKey) => void;
  submitQuick: () => void;
  openMic: () => void;
  togglePauseVoice: () => void;
  cancelVoice: () => void;
  finishVoice: () => void;
  scheduleFreeWindow: () => void;
  deletePreviewTask: (id: string) => void;
  resolvePreviewTime: (id: string) => void;
  cancelPreview: () => void;
  togglePreviewEdit: (id: string) => void;
  updatePreviewField: (id: string, field: keyof PreviewTask, value: string) => void;
  cyclePreviewDate: (id: string) => void;
  cyclePreviewCategory: (id: string) => void;
  togglePreviewImportant: (id: string) => void;
  confirmSave: () => void;
  openTimePicker: (id: string) => void;
  closeTimePicker: () => void;
  setTimePickerHour: (h: number) => void;
  setTimePickerMinute: (m: number) => void;
  applyTimePreset: (h: number, m: number) => void;
  confirmTimePicker: () => void;
  toggleShowCompleted: () => void;
  handleFabClick: () => void;
  chooseListText: () => void;
  chooseListMic: () => void;
  closeListAddMenu: () => void;
  toggleListSearch: () => void;
  setListSearch: (q: string) => void;
  openAvatarMenu: () => void;
  closeAvatarMenu: () => void;
  openLogoutConfirm: () => void;
  closeLogoutConfirm: () => void;
  confirmLogout: () => void;
  openTaskDetail: (id: string) => void;
  closeTaskDetail: () => void;
  openShareSheet: () => void;
  closeShareSheet: () => void;
  openCategoryEditor: () => void;
  closeCategoryEditor: () => void;
  setCategoryColor: (name: string, color: string) => void;
  goToToday: () => void;
  setCalendarView: (v: CalendarView) => void;
  setCalendarDay: (offset: number) => void;
  prevDay: () => void;
  nextDay: () => void;
  toggleAllDay: (id: string) => void;
}

const Ctx = createContext<V5Store | null>(null);

export interface UserProfile { name: string; fullName: string; email: string; initials: string }

export function V5Provider({ children, onSignOut, profile }: { children: React.ReactNode; onSignOut?: () => void; profile?: UserProfile }) {
  const [state, setState] = useState<V5State>(() =>
    profile
      ? { ...initialState, userName: profile.name, userFullName: profile.fullName, userEmail: profile.email, userInitials: profile.initials }
      : initialState
  );
  const nextPreviewId = useRef(1);
  const recordTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordSecondsRef = useRef(0);
  const pausedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const finishedRef = useRef(false);

  const set: V5Store['set'] = (patch) =>
    setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));

  const reload = useCallback(async () => {
    try {
      const rows = await fetchTasks();
      const today = new Date();
      setState((s) => ({ ...s, tasks: rows.map((r) => rowToV5(r, today)), loading: false }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  // Initial load + realtime subscription.
  useEffect(() => {
    let channel: any = null;
    reload();
    try {
      channel = getSupabaseClient()
        .channel('tasks-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' } as any, () => { reload(); })
        .subscribe();
    } catch { /* ignore */ }
    return () => {
      if (recordTimer.current) clearInterval(recordTimer.current);
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      try { if (channel) getSupabaseClient().removeChannel(channel); } catch { /* ignore */ }
    };
  }, [reload]);

  const openPreviewFromText = useCallback(async (text: string) => {
    const parsed = await parseTaskText(text);
    const items: PreviewTask[] = parsed.length
      ? parsed.map((p) => previewFromParsed(p, 'p' + nextPreviewId.current++))
      : [{ id: 'p' + nextPreviewId.current++, title: text, iso: isoOf(new Date()), time: '', duration: '', category: 'Особисте', important: false, needsConfirmation: false }];
    setState((s) => ({ ...s, voiceState: 'idle', previewTasks: items, previewOpen: true }));
  }, []);

  const store = useMemo<V5Store>(() => {
    const api: V5Store = {
      ...state,
      set,
      onSignOut,

      toggleComplete: (id) => {
        const t = state.tasks.find((x) => x.id === id);
        const nextDone = t ? !t.completed : true;
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, completed: nextDone, overdue: nextDone ? false : x.overdue } : x)),
          openSwipeId: s.openSwipeId === id ? null : s.openSwipeId,
        }));
        setStatus(id, nextDone ? 'done' : 'pending').catch(() => { reload(); });
      },
      deleteTask: (id) => {
        setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id), openSwipeId: null }));
        removeTask(id).catch(() => { reload(); });
      },
      postponeTask: (id) => {
        const t = state.tasks.find((x) => x.id === id);
        const next = (t?.dueInDays ?? 0) + 1;
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, dueInDays: next, overdue: false } : x)),
          openSwipeId: null,
        }));
        setDueDate(id, isoFromOffset(next)).catch(() => { reload(); });
      },
      setOpenSwipe: (id) => set({ openSwipeId: id }),
      setTab: (t) => set({ activeTab: t }),

      submitQuick: () => {
        const text = state.quickText.trim();
        if (!text) return;
        set({ quickText: '', listAddMode: null, voiceState: 'processing' });
        openPreviewFromText(text);
      },

      openMic: () => {
        buzz(15);
        recordSecondsRef.current = 0;
        pausedRef.current = false;
        finishedRef.current = false;
        transcriptRef.current = '';
        if (recordTimer.current) clearInterval(recordTimer.current);
        set({ voiceState: 'recording', recordSeconds: 0, partialText: '', isPaused: false });

        const SR = getSpeechRecognition();
        if (SR) {
          try {
            const rec = new SR();
            rec.lang = 'uk-UA';
            rec.interimResults = true;
            rec.continuous = true;
            rec.onresult = (event: any) => {
              let finalText = '';
              let interim = '';
              for (let i = 0; i < event.results.length; i++) {
                const r = event.results[i];
                if (r.isFinal) finalText += r[0].transcript;
                else interim += r[0].transcript;
              }
              transcriptRef.current = (finalText + interim).trim();
              set({ partialText: transcriptRef.current });
            };
            rec.onerror = () => { /* keep overlay; user decides */ };
            rec.onend = () => { if (!finishedRef.current && !pausedRef.current) { try { rec.start(); } catch { /* ignore */ } } };
            recognitionRef.current = rec;
            rec.start();
          } catch { recognitionRef.current = null; }
        }

        recordTimer.current = setInterval(() => {
          if (pausedRef.current) return;
          recordSecondsRef.current += 1;
          const patch: Partial<V5State> = { recordSeconds: recordSecondsRef.current };
          if (!recognitionRef.current) {
            const idx = Math.min(PARTIAL_PHRASES.length - 1, Math.floor(recordSecondsRef.current / 1.6));
            patch.partialText = PARTIAL_PHRASES[idx];
          }
          set(patch);
        }, 1000);
      },
      togglePauseVoice: () => {
        pausedRef.current = !pausedRef.current;
        if (pausedRef.current) { try { recognitionRef.current?.stop(); } catch { /* ignore */ } }
        set((s) => ({ isPaused: !s.isPaused }));
      },
      cancelVoice: () => {
        finishedRef.current = true;
        if (recordTimer.current) clearInterval(recordTimer.current);
        try { recognitionRef.current?.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
        buzz(15);
        set({ voiceState: 'idle' });
      },
      finishVoice: () => {
        finishedRef.current = true;
        if (recordTimer.current) clearInterval(recordTimer.current);
        const hadRecognition = !!recognitionRef.current;
        try { recognitionRef.current?.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
        buzz([0, 10, 30, 10]);
        set({ voiceState: 'processing' });

        if (hadRecognition) {
          const text = transcriptRef.current.trim();
          if (!text) { set({ voiceState: 'idle' }); return; }
          openPreviewFromText(text);
        } else {
          // No web STT (native / unsupported): demo preview so the flow still works.
          setTimeout(() => {
            const demo: PreviewTask[] = [
              { id: 'p' + nextPreviewId.current++, title: 'Зустріч із командою завтра ввечері', iso: isoFromOffset(1), time: '', duration: '', category: 'Робота', important: false, needsConfirmation: true },
              { id: 'p' + nextPreviewId.current++, title: 'Купити продукти', iso: isoOf(new Date()), time: '18:30', duration: '30 хв', category: 'Дім', important: false, needsConfirmation: false },
              { id: 'p' + nextPreviewId.current++, title: 'Подзвонити мамі', iso: isoOf(new Date()), time: '', duration: '', category: 'Особисте', important: true, needsConfirmation: false },
            ];
            set({ voiceState: 'idle', previewTasks: demo, previewOpen: true });
          }, 1100);
        }
      },
      scheduleFreeWindow: () => {
        const pt: PreviewTask = { id: 'p' + nextPreviewId.current++, title: 'Нова задача', iso: isoOf(new Date()), time: '15:30', duration: '1 год 30 хв', category: 'Особисте', important: false, needsConfirmation: false };
        set({ previewTasks: [pt], previewOpen: true });
      },

      deletePreviewTask: (id) => set((s) => ({ previewTasks: s.previewTasks.filter((p) => p.id !== id) })),
      resolvePreviewTime: (id) => set((s) => ({ previewTasks: s.previewTasks.map((p) => (p.id === id ? { ...p, time: '19:00', needsConfirmation: false } : p)) })),
      cancelPreview: () => set({ previewOpen: false, previewTasks: [], editingPreviewId: null }),
      togglePreviewEdit: (id) => set((s) => ({ editingPreviewId: s.editingPreviewId === id ? null : id })),
      updatePreviewField: (id, field, value) => set((s) => ({ previewTasks: s.previewTasks.map((p) => (p.id === id ? ({ ...p, [field]: value } as PreviewTask) : p)) })),
      cyclePreviewDate: (id) => {
        const opts = [isoFromOffset(0), isoFromOffset(1), isoFromOffset(4)];
        set((s) => ({
          previewTasks: s.previewTasks.map((p) => {
            if (p.id !== id) return p;
            const idx = opts.indexOf(p.iso ?? '');
            return { ...p, iso: opts[(idx + 1) % opts.length] };
          }),
        }));
      },
      cyclePreviewCategory: (id) => {
        const opts = Object.keys(state.categories);
        set((s) => ({ previewTasks: s.previewTasks.map((p) => (p.id === id ? { ...p, category: opts[(opts.indexOf(p.category) + 1) % opts.length] } : p)) }));
      },
      togglePreviewImportant: (id) => set((s) => ({ previewTasks: s.previewTasks.map((p) => (p.id === id ? { ...p, important: !p.important } : p)) })),
      confirmSave: () => {
        const payloads = state.previewTasks.map(previewToInsert);
        set({ previewOpen: false, previewTasks: [], editingPreviewId: null });
        insertTasks(payloads).then(() => reload()).catch(() => { reload(); });
      },

      openTimePicker: (id) => {
        const p = state.previewTasks.find((t) => t.id === id);
        const [h, m] = p && p.time ? p.time.split(':').map(Number) : [9, 0];
        set({ timePickerId: id, timePickerHour: h, timePickerMinute: m });
      },
      closeTimePicker: () => set({ timePickerId: null }),
      setTimePickerHour: (h) => set({ timePickerHour: ((h % 24) + 24) % 24 }),
      setTimePickerMinute: (m) => set({ timePickerMinute: ((m % 60) + 60) % 60 }),
      applyTimePreset: (h, m) => set({ timePickerHour: h, timePickerMinute: m }),
      confirmTimePicker: () => {
        setState((s) => {
          const id = s.timePickerId;
          const time = `${String(s.timePickerHour).padStart(2, '0')}:${String(s.timePickerMinute).padStart(2, '0')}`;
          return { ...s, previewTasks: s.previewTasks.map((p) => (p.id === id ? { ...p, time, needsConfirmation: false } : p)), timePickerId: null };
        });
      },

      toggleShowCompleted: () => set((s) => ({ showCompleted: !s.showCompleted })),
      handleFabClick: () => {
        if (state.listAddMode === 'text') { set({ listAddMode: null }); return; }
        set((s) => ({ listAddMenuOpen: !s.listAddMenuOpen }));
      },
      chooseListText: () => set({ listAddMenuOpen: false, listAddMode: 'text' }),
      chooseListMic: () => { set({ listAddMenuOpen: false, listAddMode: null }); api.openMic(); },
      closeListAddMenu: () => set({ listAddMenuOpen: false }),
      toggleListSearch: () => set((s) => ({ listSearchOpen: !s.listSearchOpen, listSearchQuery: s.listSearchOpen ? '' : s.listSearchQuery })),
      setListSearch: (q) => set({ listSearchQuery: q }),

      openAvatarMenu: () => set({ avatarMenuOpen: true }),
      closeAvatarMenu: () => set({ avatarMenuOpen: false }),
      openLogoutConfirm: () => set({ logoutConfirmOpen: true }),
      closeLogoutConfirm: () => set({ logoutConfirmOpen: false }),
      confirmLogout: () => { set({ logoutConfirmOpen: false, activeTab: 'home' }); onSignOut?.(); },
      openTaskDetail: (id) => set({ taskDetailId: id, shareSheetOpen: false }),
      closeTaskDetail: () => set({ taskDetailId: null, shareSheetOpen: false }),
      openShareSheet: () => set({ shareSheetOpen: true }),
      closeShareSheet: () => set({ shareSheetOpen: false }),
      openCategoryEditor: () => set({ categoryEditorOpen: true }),
      closeCategoryEditor: () => set({ categoryEditorOpen: false }),
      setCategoryColor: (name, color) => set((s) => ({ categories: { ...s.categories, [name]: color } })),

      goToToday: () => set({ calendarDayOffset: 0 }),
      setCalendarView: (v) => set({ calendarView: v }),
      setCalendarDay: (offset) => set({ calendarDayOffset: offset }),
      prevDay: () => set((s) => ({ calendarDayOffset: s.calendarDayOffset - 1 })),
      nextDay: () => set((s) => ({ calendarDayOffset: s.calendarDayOffset + 1 })),
      toggleAllDay: (id) => api.toggleComplete(id),
    };
    return api;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, onSignOut, reload, openPreviewFromText]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useV5(): V5Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useV5 must be used within V5Provider');
  return ctx;
}
