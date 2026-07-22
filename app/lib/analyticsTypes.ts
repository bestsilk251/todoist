export type AnalyticsTabKey = 'overview' | 'productivity' | 'categories';
export type AnalyticsMeasure = 'hours' | 'tasks';
export type AnalyticsPeriodPreset = 'week' | '30days' | 'month' | 'custom';

export interface AnalyticsDateRange {
  from: string;
  to: string;
}

export interface AnalyticsPeriod extends AnalyticsDateRange {
  previousFrom: string;
  previousTo: string;
}

export interface AnalyticsSummary {
  completedTasks: number;
  completedTasksChange: number | null;
  plannedMinutes: number;
  plannedMinutesChange: number | null;
  onTimeRate: number | null;
  onTimeRateChange: number | null;
  streakDays: number;
}

export interface AnalyticsDailyPoint {
  date: string;
  completedTasks: number;
  plannedMinutes: number;
}

export interface AnalyticsHeatmapPoint {
  weekday: number;
  hour: number;
  completedTasks: number;
  plannedMinutes: number;
  value: number;
}

export interface AnalyticsCategory {
  id: string;
  name: string;
  completedTasks: number;
  plannedMinutes: number;
  percentage: number;
}

export interface AnalyticsInsights {
  mostProductiveInterval: string | null;
  averageTasksPerDayInInterval: number | null;
  focusRate: number | null;
}

export interface AnalyticsResponse {
  period: AnalyticsPeriod;
  summary: AnalyticsSummary;
  daily: AnalyticsDailyPoint[];
  heatmap: AnalyticsHeatmapPoint[];
  categories: AnalyticsCategory[];
  insights: AnalyticsInsights;
}

export interface AnalyticsTaskFixture {
  completed_at: string | null;
  due_at?: string | null;
  duration_minutes?: number | null;
}
