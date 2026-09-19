import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

function tabIcon(name: IconName, focusedName: IconName, size: number) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? focusedName : name} size={size} color={color} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { colors, easyMode } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const iconSize = easyMode ? 30 : 24;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Screens that are not visible do not re-render while the counter is being tapped.
        freezeOnBlur: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: easyMode ? 16 : 13, fontWeight: '600' },
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: (easyMode ? 78 : 64) + insets.bottom,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('common.tabs.counter'),
          tabBarIcon: tabIcon('radio-button-on-outline', 'radio-button-on', iconSize),
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: t('common.tabs.prayer'),
          tabBarIcon: tabIcon('moon-outline', 'moon', iconSize),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('common.tabs.history'),
          tabBarIcon: tabIcon('time-outline', 'time', iconSize),
        }}
      />
      {/* Easy Mode keeps navigation to the essentials; History already shows the key totals. */}
      <Tabs.Protected guard={!easyMode}>
        <Tabs.Screen
          name="statistics"
          options={{
            title: t('common.tabs.statistics'),
            tabBarIcon: tabIcon('stats-chart-outline', 'stats-chart', iconSize),
          }}
        />
      </Tabs.Protected>
      <Tabs.Screen
        name="settings"
        options={{
          title: t('common.tabs.settings'),
          tabBarIcon: tabIcon('settings-outline', 'settings', iconSize),
        }}
      />
    </Tabs>
  );
}
