import React from 'react';
import { useWindowDimensions } from 'react-native';
import type { AnalyticsTabKey } from '../../../lib/analyticsTypes';
import { SegmentedControl } from '../ui';

const tabs: { key: AnalyticsTabKey; label: string }[] = [
  { key: 'overview', label: 'Огляд' },
  { key: 'productivity', label: 'Продуктивність' },
  { key: 'categories', label: 'Категорії' },
];

export default function AnalyticsTabs({ value, onChange }: { value: AnalyticsTabKey; onChange: (value: AnalyticsTabKey) => void }) {
  const compact = useWindowDimensions().width < 360;
  return <SegmentedControl items={tabs.map((tab) => ({ value: tab.key, label: tab.label }))} value={value} onChange={onChange} compact={compact} />;
}
