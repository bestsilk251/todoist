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
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { V5Task, PreviewTask } from '../../lib/v5data';
import { categoryColors as seedCategories } from '../../theme';
import { getSupabaseClient } from '../../lib/supabase';
import {
  fetchTasks, insertTasks, setStatus, removeTask, parseTaskText,
  rowToV5, previewFromParsed, previewToInsert, isoOf, isoFromOffset,
  updateTaskFields as persistTaskFields,
} from '../../lib/tasksRepo';
import type { EditableTaskFields } from '../../lib/tasksRepo';
import { clockToMinutes, DEFAULT_TIMED_TASK_DURATION_MINUTES, durationBetweenClocks, extractScheduleFromText } from '../../lib/calendarMath';
import {
  hasSeenUsageGuide,
  markUsageGuideSeen,
  shouldAutoOpenUsageGuide,
  USAGE_GUIDE_PENDING_METADATA_KEY,
} from '../../lib/usageGuide';

export type TabKey = 'home' | 'list' | 'calendar' | 'analytics' | 'profile';
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
  timePickerTarget: 'preview' | 'task-start' | 'task-end' | null;
  categoryEditorOpen: boolean;
  showCompleted: boolean;
  showOverdue: boolean;
  showCancelled: boolean;
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
  shareSuccessName: string | null;
  sharedTaskCount: number;
  achievementsOpen: boolean;
  securityInfoOpen: boolean;
  aboutAppOpen: boolean;
  usageGuideOpen: boolean;
  calendarView: CalendarView;
  calendarDayOffset: number;
  openSwipeId: string | null;
  undoTaskId: string | null;
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
  timePickerTarget: null,
  categoryEditorOpen: false,
  showCompleted: false,
  showOverdue: false,
  showCancelled: false,
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
  shareSuccessName: null,
  sharedTaskCount: 0,
  achievementsOpen: false,
  securityInfoOpen: false,
  aboutAppOpen: false,
  usageGuideOpen: false,
  calendarView: 'day',
  calendarDayOffset: 0,
  openSwipeId: null,
  undoTaskId: null,
};

function buzz(pattern?: number | number[]) {
  try { Vibration.vibrate(pattern ?? 15); } catch { /* no-op on web */ }
}

function isOverdueNow(task: V5Task, now = new Date()): boolean {
  if (task.completed || task.cancelled || task.dueInDays == null) return false;
  if (task.dueInDays < 0) return true;
  if (task.dueInDays > 0 || !task.time) return false;
  const endMinutes = clockToMinutes(task.time) + (task.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES);
  return endMinutes < now.getHours() * 60 + now.getMinutes();
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
  cancelTask: (id: string) => void;
  restoreTask: (id: string) => void;
  setOpenSwipe: (id: string | null) => void;
  setTab: (t: TabKey) => void;
  submitQuick: () => void;
  openMic: () => void;
  togglePauseVoice: () => void;
  cancelVoice: () => void;
  finishVoice: () => void;
  scheduleFreeWindow: (iso?: string, time?: string, duration?: string) => void;
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
  openTaskTimePicker: (id: string) => void;
  openTaskEndTimePicker: (id: string) => void;
  closeTimePicker: () => void;
  setTimePickerHour: (h: number) => void;
  setTimePickerMinute: (m: number) => void;
  applyTimePreset: (h: number, m: number) => void;
  confirmTimePicker: () => void;
  toggleShowCompleted: () => void;
  toggleShowOverdue: () => void;
  toggleShowCancelled: () => void;
  handleFabClick: () => void;
  chooseListText: () => void;
  chooseListMic: () => void;
  closeListAddMenu: () => void;
  toggleListSearch: () => void;
  closeListSearch: () => void;
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
  shareTaskWithFriend: (name: string) => void;
  updateTask: (id: string, fields: EditableTaskFields) => void;
  openAchievements: () => void;
  closeAchievements: () => void;
  openSecurityInfo: () => void;
  closeSecurityInfo: () => void;
  openAboutApp: () => void;
  closeAboutApp: () => void;
  openUsageGuide: () => void;
  closeUsageGuide: () => void;
  openCategoryEditor: () => void;
  closeCategoryEditor: () => void;
  setCategoryColor: (name: string, color: string) => void;
  createCategory: (name: string, color: string) => boolean;
  reorderTaskToTop: (id: string) => void;
  undoLastComplete: () => void;
  dismissUndo: () => void;
  goToToday: () => void;
  setCalendarView: (v: CalendarView) => void;
  setCalendarDay: (offset: number) => void;
  prevDay: () => void;
  nextDay: () => void;
  toggleAllDay: (id: string) => void;
}

const Ctx = createContext<V5Store | null>(null);

export interface UserProfile {
  id?: string;
  name: string;
  fullName: string;
  email: string;
  initials: string;
  usageGuidePending?: boolean;
}

export function V5Provider({ children, onSignOut, profile }: { children: React.ReactNode; onSignOut?: () => void; profile?: UserProfile }) {
  const guideIdentity = profile?.id || profile?.email || 'local';
  const categoryStorageKey = `voice-todo:category-colors:${profile?.email || 'local'}`;
  const taskOrderStorageKey = `voice-todo:task-order:${profile?.email || 'local'}`;
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
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = null;
  }, []);

  const startSilenceTimer = useCallback((onSilence: () => void) => {
    clearSilenceTimer();
    silenceTimer.current = setTimeout(() => {
      if (!finishedRef.current && !pausedRef.current) onSilence();
    }, 5000);
  }, [clearSilenceTimer]);

  const set: V5Store['set'] = (patch) =>
    setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(categoryStorageKey).then((raw) => {
      if (!active || !raw) return;
      try {
        const stored = JSON.parse(raw) as Record<string, unknown>;
        const valid: Record<string, string> = {};
        Object.entries(stored).forEach(([name, color]) => {
          if (name && typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) valid[name] = color;
        });
        setState((current) => ({ ...current, categories: { ...current.categories, ...valid } }));
      } catch { /* ignore malformed local preferences */ }
    }).catch(() => { /* keep the default palette */ });
    return () => { active = false; };
  }, [categoryStorageKey]);

  useEffect(() => {
    if (!profile?.usageGuidePending) return undefined;
    let active = true;
    hasSeenUsageGuide(guideIdentity)
      .then((seen) => {
        if (active && shouldAutoOpenUsageGuide(true, seen)) {
          setState((current) => ({ ...current, usageGuideOpen: true }));
        }
      })
      .catch(() => { /* onboarding remains available from the profile */ });
    return () => { active = false; };
  }, [guideIdentity, profile?.usageGuidePending]);

  const reload = useCallback(async () => {
    try {
      const [rows, storedOrder] = await Promise.all([fetchTasks(), AsyncStorage.getItem(taskOrderStorageKey)]);
      const today = new Date();
      const tasks = rows.map((r) => rowToV5(r, today));
      let order: string[] = [];
      try { order = storedOrder ? JSON.parse(storedOrder) as string[] : []; } catch { order = []; }
      const positions = new Map(order.map((id, index) => [id, index]));
      tasks.sort((a, b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER));
      setState((s) => ({ ...s, tasks, loading: false }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [taskOrderStorageKey]);

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
      if (undoTimer.current) clearTimeout(undoTimer.current);
      clearSilenceTimer();
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      try { if (channel) getSupabaseClient().removeChannel(channel); } catch { /* ignore */ }
    };
  }, [reload, clearSilenceTimer]);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const win = globalThis as any;
    if (win.location?.pathname !== '/') {
      win.history?.replaceState?.(null, '', '/');
    }
    return undefined;
  }, []);

  const openPreviewFromText = useCallback(async (text: string) => {
    const parsed = await parseTaskText(text);
    const inferred = extractScheduleFromText(text);
    const items: PreviewTask[] = parsed.length
      ? parsed.map((p) => previewFromParsed(p, 'p' + nextPreviewId.current++))
      : [{
          id: 'p' + nextPreviewId.current++,
          title: text,
          iso: isoOf(new Date()),
          time: inferred?.startTime ?? '',
          duration: inferred ? `${inferred.durationMinutes} хв` : '',
          category: 'Особисте',
          important: false,
          needsConfirmation: false,
        }];
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
        const completedAt = nextDone ? new Date().toISOString() : null;
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, completed: nextDone, cancelled: false, completedAt, overdue: nextDone ? false : isOverdueNow({ ...x, completed: false, cancelled: false }) } : x)),
          openSwipeId: s.openSwipeId === id ? null : s.openSwipeId,
          undoTaskId: nextDone ? id : (s.undoTaskId === id ? null : s.undoTaskId),
        }));
        if (undoTimer.current) clearTimeout(undoTimer.current);
        if (nextDone) undoTimer.current = setTimeout(() => set({ undoTaskId: null }), 5000);
        setStatus(id, nextDone ? 'done' : 'pending').catch(() => { reload(); });
      },
      deleteTask: (id) => {
        setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id), openSwipeId: null }));
        removeTask(id).catch(() => { reload(); });
      },
      cancelTask: (id) => {
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, completed: false, cancelled: true, completedAt: null, overdue: false } : x)),
          openSwipeId: null,
          undoTaskId: s.undoTaskId === id ? null : s.undoTaskId,
        }));
        buzz(20);
        setStatus(id, 'cancelled').catch(() => { reload(); });
      },
      restoreTask: (id) => {
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((x) => {
            if (x.id !== id) return x;
            const restored = { ...x, completed: false, cancelled: false, completedAt: null };
            return { ...restored, overdue: isOverdueNow(restored) };
          }),
        }));
        setStatus(id, 'pending').catch(() => { reload(); });
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
        clearSilenceTimer();
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
              startSilenceTimer(() => api.finishVoice());
            };
            rec.onerror = () => { /* keep overlay; user decides */ };
            rec.onend = () => { if (!finishedRef.current && !pausedRef.current) { try { rec.start(); } catch { /* ignore */ } } };
            recognitionRef.current = rec;
            rec.start();
          } catch { recognitionRef.current = null; }
        }

        startSilenceTimer(() => api.finishVoice());

        recordTimer.current = setInterval(() => {
          if (pausedRef.current) return;
          recordSecondsRef.current += 1;
          set({ recordSeconds: recordSecondsRef.current });
        }, 1000);
      },
      togglePauseVoice: () => {
        const nextPaused = !pausedRef.current;
        pausedRef.current = nextPaused;
        if (nextPaused) {
          clearSilenceTimer();
          try { recognitionRef.current?.stop(); } catch { /* ignore */ }
        } else {
          try { recognitionRef.current?.start(); } catch { /* ignore */ }
          startSilenceTimer(() => api.finishVoice());
        }
        set({ isPaused: nextPaused });
      },
      cancelVoice: () => {
        finishedRef.current = true;
        if (recordTimer.current) clearInterval(recordTimer.current);
        clearSilenceTimer();
        try { recognitionRef.current?.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
        buzz(15);
        set({ voiceState: 'idle' });
      },
      finishVoice: () => {
        finishedRef.current = true;
        if (recordTimer.current) clearInterval(recordTimer.current);
        clearSilenceTimer();
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
      scheduleFreeWindow: (iso = isoOf(new Date()), time = '15:30', duration = '1 год 30 хв') => {
        const pt: PreviewTask = { id: 'p' + nextPreviewId.current++, title: 'Нова задача', iso, time, duration, category: 'Особисте', important: false, needsConfirmation: false };
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
        insertTasks(payloads)
          .then((rows) => {
            if (rows.length === 0) { reload(); return; }
            const now = new Date();
            set((current) => {
              const insertedIds = new Set(rows.map((row) => row.id));
              return {
                tasks: [
                  ...current.tasks.filter((task) => !insertedIds.has(task.id)),
                  ...rows.map((row) => rowToV5(row, now)),
                ],
              };
            });
          })
          .catch(() => { reload(); });
      },

      openTimePicker: (id) => {
        const p = state.previewTasks.find((t) => t.id === id);
        const [h, m] = p && p.time ? p.time.split(':').map(Number) : [9, 0];
        set({ timePickerId: id, timePickerTarget: 'preview', timePickerHour: h, timePickerMinute: m });
      },
      openTaskTimePicker: (id) => {
        const task = state.tasks.find((item) => item.id === id);
        const now = new Date();
        const [h, m] = task?.time
          ? task.time.split(':').map(Number)
          : [now.getHours(), Math.floor(now.getMinutes() / 5) * 5];
        set({ timePickerId: id, timePickerTarget: 'task-start', timePickerHour: h, timePickerMinute: m });
      },
      openTaskEndTimePicker: (id) => {
        const task = state.tasks.find((item) => item.id === id);
        if (!task?.time) return;
        const [startHour, startMinute] = task.time.split(':').map(Number);
        const endMinutes = (startHour * 60 + startMinute + (task.durationMinutes ?? DEFAULT_TIMED_TASK_DURATION_MINUTES)) % (24 * 60);
        set({
          timePickerId: id,
          timePickerTarget: 'task-end',
          timePickerHour: Math.floor(endMinutes / 60),
          timePickerMinute: endMinutes % 60,
        });
      },
      closeTimePicker: () => set({ timePickerId: null, timePickerTarget: null }),
      setTimePickerHour: (h) => set({ timePickerHour: ((h % 24) + 24) % 24 }),
      setTimePickerMinute: (m) => set({ timePickerMinute: ((m % 60) + 60) % 60 }),
      applyTimePreset: (h, m) => set({ timePickerHour: h, timePickerMinute: m }),
      confirmTimePicker: () => {
        const id = state.timePickerId;
        if (!id) return;
        const time = `${String(state.timePickerHour).padStart(2, '0')}:${String(state.timePickerMinute).padStart(2, '0')}`;
        if (state.timePickerTarget === 'task-start') {
          api.updateTask(id, { time });
          set({ timePickerId: null, timePickerTarget: null });
          return;
        }
        if (state.timePickerTarget === 'task-end') {
          const task = state.tasks.find((item) => item.id === id);
          if (!task?.time) return;
          const durationMinutes = durationBetweenClocks(task.time, time);
          api.updateTask(id, { durationMinutes });
          set({ timePickerId: null, timePickerTarget: null });
          return;
        }
        set((current) => ({
          previewTasks: current.previewTasks.map((p) => (p.id === id ? {
            ...p,
            time,
            duration: p.duration || '1 год',
            needsConfirmation: false,
          } : p)),
          timePickerId: null,
          timePickerTarget: null,
        }));
      },

      toggleShowCompleted: () => set((s) => ({ showCompleted: !s.showCompleted })),
      toggleShowOverdue: () => set((s) => ({ showOverdue: !s.showOverdue })),
      toggleShowCancelled: () => set((s) => ({ showCancelled: !s.showCancelled })),
      handleFabClick: () => {
        if (state.listAddMode === 'text') { set({ listAddMode: null }); return; }
        set((s) => ({ listAddMenuOpen: !s.listAddMenuOpen }));
      },
      chooseListText: () => set({ listAddMenuOpen: false, listAddMode: 'text' }),
      chooseListMic: () => { set({ listAddMenuOpen: false, listAddMode: null }); api.openMic(); },
      closeListAddMenu: () => set({ listAddMenuOpen: false }),
      toggleListSearch: () => set((s) => ({ listSearchOpen: !s.listSearchOpen, listSearchQuery: s.listSearchOpen ? '' : s.listSearchQuery })),
      closeListSearch: () => set({ listSearchOpen: false, listSearchQuery: '' }),
      setListSearch: (q) => set({ listSearchQuery: q }),

      openAvatarMenu: () => set({ avatarMenuOpen: true }),
      closeAvatarMenu: () => set({ avatarMenuOpen: false }),
      openLogoutConfirm: () => set({ logoutConfirmOpen: true }),
      closeLogoutConfirm: () => set({ logoutConfirmOpen: false }),
      confirmLogout: () => { set({ logoutConfirmOpen: false, activeTab: 'home' }); onSignOut?.(); },
      openTaskDetail: (id) => set({ taskDetailId: id, shareSheetOpen: false }),
      closeTaskDetail: () => set({ taskDetailId: null, shareSheetOpen: false }),
      openShareSheet: () => set({ shareSheetOpen: true, shareSuccessName: null }),
      closeShareSheet: () => set({ shareSheetOpen: false, shareSuccessName: null }),
      shareTaskWithFriend: (name) => set((current) => ({
        sharedTaskCount: current.sharedTaskCount + 1,
        shareSuccessName: name,
      })),
      updateTask: (id, fields) => {
        const currentTask = state.tasks.find((task) => task.id === id);
        const normalizedFields: EditableTaskFields = fields.time && fields.durationMinutes === undefined && currentTask?.durationMinutes == null
          ? { ...fields, durationMinutes: DEFAULT_TIMED_TASK_DURATION_MINUTES }
          : fields;
        setState((current) => ({
          ...current,
          tasks: current.tasks.map((task) => task.id === id ? { ...task, ...normalizedFields } : task),
        }));
        persistTaskFields(id, normalizedFields).catch(() => { reload(); });
      },
      openAchievements: () => set({ achievementsOpen: true }),
      closeAchievements: () => set({ achievementsOpen: false }),
      openSecurityInfo: () => set({ securityInfoOpen: true }),
      closeSecurityInfo: () => set({ securityInfoOpen: false }),
      openAboutApp: () => set({ aboutAppOpen: true }),
      closeAboutApp: () => set({ aboutAppOpen: false }),
      openUsageGuide: () => set({ usageGuideOpen: true }),
      closeUsageGuide: () => {
        set({ usageGuideOpen: false });
        markUsageGuideSeen(guideIdentity).catch(() => { /* do not block closing the guide */ });
        if (profile?.usageGuidePending) {
          getSupabaseClient().auth.updateUser({
            data: { [USAGE_GUIDE_PENDING_METADATA_KEY]: false },
          }).catch(() => { /* local persistence still prevents another display on this device */ });
        }
      },
      openCategoryEditor: () => set({ categoryEditorOpen: true }),
      closeCategoryEditor: () => set({ categoryEditorOpen: false }),
      setCategoryColor: (name, color) => {
        setState((current) => {
          const categories = { ...current.categories, [name]: color };
          AsyncStorage.setItem(categoryStorageKey, JSON.stringify(categories)).catch(() => { /* keep the in-memory choice */ });
          return { ...current, categories };
        });
      },
      createCategory: (rawName, color) => {
        const name = rawName.trim();
        if (!name || state.categories[name]) return false;
        setState((current) => {
          const categories = { ...current.categories, [name]: color };
          AsyncStorage.setItem(categoryStorageKey, JSON.stringify(categories)).catch(() => { /* keep local state */ });
          return { ...current, categories };
        });
        return true;
      },
      reorderTaskToTop: (id) => {
        setState((current) => {
          const task = current.tasks.find((item) => item.id === id);
          if (!task) return current;
          const tasks = [task, ...current.tasks.filter((item) => item.id !== id)];
          AsyncStorage.setItem(taskOrderStorageKey, JSON.stringify(tasks.map((item) => item.id))).catch(() => { /* keep local order */ });
          return { ...current, tasks };
        });
        buzz(20);
      },
      undoLastComplete: () => {
        const id = state.undoTaskId;
        if (!id) return;
        if (undoTimer.current) clearTimeout(undoTimer.current);
        setState((current) => ({
          ...current,
          undoTaskId: null,
          tasks: current.tasks.map((task) => task.id === id ? {
            ...task,
            completed: false,
            cancelled: false,
            completedAt: null,
            overdue: isOverdueNow({ ...task, completed: false, cancelled: false }),
          } : task),
        }));
        setStatus(id, 'pending').catch(() => { reload(); });
      },
      dismissUndo: () => {
        if (undoTimer.current) clearTimeout(undoTimer.current);
        set({ undoTaskId: null });
      },

      goToToday: () => set({ calendarDayOffset: 0, calendarView: 'day' }),
      setCalendarView: (v) => set({ calendarView: v }),
      setCalendarDay: (offset) => set({ calendarDayOffset: offset }),
      prevDay: () => set((s) => ({ calendarDayOffset: s.calendarDayOffset - 1 })),
      nextDay: () => set((s) => ({ calendarDayOffset: s.calendarDayOffset + 1 })),
      toggleAllDay: (id) => api.toggleComplete(id),
    };
    return api;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, onSignOut, reload, openPreviewFromText, clearSilenceTimer, startSilenceTimer, categoryStorageKey, taskOrderStorageKey, guideIdentity, profile?.usageGuidePending]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useV5(): V5Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useV5 must be used within V5Provider');
  return ctx;
}
