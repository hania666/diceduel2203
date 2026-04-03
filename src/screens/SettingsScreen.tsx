import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { useLang } from '../context/LanguageContext';
import { LANGUAGES, Language } from '../i18n/translations';

export function SettingsScreen() {
  const { t, language, changeLanguage } = useLang();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>⬡ DICE DUEL</Text>
      <Text style={styles.subtitle}>{t('settings')}</Text>

      <Text style={styles.sectionTitle}>{t('language')}</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            onPress={() => changeLanguage(lang.code as Language)}
            style={[styles.langRow, language === lang.code && styles.langRowActive]}
          >
            <Text style={styles.langFlag}>{lang.flag}</Text>
            <Text style={[styles.langLabel, language === lang.code && styles.langLabelActive]}>
              {lang.label}
            </Text>
            {language === lang.code && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 20 },
  title: { color: '#9945FF', fontSize: 20, fontWeight: '900', letterSpacing: 3, marginTop: 12 },
  subtitle: { color: '#14F195', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 24 },
  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  langRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16,
    marginBottom: 8, borderWidth: 1.5, borderColor: '#1a1a2e',
    gap: 14,
  },
  langRowActive: { borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.12)' },
  langFlag: { fontSize: 24 },
  langLabel: { flex: 1, color: '#888', fontSize: 16, fontWeight: '700' },
  langLabelActive: { color: '#fff' },
  checkmark: { color: '#14F195', fontSize: 20, fontWeight: '900' },
});
