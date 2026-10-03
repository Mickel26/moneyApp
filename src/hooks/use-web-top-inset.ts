import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Extra top padding for screens without a header. On iOS the scroll view's automatic content
 * insets already handle the status bar, but on web (the installed PWA) we have to do it ourselves.
 */
export function useWebTopInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'web' ? insets.top : 0;
}
