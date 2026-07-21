/** A task as returned by the parse-task Edge Function (not yet saved). */
export interface ParsedTask {
  title: string;
  date: string | null;
  time: string | null;
  is_all_day: boolean;
  needs_confirmation: boolean;
}

/** A task as stored in Postgres. */
export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  is_all_day: boolean;
  needs_confirmation: boolean;
  status: 'pending' | 'done';
  category: string;
  important: boolean;
  source_text: string | null;
  created_at: string;
  updated_at: string;
}

export type TabKey = 'home' | 'list' | 'calendar' | 'profile';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Edit: { task: Task };
};
