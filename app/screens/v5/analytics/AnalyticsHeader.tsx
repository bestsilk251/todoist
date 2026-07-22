import React from 'react';
import { palette } from '../../../theme';
import { AnalyticsIcon } from '../../../components/icons';
import { ScreenHeader } from '../ui';

export default function AnalyticsHeader() {
  return <ScreenHeader icon={<AnalyticsIcon size={24} color={palette.accent} />} title="Аналітика" />;
}
