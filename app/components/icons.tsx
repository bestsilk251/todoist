/**
 * The v5 icon set, ported one-for-one from the design's inline SVGs to
 * react-native-svg. Every icon accepts `size` and `color`; `color` maps to
 * `currentColor` in the original markup (stroke or fill as appropriate).
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';
import { palette } from '../theme';

export interface IconProps {
  size?: number;
  color?: string;
}

const S = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24' });

export function HomeIcon({ size = 20, color = palette.textFaint }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M4 11.5 12 4l8 7.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ListIcon({ size = 20, color = palette.textFaint }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Rect x={5} y={4} width={14} height={17} rx={2.5} stroke={color} strokeWidth={1.7} />
      <Rect x={9} y={2.5} width={6} height={3} rx={1.2} fill={color} />
      <Path d="M8 10.5l1.4 1.4L12 9.2" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={13.5} y1={10.5} x2={17} y2={10.5} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx={8.5} cy={15} r={1} fill={color} />
      <Line x1={13.5} y1={15} x2={17} y2={15} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M8 19.2l1.4 1.4L12 17.9" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 20, color = palette.textFaint }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Rect x={3.5} y={5} width={17} height={15} rx={3} stroke={color} strokeWidth={1.7} />
      <Line x1={3.5} y1={9.5} x2={20.5} y2={9.5} stroke={color} strokeWidth={1.7} />
      <Line x1={8} y1={3} x2={8} y2={6.5} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Line x1={16} y1={3} x2={16} y2={6.5} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Rect x={7} y={12} width={2.6} height={2.6} rx={0.8} fill={color} />
      <Rect x={11} y={12} width={2.6} height={2.6} rx={0.8} fill={color} />
      <Rect x={15} y={12} width={2.6} height={2.6} rx={0.8} fill={color} />
      <Rect x={7} y={16} width={2.6} height={2.6} rx={0.8} fill={color} />
    </Svg>
  );
}

/** Simplified calendar (no day dots) used in the task-detail row. */
export function CalendarSlimIcon({ size = 17, color = palette.accent }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Rect x={3.5} y={5} width={17} height={15} rx={3} stroke={color} strokeWidth={1.6} />
      <Line x1={3.5} y1={9.5} x2={20.5} y2={9.5} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function ProfileIcon({ size = 20, color = palette.textFaint }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} strokeDasharray="50 6" />
      <Circle cx={12} cy={10} r={3.4} stroke={color} strokeWidth={1.7} />
      <Path d="M6.5 19c1.2-2.6 3.2-4 5.5-4s4.3 1.4 5.5 4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function AnalyticsIcon({ size = 20, color = palette.textFaint }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
      <Path d="M6.5 15.5 10 12l2.5 2.2L18 8.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={18} cy={8.5} r={1.3} fill={color} />
    </Svg>
  );
}

export function TargetIcon({ size = 20, color = palette.textFaint }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={12} r={4.5} stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={12} r={1.6} fill={color} />
      <Path d="M14.5 9.5 20 4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function InfoIcon({ size = 16, color = palette.textMuted }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={1.7} />
      <Circle cx={12} cy={8} r={1.1} fill={color} />
      <Line x1={12} y1={11} x2={12} y2={16} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 14, color = palette.textMuted }: IconProps) {
  return <Svg {...S(size)} fill="none"><Path d="m6 9 6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

export function ChevronRightIcon({ size = 17, color = palette.textSecondary }: IconProps) {
  return <Svg {...S(size)} fill="none"><Path d="m9 5 7 7-7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

/** The detailed two-tone microphone used in the home quick-add row. */
export function MicDetailedIcon({ size = 20 }: { size?: number }) {
  const w = palette.white;
  const r = palette.accent;
  return (
    <Svg {...S(size)} fill="none">
      <Rect x={8} y={2.5} width={8} height={12} rx={4} stroke={w} strokeWidth={1.6} />
      <Line x1={9.5} y1={7} x2={14.5} y2={7} stroke={w} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={9.5} y1={9.5} x2={14.5} y2={9.5} stroke={w} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M12.5 4.5 Q14 5.2 14 7" stroke={r} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M5 12 A7 7 0 0 0 19 12" stroke={w} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={12} y1={19} x2={12} y2={16} stroke={w} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={9.5} y1={19.5} x2={14.5} y2={19.5} stroke={r} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={3.2} y1={10.2} x2={3.2} y2={12.8} stroke={r} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={1.2} y1={10.8} x2={1.2} y2={12.2} stroke={r} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={20.8} y1={10.2} x2={20.8} y2={12.8} stroke={r} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={22.8} y1={10.8} x2={22.8} y2={12.2} stroke={r} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

/** Simple mic outline (list FAB + voice overlay). */
export function MicSimpleIcon({ size = 19, color = palette.white }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Rect x={8} y={2.5} width={8} height={12} rx={4} stroke={color} strokeWidth={1.6} />
      <Path d="M5 12 A7 7 0 0 0 19 12" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={12} y1={19} x2={12} y2={16} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/** Filled mic used inside the pulsing voice orb. */
export function MicFilledIcon({ size = 26, color = palette.white }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Rect x={8} y={2.5} width={8} height={12} rx={4} fill={color} />
      <Path d="M5 12 A7 7 0 0 0 19 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={12} y1={19} x2={12} y2={16} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={9} y1={19.5} x2={15} y2={19.5} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function TextLinesIcon({ size = 18, color = palette.white }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M4 6h16M4 12h16M4 18h10" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = palette.textMuted }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={1.7} />
      <Line x1={16.2} y1={16.2} x2={21} y2={21} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

/** Funnel / category-color editor button. */
export function FunnelIcon({ size = 18, color = palette.textMuted }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M4 5h16l-6 8v6l-4 2v-8L4 5Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function BellIcon({ size = 17, color = palette.accent }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M12 3a7 7 0 0 0-7 7v3.4l-1.4 2.6h16.8L19 13.4V10a7 7 0 0 0-7-7Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/** Priority flag. Outline by default; pass filled for the detail header. */
export function FlagIcon({ size = 16, color = palette.accent, filled = false }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <Svg {...S(size)} fill="none">
        <Path d="M6 3v18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M6 4h13l-2.6 4L19 12H6" fill={color} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M5 3v18" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M5 4h11l-2.2 3.5L16 11H5" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function ClockIcon({ size = 17, color = palette.accent }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.6} />
      <Path d="M12 7v5l3.2 2" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 17, color = palette.textSecondary }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DotsVerticalIcon({ size = 17, color = palette.textSecondary }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={12} cy={5} r={1.6} fill={color} />
      <Circle cx={12} cy={12} r={1.6} fill={color} />
      <Circle cx={12} cy={19} r={1.6} fill={color} />
    </Svg>
  );
}

export function StarIcon({ size = 20, color = palette.white }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M12 2.5l2.7 6 6.5.6-4.9 4.4 1.5 6.4L12 16.6l-5.8 3.3 1.5-6.4-4.9-4.4 6.5-.6L12 2.5Z" fill={color} />
    </Svg>
  );
}

export function FireIcon({ size = 14, color = palette.badgeStreak }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M12 2.5c1 3 .5 4.5-1 6-1.7 1.7-2.5 3.2-2.5 5A5.5 5.5 0 0 0 14 19a4.2 4.2 0 0 0 2.2-7.8c.4 1.6-.2 2.6-1 3.1.6-2.6-.3-4.2-3.2-11.8Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 14, color = palette.badgeGreen }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
      <Path d="M8.5 12.3l2.3 2.3 4.7-4.9" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShareArrowIcon({ size = 16, color = palette.white }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M12 16V4M8 8l4-4 4 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PersonPlusIcon({ size = 19, color = palette.textSecondary }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={9} cy={8} r={3} stroke={color} strokeWidth={1.6} />
      <Path d="M3.5 19c1-3 2.8-4.6 5.5-4.6s4.5 1.6 5.5 4.6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M16 8h5M18.5 5.5v5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function PeopleIcon({ size = 17, color = palette.badgePurple }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={8.5} cy={8} r={2.6} stroke={color} strokeWidth={1.6} />
      <Circle cx={16} cy={9.5} r={2.2} stroke={color} strokeWidth={1.6} />
      <Path d="M3 19c1-2.8 2.7-4.2 5.5-4.2s4.5 1.4 5.5 4.2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M14 15.4c2.3.2 3.6 1.5 4.4 3.6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function PersonHeadIcon({ size = 16, color = palette.badgePurple }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Circle cx={12} cy={9} r={3.4} stroke={color} strokeWidth={1.6} />
      <Path d="M6 19c1.2-3 3.3-4.6 6-4.6s4.8 1.6 6 4.6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function PencilIcon({ size = 13, color = palette.white }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5Z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    </Svg>
  );
}

export function LogoutIcon({ size = 15, color = palette.logout }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M14 8l4 4-4 4M18 12H9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VideoIcon({ size = 14, color = palette.textMuted }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Rect x={2} y={6} width={13} height={12} rx={2.4} stroke={color} strokeWidth={1.6} />
      <Path d="M15 10l6-3v10l-6-3Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function AttachmentIcon({ size = 14, color = palette.textMuted }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Path d="M8 12.5l6.5-6.5a3 3 0 0 1 4.24 4.24L11.5 17a1.7 1.7 0 0 1-2.4-2.4l6-6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 15, color = palette.white }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Line x1={12} y1={5} x2={12} y2={19} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={5} y1={12} x2={19} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function HamburgerDotsIcon({ size = 15, color = palette.textMuted }: IconProps) {
  return (
    <Svg {...S(size)} fill="none">
      <Line x1={4} y1={7} x2={20} y2={7} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={4} y1={12} x2={20} y2={12} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={4} y1={17} x2={20} y2={17} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={9} cy={7} r={2} fill={palette.bg} stroke={color} strokeWidth={1.4} />
      <Circle cx={15} cy={12} r={2} fill={palette.bg} stroke={color} strokeWidth={1.4} />
      <Circle cx={9} cy={17} r={2} fill={palette.bg} stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}

/** Chevron used as a settings-row disclosure caret (rotated square corner). */
export function CaretRight({ size = 7, color = palette.textFaint }: IconProps) {
  return (
    <Svg width={size + 4} height={size + 4} viewBox="0 0 12 12" fill="none">
      <Path d="M4 2l5 4-5 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export { G };
