/** Secondary overlays: category-color editor, avatar menu, logout confirm,
 * share sheet. Each returns null when its state flag is off. */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, withAlpha, categorySwatches } from '../../theme';
import { useV5 } from './store';
import { PersonPlusIcon, PeopleIcon, PlusIcon, CaretRight } from '../../components/icons';

export function CategoryEditor() {
  const s = useV5();
  if (!s.categoryEditorOpen) return null;
  return (
    <View style={styles.overlayEnd}>
      <View style={[styles.sheet, { maxHeight: '80%' }]}>
        <View style={styles.head}>
          <Text style={styles.title}>Кольори категорій</Text>
          <Text style={styles.subtitle}>Оберіть колір для кожної категорії задач.</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }} showsVerticalScrollIndicator={false}>
          {Object.keys(s.categories).map((name) => {
            const current = s.categories[name];
            return (
              <View key={name} style={styles.catRow}>
                <Text style={styles.catName}>{name}</Text>
                <View style={styles.swatches}>
                  {categorySwatches.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => s.setCategoryColor(name, color)}
                      style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: color, borderWidth: 2.5, borderColor: color === current ? palette.text : 'transparent' }}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
        <View style={{ padding: 20, paddingBottom: 24 }}>
          <Pressable onPress={s.closeCategoryEditor} style={styles.primaryBtn}><Text style={styles.primaryText}>Готово</Text></Pressable>
        </View>
      </View>
    </View>
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
          <Text style={styles.recentLabel}>Недавні контакти</Text>
          <Text style={styles.recentAction}>Показати всі</Text>
        </View>
        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}><Text style={styles.contactInitials}>ОК</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactName}>Олена Коваль</Text>
            <Text style={styles.contactEmail}>olena.koval@example.com</Text>
          </View>
          <Pressable style={styles.contactAdd}><PlusIcon size={15} color={palette.white} /></Pressable>
        </View>
      </Pressable>
    </Pressable>
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
});
