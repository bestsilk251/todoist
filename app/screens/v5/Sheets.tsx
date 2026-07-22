/** Secondary overlays: category-color editor, avatar menu, logout confirm,
 * share sheet. Each returns null when its state flag is off. */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { palette, withAlpha, categorySwatches } from '../../theme';
import { useV5 } from './store';
import { PersonPlusIcon, PeopleIcon, PlusIcon, CaretRight } from '../../components/icons';
import { calculateStreak } from '../../lib/analyticsMath';
import { SegmentedControl } from './ui';
import { useAppTheme } from '../../ThemeProvider';

const FRIENDS = [
  { name: 'Олена Коваль', email: 'olena.koval@example.com' },
  { name: 'Андрій Бондар', email: 'andrii.bondar@example.com' },
  { name: 'Марія Левченко', email: 'maria.levchenko@example.com' },
  { name: 'Тарас Мельник', email: 'taras.melnyk@example.com' },
  { name: 'Софія Романюк', email: 'sofia.romaniuk@example.com' },
  { name: 'Денис Шевченко', email: 'denys.shevchenko@example.com' },
  { name: 'Ірина Савчук', email: 'iryna.savchuk@example.com' },
  { name: 'Максим Кравець', email: 'maksym.kravets@example.com' },
];

function initials(name: string): string {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2);
}

export function CategoryEditor() {
  const s = useV5();
  const categoryNames = Object.keys(s.categories);
  const [selectedCategory, setSelectedCategory] = useState(categoryNames[0] ?? 'Робота');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (!s.categoryEditorOpen) return;
    const first = Object.keys(s.categories)[0] ?? 'Робота';
    setSelectedCategory(first);
    setCreatingCategory(false);
    setNewCategoryName('');
  }, [s.categoryEditorOpen]);

  if (!s.categoryEditorOpen) return null;
  const currentColor = s.categories[selectedCategory] ?? '#8C8C94';
  const recommendations = [
    { name: 'Робота', glyph: '▣', color: '#7657F6' },
    { name: "Здоров’я", glyph: '♥', color: '#52C7A5' },
    { name: 'Дім', glyph: '⌂', color: '#4E9DA6' },
    { name: 'Особисте', glyph: '●', color: '#6E8CB8' },
    { name: 'Навчання', glyph: '▤', color: '#E0AA32' },
    { name: 'Інше', glyph: '•••', color: '#8C8C94' },
  ];
  const chooseColor = (color: string) => {
    s.setCategoryColor(selectedCategory, color);
  };

  return (
    <Pressable onPress={s.closeCategoryEditor} style={styles.overlayEnd}>
      <Pressable onPress={() => {}} style={[styles.sheet, styles.categorySheet]}>
        <View style={styles.grabber} />
        <View style={styles.categoryHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Колір категорії</Text>
            <Text style={styles.subtitle}>Оберіть колір, який найкраще підходить для цієї категорії.</Text>
          </View>
          <Pressable onPress={s.closeCategoryEditor} style={styles.closeBtn}><Text style={styles.closeX}>✕</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.categoryContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.categorySectionLabel}>Категорія</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categorySelector}>
            {categoryNames.map((name) => {
              const active = name === selectedCategory;
              const color = s.categories[name] ?? palette.textFaint;
              return (
                <Pressable key={name} onPress={() => setSelectedCategory(name)} style={[styles.categoryChoice, active && { borderColor: color, backgroundColor: withAlpha(color, 0.14) }]}>
                  <View style={[styles.categoryChoiceDot, { backgroundColor: color }]} />
                  <Text style={[styles.categoryChoiceText, active && { color: palette.text }]}>{name || 'Без категорії'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {creatingCategory ? (
            <View style={styles.createCategoryRow}>
              <TextInput
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Назва нової категорії"
                placeholderTextColor={palette.textFaint}
                autoFocus
                style={styles.createCategoryInput}
              />
              <Pressable
                onPress={() => {
                  const name = newCategoryName.trim();
                  if (s.createCategory(name, '#7657F6')) {
                    setSelectedCategory(name);
                    setNewCategoryName('');
                    setCreatingCategory(false);
                  }
                }}
                disabled={!newCategoryName.trim()}
                style={[styles.createCategoryButton, !newCategoryName.trim() && { opacity: 0.4 }]}
              ><PlusIcon size={15} color={palette.white} /></Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setCreatingCategory(true)} style={styles.addCategoryButton}>
              <PlusIcon size={13} color={palette.accent} />
              <Text style={styles.addCategoryText}>Створити власну категорію</Text>
            </Pressable>
          )}

          <>
              <Text style={styles.categorySectionLabel}>Рекомендовані</Text>
              <Text style={styles.categorySectionHint}>На основі типу категорії та популярних варіантів</Text>
              <View style={styles.recommendationGrid}>
                {recommendations.map((item) => {
                  const selected = currentColor.toLowerCase() === item.color.toLowerCase();
                  return (
                    <Pressable key={item.name} onPress={() => chooseColor(item.color)} style={[styles.recommendationCard, selected && { borderColor: item.color }]}>
                      <View style={[styles.recommendationIcon, { backgroundColor: withAlpha(item.color, 0.18) }]}><Text style={[styles.recommendationGlyph, { color: item.color }]}>{item.glyph}</Text></View>
                      <Text style={styles.recommendationName} numberOfLines={1}>{item.name}</Text>
                      <View style={[styles.recommendationDot, { backgroundColor: item.color }]}>{selected ? <Text style={styles.swatchCheck}>✓</Text> : null}</View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.colorDivider} />
              <Text style={styles.categorySectionLabel}>Всі кольори</Text>
              <View style={styles.allColorsGrid}>
                {categorySwatches.map((color) => {
                  const selected = currentColor.toLowerCase() === color.toLowerCase();
                  return (
                    <Pressable key={color} accessibilityLabel={`Колір ${color}`} onPress={() => chooseColor(color)} style={[styles.colorSwatch, { backgroundColor: color }, selected && styles.colorSwatchSelected]}>
                      {selected ? <Text style={styles.swatchCheck}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
          </>
        </ScrollView>
        <View style={styles.categoryFooter}>
          <Pressable onPress={s.closeCategoryEditor} style={styles.primaryBtn}><Text style={styles.primaryText}>Готово</Text></Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

export function AvatarMenu() {
  const s = useV5();
  if (!s.avatarMenuOpen) return null;
  const items = ['Завантажити фото', 'Зробити фото', 'Змінити ініціали'];
  return (
    <Pressable onPress={s.closeAvatarMenu} style={styles.overlayEnd}>
      <Pressable onPress={() => {}} style={styles.sheet}>
        <View style={styles.head}><Text style={styles.title}>Фото профілю</Text></View>
        <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 }}>
          {items.map((label) => (
            <Pressable key={label} onPress={s.closeAvatarMenu} style={styles.menuItem}><Text style={styles.menuText}>{label}</Text></Pressable>
          ))}
          <Pressable onPress={s.closeAvatarMenu} style={[styles.menuItem, { borderBottomWidth: 0 }]}><Text style={[styles.menuText, { color: palette.logout }]}>Видалити фото</Text></Pressable>
        </View>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}>
          <Pressable onPress={s.closeAvatarMenu} style={styles.secondaryBtn}><Text style={styles.secondaryText}>Скасувати</Text></Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

export function LogoutConfirm() {
  const s = useV5();
  if (!s.logoutConfirmOpen) return null;
  return (
    <View style={styles.overlayCenter}>
      <View style={styles.dialog}>
        <Text style={styles.dialogTitle}>Вийти з акаунта?</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={s.closeLogoutConfirm} style={styles.dialogCancel}><Text style={styles.dialogCancelText}>Скасувати</Text></Pressable>
          <Pressable onPress={s.confirmLogout} style={styles.dialogConfirm}><Text style={styles.dialogConfirmText}>Вийти</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

export function ShareSheet() {
  const s = useV5();
  const friends = useMemo(() => {
    const start = Math.floor(Math.random() * FRIENDS.length);
    return Array.from({ length: 5 }, (_, index) => FRIENDS[(start + index) % FRIENDS.length]);
  }, [s.shareSheetOpen]);
  if (!s.shareSheetOpen) return null;
  return (
    <Pressable onPress={s.closeShareSheet} style={[styles.overlayEnd, { zIndex: 32 }]}>
      <Pressable onPress={() => {}} style={[styles.sheet, { paddingBottom: 20 }]}>
        <View style={styles.grabber} />
        <View style={styles.shareHead}>
          <Text style={styles.shareTitle}>Поділитися задачею</Text>
          <Pressable onPress={s.closeShareSheet} style={styles.closeBtn}><Text style={styles.closeX}>✕</Text></Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 6, gap: 8 }}>
          <View style={styles.shareOption}>
            <View style={[styles.shareOptionIcon, { backgroundColor: withAlpha(palette.accent, 0.14) }]}><PersonPlusIcon size={17} color={palette.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shareOptTitle}>Поділитися з другом</Text>
              <Text style={styles.shareOptSub}>Надішліть посилання або запрошення</Text>
            </View>
            <CaretRight size={7} color={palette.textFaint} />
          </View>
          <View style={styles.shareOption}>
            <View style={[styles.shareOptionIcon, { backgroundColor: withAlpha(palette.badgePurple, 0.14) }]}><PeopleIcon size={17} color={palette.badgePurple} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shareOptTitle}>Запросити в спільну задачу</Text>
              <Text style={styles.shareOptSub}>Додайте співвиконавців</Text>
            </View>
            <CaretRight size={7} color={palette.textFaint} />
          </View>
        </View>

        <View style={styles.recentHead}>
          <Text style={styles.recentLabel}>Друзі</Text>
          <Text style={styles.recentAction}>Демо-список</Text>
        </View>
        {s.shareSuccessName ? (
          <View style={styles.shareSuccess}>
            <Text style={styles.shareSuccessText}>Запрошення для {s.shareSuccessName} підготовлено</Text>
            <Text style={styles.shareSuccessSub}>Це демонстрація — повідомлення не надсилалося.</Text>
          </View>
        ) : null}
        <ScrollView style={{ maxHeight: 270 }} contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={false}>
          {friends.map((friend) => {
            const selected = s.shareSuccessName === friend.name;
            return (
              <Pressable key={friend.email} onPress={() => s.shareTaskWithFriend(friend.name)} style={styles.contactRow}>
                <View style={styles.contactAvatar}><Text style={styles.contactInitials}>{initials(friend.name)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{friend.name}</Text>
                  <Text style={styles.contactEmail}>{friend.email}</Text>
                </View>
                <View style={[styles.contactAdd, selected && styles.contactAdded]}>
                  {selected ? <Text style={styles.contactCheck}>✓</Text> : <PlusIcon size={15} color={palette.white} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  goal: number;
  current: number;
  color: string;
  earnedAt?: string;
}

function AchievementRow({ item }: { item: Achievement }) {
  const unlocked = item.current >= item.goal;
  const locked = item.current === 0 && !unlocked;
  const progress = Math.min(100, Math.round((item.current / item.goal) * 100));
  return (
    <View style={[styles.achievementRow, locked && styles.achievementLocked]}>
      <View style={[styles.achievementIcon, { backgroundColor: withAlpha(item.color, 0.14), borderColor: withAlpha(item.color, 0.42) }]}>
        <Text style={[styles.achievementGoal, { color: item.color }]}>{item.goal}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.achievementTitleRow}>
          <Text style={styles.achievementTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.achievementStatusWrap}>
            <Text style={[styles.achievementStatus, unlocked && { color: palette.badgeGreen }]}>{unlocked ? 'Отримано' : item.current > 0 ? `${item.current}/${item.goal}` : 'Заблоковано'}</Text>
            {unlocked && item.earnedAt ? <Text style={styles.achievementDate}>{new Date(item.earnedAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}</Text> : null}
          </View>
        </View>
        <Text style={styles.achievementDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.achievementTrack}>
          <View style={[styles.achievementFill, { width: `${progress}%`, backgroundColor: unlocked ? item.color : withAlpha(item.color, 0.7) }]} />
        </View>
      </View>
    </View>
  );
}

export function AchievementsSheet() {
  const s = useV5();
  const { height } = useWindowDimensions();
  const [filter, setFilter] = useState<'all' | 'earned' | 'progress'>('all');
  if (!s.achievementsOpen) return null;

  const completed = s.tasks.filter((task) => task.completed).length;
  const completedAt = s.tasks.flatMap((task) => task.completedAt ? [task.completedAt] : []);
  const streak = calculateStreak(completedAt, new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
  const taskNames = [
    'Перші пів сотні', 'Сотня справ', 'На повній швидкості', 'Майстер виконання', 'Стабільний ритм',
    'Триста кроків уперед', 'Невтомний планувальник', 'Велика дистанція', 'За крок до вершини', 'Легенда продуктивності',
  ];
  const streakNames: Record<number, string> = {
    7: 'Тиждень у ритмі', 14: 'Подвійний темп', 21: 'Сформована звичка',
    30: 'Місяць стабільності', 60: 'Два місяці фокусу', 100: 'Сотня днів поспіль',
  };
  const completionDates = s.tasks.flatMap((task) => task.completedAt ? [task.completedAt] : []).sort();
  const achievementColors = [palette.badgeGreen, '#5B8DEF', palette.badgePurple, '#E38B3F', palette.accent, '#45A5A3'];
  const taskAchievements: Achievement[] = Array.from({ length: 10 }, (_, index) => {
    const goal = (index + 1) * 50;
    return { id: `tasks-${goal}`, name: taskNames[index], description: `Виконайте ${goal} задач`, goal, current: completed, color: achievementColors[index % achievementColors.length], earnedAt: completionDates[goal - 1] };
  });
  const streakAchievements: Achievement[] = [7, 14, 21, 30, 60, 100].map((goal) => ({
    id: `streak-${goal}`,
    name: streakNames[goal],
    description: `Виконуйте щонайменше одну задачу ${goal} днів поспіль`,
    goal,
    current: streak,
    color: achievementColors[(goal / 7) % achievementColors.length | 0],
    earnedAt: streak >= goal ? completionDates.at(-1) : undefined,
  }));
  const collaborationAchievements: Achievement[] = [
    { id: 'share-1', name: 'Командний старт', description: 'Поділіться першою задачею з другом', goal: 1, current: s.sharedTaskCount, color: palette.badgePurple },
    { id: 'share-5', name: 'Разом продуктивніше', description: 'Поділіться п’ятьма задачами', goal: 5, current: s.sharedTaskCount, color: palette.badgePurple },
  ];
  const unlocked = [...taskAchievements, ...streakAchievements, ...collaborationAchievements].filter((item) => item.current >= item.goal).length;
  const include = (item: Achievement) => filter === 'all' || (filter === 'earned' ? item.current >= item.goal : item.current < item.goal);
  const filteredTasks = taskAchievements.filter(include);
  const filteredStreaks = streakAchievements.filter(include);
  const filteredCollaboration = collaborationAchievements.filter(include);

  return (
    <Pressable onPress={s.closeAchievements} style={[styles.overlayEnd, { zIndex: 34 }]}>
      <Pressable onPress={() => {}} style={[styles.sheet, styles.achievementsSheet, { height: Math.min(height * 0.9, 760) }]}>
        <View style={styles.grabber} />
        <View style={styles.shareHead}>
          <View>
            <Text style={styles.shareTitle}>Усі нагороди</Text>
            <Text style={styles.subtitle}>Отримано {unlocked} із {taskAchievements.length + streakAchievements.length + collaborationAchievements.length}</Text>
          </View>
          <Pressable onPress={s.closeAchievements} style={styles.closeBtn}><Text style={styles.closeX}>✕</Text></Pressable>
        </View>
        <View style={styles.achievementFilters}>
          <SegmentedControl
            compact
            items={[{ value: 'all', label: 'Усі' }, { value: 'earned', label: 'Отримані' }, { value: 'progress', label: 'У процесі' }]}
            value={filter}
            onChange={setFilter}
          />
        </View>
        <ScrollView contentContainerStyle={styles.achievementsContent} showsVerticalScrollIndicator={false}>
          {filteredTasks.length ? <><Text style={styles.achievementSection}>Виконані задачі</Text><View style={styles.achievementCard}>{filteredTasks.map((item) => <AchievementRow key={item.id} item={item} />)}</View></> : null}
          {filteredStreaks.length ? <><Text style={styles.achievementSection}>Серії днів</Text><View style={styles.achievementCard}>{filteredStreaks.map((item) => <AchievementRow key={item.id} item={item} />)}</View></> : null}
          {filteredCollaboration.length ? <><Text style={styles.achievementSection}>Спільна робота</Text><View style={styles.achievementCard}>{filteredCollaboration.map((item) => <AchievementRow key={item.id} item={item} />)}</View></> : null}
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

export function PersonalDataSheet() {
  const s = useV5();
  const [nickname, setNickname] = useState(s.userFullName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!s.personalDataOpen) return;
    setNickname(s.userFullName);
    setSaving(false);
    setError(null);
  }, [s.personalDataOpen, s.userFullName]);

  if (!s.personalDataOpen) return null;

  const save = async () => {
    const normalized = nickname.trim().replace(/\s+/g, ' ');
    if (normalized.length < 2) {
      setError('Нікнейм має містити щонайменше 2 символи.');
      return;
    }
    setSaving(true);
    setError(null);
    const saved = await s.saveNickname(normalized);
    setSaving(false);
    if (!saved) setError('Не вдалося зберегти нікнейм. Перевірте з’єднання та повторіть спробу.');
  };

  return (
    <Pressable onPress={s.closePersonalData} style={[styles.overlayEnd, { zIndex: 35 }]}>
      <Pressable onPress={() => {}} style={[styles.sheet, styles.personalSheet]}>
        <View style={styles.grabber} />
        <View style={styles.shareHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoEyebrow}>Особисті дані</Text>
            <Text style={styles.shareTitle}>Змінити нікнейм</Text>
          </View>
          <Pressable onPress={s.closePersonalData} style={styles.closeBtn}><Text style={styles.closeX}>✕</Text></Pressable>
        </View>
        <View style={styles.personalContent}>
          <Text style={styles.fieldLabel}>Нікнейм</Text>
          <TextInput
            value={nickname}
            onChangeText={(value) => { setNickname(value); setError(null); }}
            placeholder="Як до вас звертатися"
            placeholderTextColor={palette.textFaint}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
            selectTextOnFocus
            style={[styles.personalInput, error && styles.personalInputError]}
          />
          <Text style={styles.fieldHint}>Це ім’я буде показано у привітанні та профілі.</Text>
          {error ? <Text accessibilityRole="alert" style={styles.fieldError}>{error}</Text> : null}
        </View>
        <View style={styles.personalFooter}>
          <Pressable onPress={s.closePersonalData} disabled={saving} style={styles.secondaryBtn}><Text style={styles.secondaryText}>Скасувати</Text></Pressable>
          <Pressable onPress={() => { void save(); }} disabled={saving} style={[styles.primaryBtn, saving && styles.buttonDisabled]}>
            <Text style={styles.primaryText}>{saving ? 'Зберігаємо…' : 'Зберегти'}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

export function AppearanceSheet() {
  const s = useV5();
  const { mode, setMode } = useAppTheme();
  if (!s.appearanceOpen) return null;

  const options = [
    { value: 'dark' as const, title: 'Темна', description: 'Глибокий чорний фон і червоні акценти', preview: '#0B0B0D' },
    { value: 'light' as const, title: 'Світла', description: 'Світлі поверхні та контрастний темний текст', preview: '#FAFAFB' },
  ];

  return (
    <Pressable onPress={s.closeAppearance} style={[styles.overlayEnd, { zIndex: 35 }]}>
      <Pressable onPress={() => {}} style={[styles.sheet, styles.appearanceSheet]}>
        <View style={styles.grabber} />
        <View style={styles.shareHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoEyebrow}>Оформлення</Text>
            <Text style={styles.shareTitle}>Оберіть тему</Text>
          </View>
          <Pressable onPress={s.closeAppearance} style={styles.closeBtn}><Text style={styles.closeX}>✕</Text></Pressable>
        </View>
        <View style={styles.appearanceOptions}>
          {options.map((option) => {
            const selected = mode === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setMode(option.value)}
                style={[styles.themeOption, selected && styles.themeOptionSelected]}
              >
                <View style={[styles.themePreview, { backgroundColor: option.preview }]}>
                  <View style={styles.themePreviewAccent} />
                  <View style={[styles.themePreviewLine, option.value === 'light' && styles.themePreviewLineLight]} />
                  <View style={[styles.themePreviewLine, styles.themePreviewLineShort, option.value === 'light' && styles.themePreviewLineLight]} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.themeTitle}>{option.title}</Text>
                  <Text style={styles.themeDescription}>{option.description}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.infoFooter}>
          <Pressable onPress={s.closeAppearance} style={styles.primaryBtn}><Text style={styles.primaryText}>Готово</Text></Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

function InfoSheet({ visible, onClose, title, eyebrow, children }: { visible: boolean; onClose: () => void; title: string; eyebrow: string; children: React.ReactNode }) {
  if (!visible) return null;
  return (
    <Pressable onPress={onClose} style={[styles.overlayEnd, { zIndex: 34 }]}>
      <Pressable onPress={() => {}} style={[styles.sheet, styles.infoSheet]}>
        <View style={styles.grabber} />
        <View style={styles.shareHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoEyebrow}>{eyebrow}</Text>
            <Text style={styles.shareTitle}>{title}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}><Text style={styles.closeX}>✕</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.infoContent} showsVerticalScrollIndicator={false}>{children}</ScrollView>
        <View style={styles.infoFooter}>
          <Pressable onPress={onClose} style={styles.primaryBtn}><Text style={styles.primaryText}>Зрозуміло</Text></Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

export function SecurityInfoSheet() {
  const s = useV5();
  return (
    <InfoSheet visible={s.securityInfoOpen} onClose={s.closeSecurityInfo} eyebrow="Ваші дані" title="Безпека і приватність">
      <Text style={styles.infoLead}>Ваші задачі доступні лише після авторизації та синхронізуються через захищене з’єднання.</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Ізоляція акаунтів</Text>
        <Text style={styles.infoText}>Правила Row Level Security у Supabase обмежують доступ даними поточного користувача. Клієнтський застосунок не використовує службовий ключ із розширеними правами.</Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Контроль залишається у вас</Text>
        <Text style={styles.infoText}>Ми не передаємо вміст задач іншим користувачам без вашої дії. Демонстраційний шеринг у цій версії не надсилає реальних повідомлень.</Text>
      </View>
      <Text style={styles.infoText}>Використовуйте унікальний пароль, не передавайте коди входу та виходьте з акаунта на чужих пристроях.</Text>
    </InfoSheet>
  );
}

export function AboutAppSheet() {
  const s = useV5();
  const features = ['Голосове й текстове створення задач', 'Категорії, пріоритети та календар на добу', 'Особиста аналітика без вигаданих показників', 'Синхронізація даних через Supabase'];
  return (
    <InfoSheet visible={s.aboutAppOpen} onClose={s.closeAboutApp} eyebrow="Версія 0.1.0" title="Voice Todo">
      <Text style={styles.infoLead}>Voice Todo — український планувальник, який перетворює голос або короткий текст на структуровані задачі й допомагає бачити реальний прогрес.</Text>
      <View style={styles.infoCard}>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.infoCard, { borderColor: withAlpha(palette.badgePurple, 0.42) }]}>
        <Text style={styles.infoCardTitle}>Наступний крок для аналітики</Text>
        <Text style={styles.infoText}>У планах — персональні інсайти про найкращий час для фокусу, баланс категорій і рекомендації на основі завершених задач. Події продукту мають збиратися без тексту приватних задач і лише з прозорою згодою.</Text>
      </View>
    </InfoSheet>
  );
}

const styles = StyleSheet.create({
  overlayEnd: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 30 },
  overlayCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, zIndex: 30 },
  sheet: { backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: palette.border },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: palette.chipBorder, alignSelf: 'center', marginTop: 10 },
  head: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 6 },
  title: { fontSize: 19, fontWeight: '700', color: palette.text },
  subtitle: { fontSize: 13, color: palette.textMuted, marginTop: 4, lineHeight: 18 },
  categorySheet: { height: '88%', maxHeight: '92%' },
  categoryHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 18, paddingHorizontal: 20, paddingBottom: 12 },
  categoryContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 },
  categoryFooter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, borderTopColor: palette.borderFaint },
  categorySectionLabel: { color: palette.textSecondary, fontSize: 11.5, fontWeight: '700', marginTop: 12 },
  categorySectionHint: { color: palette.textFaint, fontSize: 10.5, lineHeight: 15, marginTop: 3, marginBottom: 9 },
  categorySelector: { gap: 8, paddingVertical: 9 },
  categoryChoice: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, borderRadius: 11, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  categoryChoiceDot: { width: 7, height: 7, borderRadius: 4 },
  categoryChoiceText: { color: palette.textMuted, fontSize: 12, fontWeight: '600' },
  addCategoryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: withAlpha(palette.accent, 0.35), borderStyle: 'dashed' },
  addCategoryText: { color: palette.accent, fontSize: 12.5, fontWeight: '600' },
  createCategoryRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  createCategoryInput: { flex: 1, height: 44, color: palette.text, fontSize: 13.5, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  createCategoryButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: palette.accent },
  recommendationGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  recommendationCard: { width: '48.5%', minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 9, borderRadius: 11, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  recommendationIcon: { width: 25, height: 25, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  recommendationGlyph: { fontSize: 12, fontWeight: '800' },
  recommendationName: { flex: 1, color: palette.textSecondary, fontSize: 11.5, fontWeight: '600' },
  recommendationDot: { width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  colorDivider: { height: 1, backgroundColor: palette.borderFaint, marginTop: 16, marginBottom: 2 },
  allColorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  colorSwatchSelected: { borderWidth: 2, borderColor: palette.text, transform: [{ scale: 1.08 }] },
  swatchCheck: { color: palette.white, fontSize: 11, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 2 },
  catRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.chip },
  catName: { fontSize: 14.5, color: palette.text, fontWeight: '500', marginBottom: 10 },
  swatches: { flexDirection: 'row', gap: 9, flexWrap: 'wrap' },
  primaryBtn: { padding: 15, borderRadius: 14, backgroundColor: palette.accent, alignItems: 'center' },
  primaryText: { color: palette.text, fontSize: 15, fontWeight: '600' },
  secondaryBtn: { padding: 15, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center' },
  secondaryText: { color: palette.textMuted, fontSize: 15 },
  menuItem: { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: palette.chip },
  menuText: { color: palette.text, fontSize: 15 },
  dialog: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 20, paddingVertical: 24, paddingHorizontal: 20, width: '100%', maxWidth: 300, alignItems: 'center' },
  dialogTitle: { fontSize: 17, fontWeight: '700', color: palette.text, marginBottom: 20 },
  dialogCancel: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: palette.chip, alignItems: 'center' },
  dialogCancelText: { color: palette.textSecondary, fontSize: 14 },
  dialogConfirm: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: palette.accent, alignItems: 'center' },
  dialogConfirmText: { color: palette.text, fontSize: 14, fontWeight: '600' },
  shareHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  shareTitle: { fontSize: 18, fontWeight: '700', color: palette.text },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  closeX: { color: palette.textMuted, fontSize: 14 },
  shareOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14 },
  shareOptionIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  shareOptTitle: { fontSize: 14.5, fontWeight: '600', color: palette.text },
  shareOptSub: { fontSize: 12, color: palette.textMuted, marginTop: 1 },
  recentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  recentLabel: { fontSize: 12, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  recentAction: { fontSize: 12.5, color: palette.accent, fontWeight: '600' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10 },
  contactAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.chipBorder, alignItems: 'center', justifyContent: 'center' },
  contactInitials: { fontSize: 14, fontWeight: '600', color: palette.text },
  contactName: { fontSize: 14.5, fontWeight: '600', color: palette.text },
  contactEmail: { fontSize: 12, color: palette.textMuted, marginTop: 1 },
  contactAdd: { width: 34, height: 34, borderRadius: 10, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  contactAdded: { backgroundColor: withAlpha(palette.badgeGreen, 0.22), borderWidth: 1, borderColor: withAlpha(palette.badgeGreen, 0.55) },
  contactCheck: { color: palette.badgeGreen, fontSize: 15, fontWeight: '700' },
  shareSuccess: { marginHorizontal: 20, marginBottom: 4, padding: 12, borderRadius: 12, backgroundColor: withAlpha(palette.badgeGreen, 0.12), borderWidth: 1, borderColor: withAlpha(palette.badgeGreen, 0.34) },
  shareSuccessText: { color: palette.badgeGreen, fontSize: 13, fontWeight: '600' },
  shareSuccessSub: { color: palette.textMuted, fontSize: 11.5, marginTop: 3 },
  achievementsSheet: { paddingBottom: 8 },
  achievementFilters: { paddingHorizontal: 20, paddingTop: 10 },
  achievementsContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  achievementSection: { fontSize: 11.5, fontWeight: '700', color: palette.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 12, marginBottom: 8 },
  achievementCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, overflow: 'hidden' },
  achievementRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: palette.border },
  achievementLocked: { opacity: 0.52 },
  achievementIcon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  achievementGoal: { fontSize: 11.5, fontWeight: '800' },
  achievementTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  achievementTitle: { flex: 1, color: palette.text, fontSize: 13.5, fontWeight: '600' },
  achievementStatus: { color: palette.textFaint, fontSize: 10.5 },
  achievementStatusWrap: { alignItems: 'flex-end' },
  achievementDate: { color: palette.textFaint, fontSize: 8.5, marginTop: 2 },
  achievementDescription: { color: palette.textMuted, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  achievementTrack: { height: 4, marginTop: 7, borderRadius: 2, overflow: 'hidden', backgroundColor: palette.chip },
  achievementFill: { height: '100%', borderRadius: 2 },
  infoSheet: { maxHeight: '84%' },
  personalSheet: { paddingBottom: 8 },
  personalContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 },
  fieldLabel: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '700', marginBottom: 8 },
  personalInput: { minHeight: 52, color: palette.text, fontSize: 16, paddingHorizontal: 14, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.borderStrong },
  personalInputError: { borderColor: palette.accent },
  fieldHint: { color: palette.textFaint, fontSize: 11.5, lineHeight: 16, marginTop: 7 },
  fieldError: { color: palette.accentSoftText, fontSize: 11.5, lineHeight: 16, marginTop: 7 },
  personalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: palette.borderFaint },
  buttonDisabled: { opacity: 0.55 },
  appearanceSheet: { paddingBottom: 8 },
  appearanceOptions: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, gap: 10 },
  themeOption: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 15, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  themeOptionSelected: { borderColor: palette.accent, backgroundColor: withAlpha(palette.accent, 0.07) },
  themePreview: { width: 54, height: 58, borderRadius: 12, padding: 9, borderWidth: 1, borderColor: palette.borderStrong, overflow: 'hidden' },
  themePreviewAccent: { width: 24, height: 5, borderRadius: 3, marginBottom: 9, backgroundColor: palette.accent },
  themePreviewLine: { width: '100%', height: 4, borderRadius: 2, marginBottom: 6, backgroundColor: '#4A4A50' },
  themePreviewLineShort: { width: '68%' },
  themePreviewLineLight: { backgroundColor: '#C6C6CC' },
  themeTitle: { color: palette.text, fontSize: 14.5, fontWeight: '700' },
  themeDescription: { color: palette.textMuted, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: palette.borderStrong },
  radioSelected: { borderColor: palette.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.accent },
  infoEyebrow: { fontSize: 11, fontWeight: '700', color: palette.accent, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 3 },
  infoContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 12 },
  infoLead: { color: palette.textSecondary, fontSize: 14, lineHeight: 21 },
  infoCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 14, gap: 7 },
  infoCardTitle: { color: palette.text, fontSize: 14, fontWeight: '700' },
  infoText: { color: palette.textMuted, fontSize: 13, lineHeight: 20 },
  infoFooter: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.badgeGreen, marginTop: 6 },
  featureText: { flex: 1, color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
});
