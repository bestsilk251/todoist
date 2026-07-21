import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getSupabaseClient } from '../lib/supabase';
import { signOut, useAuth } from '../lib/useAuth';
import { useTasks } from '../lib/useTasks';
import { insertTasks, updateTask, type NewTaskInput } from '../lib/taskActions';
import { addDaysIso } from '../lib/dateTime';
import HomeScreen from './HomeScreen';
import ListScreen from './ListScreen';
import CalendarScreen from './CalendarScreen';
import ProfileScreen from './ProfileScreen';
import BottomNav from '../components/BottomNav';
import VoiceOverlay from '../components/VoiceOverlay';
import PreviewSheet, { type PreviewTask } from '../components/PreviewSheet';
import type { TabKey, Task, ParsedTask } from '../types';
import { colors } from '../theme';

const WEEKDAYS = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота'];
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

function dateLabelToday(): string {
  const d = new Date();
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${WEEKDAYS[d.getDay()]}`;
}

async function parseText(text: string): Promise<ParsedTask[]> {
  const { data, error } = await getSupabaseClient().functions.invoke('parse-task', {
    body: {
      text,
      currentDate: new Date().toISOString().slice(0, 10),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  if (error) throw error;
  return data.tasks as ParsedTask[];
}

export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const { groups, nearest, completed, total, toggle, remove, load } = useTasks();

  const email = session?.user?.email ?? '';
  const namePart = email ? email.split('@')[0] : 'друже';
  const initials = (email ? email.slice(0, 2) : '🙂').toUpperCase();

  const [tab, setTab] = useState<TabKey>('home');
  const [quickText, setQuickText] = useState('');
  const [quickFocused, setQuickFocused] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [preview, setPreview] = useState<PreviewTask[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sourceText, setSourceText] = useState('');

  function toPreview(parsed: ParsedTask[]): PreviewTask[] {
    return parsed.map((t, i) => ({
      key: `p${Date.now()}_${i}`,
      title: t.title,
      date: t.date,
      time: t.time,
      is_all_day: t.is_all_day,
      needs_confirmation: t.needs_confirmation,
      category: 'Особисте',
      important: false,
    }));
  }

  async function runParse(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSourceText(trimmed);
    try {
      const parsed = await parseText(trimmed);
      setPreview(toPreview(parsed));
      setPreviewOpen(true);
    } catch {
      // Fallback: one unparsed task the user can confirm.
      setPreview([
        {
          key: `p${Date.now()}`,
          title: trimmed,
          date: null,
          time: null,
          is_all_day: true,
          needs_confirmation: true,
          category: 'Особисте',
          important: false,
        },
      ]);
      setPreviewOpen(true);
    }
  }

  async function submitQuick() {
    const text = quickText;
    setQuickText('');
    await runParse(text);
  }

  function handleVoiceFinish(transcript: string) {
    setVoiceVisible(false);
    if (transcript) runParse(transcript);
  }

  function deletePreview(key: string) {
    setPreview((prev) => prev.filter((p) => p.key !== key));
  }

  function resolvePreview(key: string) {
    // Simple resolution: default the ambiguous time to 19:00 and clear the flag.
    setPreview((prev) =>
      prev.map((p) => (p.key === key ? { ...p, time: '19:00', is_all_day: false, needs_confirmation: false } : p)),
    );
  }

  async function savePreview() {
    const rows: NewTaskInput[] = preview.map((p) => ({
      title: p.title,
      due_date: p.date,
      due_time: p.time,
      is_all_day: p.is_all_day,
      needs_confirmation: p.needs_confirmation,
      category: p.category,
      important: p.important,
      source_text: sourceText,
    }));
    try {
      await insertTasks(rows);
    } catch {
      /* surfaced by reload */
    }
    setPreviewOpen(false);
    setPreview([]);
    setTab('list');
    load();
  }

  async function postpone(task: Task) {
    const base = task.due_date ?? new Date().toISOString().slice(0, 10);
    await updateTask(task.id, { due_date: addDaysIso(base, 1) });
    load();
  }

  const label = dateLabelToday();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {tab === 'home' && (
          <HomeScreen
            userName={namePart}
            dateLabel={label}
            completed={completed}
            total={total}
            nearest={nearest}
            quickText={quickText}
            quickFocused={quickFocused}
            onQuickChange={setQuickText}
            onQuickFocus={() => setQuickFocused(true)}
            onQuickBlur={() => setQuickFocused(false)}
            onSubmitQuick={submitQuick}
            onOpenMic={() => setVoiceVisible(true)}
            onGoToList={() => setTab('list')}
            onGoToProfile={() => setTab('profile')}
            topInset={insets.top + 8}
          />
        )}
        {tab === 'list' && (
          <ListScreen
            dateLabel={label}
            groups={groups}
            completed={completed}
            total={total}
            onToggle={toggle}
            onDelete={remove}
            onPostpone={postpone}
            onOpen={(task) => navigation.navigate('Edit', { task })}
            onGoToProfile={() => setTab('profile')}
            topInset={insets.top + 8}
          />
        )}
        {tab === 'calendar' && <CalendarScreen />}
        {tab === 'profile' && (
          <ProfileScreen
            email={email}
            initials={initials}
            name={namePart}
            completed={completed}
            onSignOut={signOut}
            topInset={insets.top + 8}
          />
        )}
      </View>

      <BottomNav active={tab} onChange={setTab} bottomInset={insets.bottom} />

      <VoiceOverlay visible={voiceVisible} onCancel={() => setVoiceVisible(false)} onFinish={handleVoiceFinish} />

      <PreviewSheet
        visible={previewOpen}
        tasks={preview}
        onDelete={deletePreview}
        onResolve={resolvePreview}
        onCancel={() => {
          setPreviewOpen(false);
          setPreview([]);
        }}
        onSave={savePreview}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
});
