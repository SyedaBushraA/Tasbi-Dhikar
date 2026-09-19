import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle, useWindowDimensions } from 'react-native';

import { MAX_FONT_SCALE, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { StatTile } from './StatTile';

export interface StatTileItem {
  key: string;
  label: string;
  value: string;
}

export interface StatTileGroupProps {
  tiles: readonly StatTileItem[];
  /** Tiles per row on a normal phone. Easy Mode always stacks them. */
  columns: 2 | 3;
  testID?: string;
}

/** Narrowest tile in which a label like "Completed sessions" still wraps by word. */
const TILE_MIN_WIDTH = 96;

/** A wrapping row of StatTiles. Tiles wrap to fewer per row when text is large. */
export function StatTileGroup({ tiles, columns, testID }: StatTileGroupProps) {
  const { easyMode } = useTheme();
  const { fontScale } = useWindowDimensions();

  const tileStyle = useMemo<ViewStyle>(() => {
    if (easyMode) return styles.stacked;
    // Percent bases cap the tiles per row; the minimum width makes large text wrap earlier.
    const scale = Math.min(fontScale, MAX_FONT_SCALE.caption);
    return {
      flexGrow: 1,
      flexBasis: columns === 3 ? '30%' : '45%',
      minWidth: Math.round(TILE_MIN_WIDTH * scale),
    };
  }, [columns, easyMode, fontScale]);

  return (
    <View style={styles.group} testID={testID}>
      {tiles.map((tile) => (
        <StatTile
          key={tile.key}
          label={tile.label}
          value={tile.value}
          style={tileStyle}
          testID={testID ? `${testID}-${tile.key}` : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  stacked: { flexBasis: '100%' },
});
