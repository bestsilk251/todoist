# Voice Todo — Design Context

This document is the authoritative design reference for the current v5 UI/UX direction. Read it before changing screens, components, interaction patterns, visual tokens, or animations.

## Product and visual direction

The product is a Ukrainian task-management app based on the `Task Manager App v5.dc.html` design prototype.

- Dark minimalist interface.
- Background: `#0B0B0D`.
- Primary red accent: `#E53935`.
- Four tabs: `Задачи`, `Список`, `Календар`, `Профіль`.
- Red is reserved for overdue or urgent meaning and high-value accents.
- Categories use a muted purple, blue, and green palette.
- Priority is communicated with left-edge indicators rather than excessive color.
- Completed tasks use 50% opacity and strikethrough text.

## Established interaction decisions

- Home uses a centered quick-add container that unifies text and microphone input.
- List uses a compact floating add menu with an expand animation and text/microphone choices.
- Voice confirmation uses a wheel-style time picker.
- Calendar day view uses a timeline scale of `2px` per minute so 30-minute events remain legible.
- The current-time indicator is a `1px` red line at 75% opacity with a small dot.
- Calendar gridlines appear every 30 minutes.
- Calendar may suggest free time windows.
- Week and month views surface priority tasks.
- Profile supports avatar editing, richer statistics, badges, levels, and grouped settings.

## Current target state

### Home

- Greeting positioned higher in the composition.
- Three nearest tasks with muted category dots.
- Priority reminder banner.
- Unified quick-add container.
- Progress ring.
- Statistics card.

### List

- Groups: Today, Tomorrow, Later, Overdue, Completed.
- Swipe actions, including delete.
- Muted category tags and a left priority bar.
- Compact floating add menu with text and microphone choices.
- Search and filter header.

### Calendar

- Day, week, and month views.
- All-day section.
- Day-filtered hourly timeline.
- Current-time red line with dot.
- Free-window cards.
- Statistics footer.

### Voice mode

- Recording timer.
- Partial transcript.
- Pause control that freezes the recording animation.
- Processing state.
- Haptic feedback.
- Soft backdrop.
- Task confirmation with inline editing.

### Task detail

- Full edit screen for flag, title, date, time, category, and priority.
- Wheel time picker with hour and minute columns plus presets.
- Share sheet for friend, shared task, and contacts.
- Delete action.

### Profile

- Level card with XP and badges.
- Grouped settings including timezone, first day of week, and export.
- Version footer.

## Design QA priorities

- Preserve the established dark/red visual language.
- Keep destructive, overdue, urgent, category, and priority meanings visually distinct.
- Do not replace the unified input patterns with unrelated controls.
- Preserve visible states for loading, processing, paused recording, completion, and failure.
- Test swipe gestures against vertical scrolling and screen-edge gestures.
- Refine haptic timing so feedback matches the completed action rather than merely the initial touch.
- Validate small-screen layout, long Ukrainian text, empty groups, and dense task lists.

## Remaining polish

- Minor visual refinements.
- Haptic timing polish.
- Swipe and scroll edge-case testing.

## Source prototype

The original main design working copy was named `Task Manager App v5.dc.html`. It is a design reference; the current repository implements the app in React Native/Expo under `app/`.
