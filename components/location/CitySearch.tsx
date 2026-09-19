import {
  type ReactElement,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText, TextField } from '@/components/ui';
import { type City, searchCities } from '@/constants/places';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

import { CityRow } from './CityRow';

/** A short pause in typing before the list is searched. */
const SEARCH_DELAY_MS = 150;
/** One letter would only list the biggest cities starting with it. */
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 30;

function keyExtractor(city: City): string {
  return `${city.name}-${city.countryCode}-${city.latitude}`;
}

function Separator() {
  const { colors } = useTheme();
  return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
}

export interface CitySearchProps {
  onSelect: (city: City) => void;
  /** Content above the search field. It scrolls together with the results. */
  header?: ReactElement | null;
  /** Content below the results, for example the coordinates form. */
  footer?: ReactElement | null;
  testID?: string;
}

/**
 * The city search and its results. It is the scrolling part of the screen, so
 * the results stay a list instead of a second scroll view inside one.
 */
export function CitySearch({ onSelect, header, footer, testID }: CitySearchProps) {
  const { t } = useTranslation();
  const { easyMode } = useTheme();
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setTerm(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // The city list is read from storage on the first search; typing stays responsive.
  const searched = useDeferredValue(term);
  const results = useMemo(
    () => (searched.length >= MIN_QUERY_LENGTH ? searchCities(searched, MAX_RESULTS) : []),
    [searched],
  );

  const renderItem = useCallback(
    ({ item }: { item: City }) => <CityRow city={item} onSelect={onSelect} />,
    [onSelect],
  );

  const listHeader = (
    <View>
      {header}
      <View style={styles.field}>
        <TextField
          label={t('location.search.label')}
          placeholder={t('location.search.placeholder')}
          hint={t('location.search.hint')}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          testID={testID ? `${testID}-input` : undefined}
        />
      </View>
    </View>
  );

  const nothingFound =
    searched.length >= MIN_QUERY_LENGTH ? (
      <AppText
        variant="body"
        tone="muted"
        accessibilityLiveRegion="polite"
        style={styles.empty}
        testID={testID ? `${testID}-empty` : undefined}
      >
        {t('location.search.empty')}
      </AppText>
    ) : null;

  return (
    <FlatList
      data={results}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={nothingFound}
      ListFooterComponent={footer}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      // Few rows at a time, and none of them clipped: the fields above keep the typing focus.
      removeClippedSubviews={false}
      initialNumToRender={easyMode ? 6 : 10}
      maxToRenderPerBatch={10}
      windowSize={7}
      showsVerticalScrollIndicator={false}
      style={styles.list}
      contentContainerStyle={styles.content}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingBottom: SPACING.xxl },
  field: { marginBottom: SPACING.md },
  // Starts where the city names start, like the hairlines of a grouped section.
  separator: { height: StyleSheet.hairlineWidth, marginStart: SPACING.md },
  empty: { paddingVertical: SPACING.md },
});
