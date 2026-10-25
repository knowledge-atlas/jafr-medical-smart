// ================================================================
// شاشة البحث المتقدم في قاعدة المعرفة
// ================================================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  FlatList, ActivityIndicator,
} from 'react-native';
import { KnowledgeBase } from '../kb';
import { SearchResult, EntityType, SourceType } from '../kb/types';
import { FLAGS } from '../config/featureFlags';

const ENTITY_LABELS: Record<string, string> = {
  root: '🔷 جذور',
  planet: '☀️ كواكب',
  sign: '♈ أبراج',
  house: '🏠 بيوت',
  element: '🔥 طبائع',
  letter: '📝 حروف',
  remainder: '🔄 بواقي',
  compound: '🧩 تراكيب',
  resonance: '🎵 رنين',
  remedy: '💊 ترياقات',
  wafq: '🔯 أوفاق',
  medical_root: '🏥 جذور طبية',
  medical_remainder: '🩺 بواقي طبية',
  medical_table: '📊 جداول طبية',
};

const FILTER_TYPES: { key: EntityType | 'all'; label: string }[] = [
  { key: 'all', label: '📚 الكل' },
  { key: 'root', label: '🔷 جذور' },
  { key: 'planet', label: '☀️ كواكب' },
  { key: 'sign', label: '♈ أبراج' },
  { key: 'house', label: '🏠 بيوت' },
  { key: 'element', label: '🔥 طبائع' },
  { key: 'letter', label: '📝 حروف' },
  { key: 'remainder', label: '🔄 بواقي' },
  { key: 'resonance', label: '🎵 رنين' },
  { key: 'compound', label: '🧩 تراكيب' },
  { key: 'remedy', label: '💊 علاج' },
  { key: 'medical_root', label: '🏥 طبي' },
];

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<EntityType | 'all'>('all');
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback((q: string, filter: EntityType | 'all') => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const options: any = { limit: 50 };
      if (filter !== 'all') {
        options.entityTypes = [filter];
      }
      const res = KnowledgeBase.searchQuery(q, options);
      // فلترة المحتوى الطبي إذا كان معطلاً
      const filtered = FLAGS.MEDICAL_MODULE
        ? res
        : res.filter((r: any) => {
            const et = r.entity?.entityType ?? r.entityType;
            return et !== 'medical' && et !== 'remedy';
          });
      setResults(filtered);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const onQueryChange = (text: string) => {
    setQuery(text);
    performSearch(text, activeFilter);
  };

  const onFilterChange = (filter: EntityType | 'all') => {
    setActiveFilter(filter);
    if (query.trim().length >= 2) {
      performSearch(query, filter);
    }
  };

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate('EntityDetail', { entityId: item.entity.id })}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{item.entity.titleAr}</Text>
        <Text style={styles.resultType}>
          {ENTITY_LABELS[item.entity.entityType] || item.entity.entityType}
        </Text>
      </View>
      <Text style={styles.resultSnippet} numberOfLines={3}>
        {item.snippet}
      </Text>
      <View style={styles.resultFooter}>
        <Text style={styles.resultScore}>
          🎯 {(item.score * 100).toFixed(0)}%
        </Text>
        <Text style={styles.resultSource}>{item.entity.sourceFile}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* حقل البحث */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onQueryChange}
          placeholder="ابحث في قاعدة المعرفة..."
          placeholderTextColor="#666"
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => onQueryChange('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* فلاتر النوع */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTER_TYPES.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => onFilterChange(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* النتائج */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#d4af37" />
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noResults}>🔍 لا توجد نتائج</Text>
          <Text style={styles.noResultsHint}>
            جرّب كلمات مفتاحية أخرى أو غيّر الفلتر
          </Text>
        </View>
      ) : results.length > 0 ? (
        <>
          <Text style={styles.resultsCount}>
            {results.length} نتيجة
          </Text>
          <FlatList
            data={results}
            keyExtractor={item => item.entity.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </>
      ) : (
        <View style={styles.center}>
          <Text style={styles.hint}>💡 ابدأ الكتابة للبحث</Text>
          <Text style={styles.hintSub}>
            أمثلة: "الجذر 2", "الأسد", "الشمس", "الترياق"
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3b5d',
    borderRadius: 10,
    margin: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 12,
    fontSize: 16,
  },
  clearIcon: { color: '#d4af37', fontSize: 18, paddingLeft: 10 },
  filtersScroll: { maxHeight: 50 },
  filtersContent: { paddingHorizontal: 8, gap: 6 },
  filterChip: {
    backgroundColor: '#0f2438',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1a3b5d',
  },
  filterChipActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  filterChipText: { color: '#c0c0c0', fontSize: 13 },
  filterChipTextActive: { color: '#0a1628', fontWeight: 'bold' },
  resultsCount: {
    color: '#d4af37',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCard: {
    backgroundColor: '#1a3b5d',
    borderRadius: 10,
    marginHorizontal: 12,
    marginVertical: 5,
    padding: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultTitle: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', flex: 1 },
  resultType: { color: '#1abc9c', fontSize: 11 },
  resultSnippet: { color: '#c0c0c0', fontSize: 13, lineHeight: 20 },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#0f2438',
    paddingTop: 6,
  },
  resultScore: { color: '#27ae60', fontSize: 11 },
  resultSource: { color: '#666', fontSize: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  noResults: { color: '#d4af37', fontSize: 18, marginBottom: 10 },
  noResultsHint: { color: '#888', fontSize: 13, textAlign: 'center' },
  hint: { color: '#d4af37', fontSize: 16, marginBottom: 10 },
  hintSub: { color: '#888', fontSize: 13, textAlign: 'center' },
});
