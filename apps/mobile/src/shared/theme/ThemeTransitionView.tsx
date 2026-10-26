import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { ThemeTransition } from './use-theme-transition';

type ThemeTransitionViewProps = Omit<ThemeTransition, 'transition'> & { children: ReactNode };

// Корень, который снимается перед сменой темы, и снимок поверх него на время растворения
export const ThemeTransitionView = ({
  rootRef,
  snapshot,
  opacity,
  onSnapshotLoad,
  onSnapshotError,
  children,
}: ThemeTransitionViewProps) => {
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.fill}>
      <View ref={rootRef} collapsable={false} style={styles.fill}>
        {children}
      </View>
      {snapshot ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
          {/* fadeDuration 0: на Android картинка иначе сама проявляется 300 мс, и тема сменится раньше */}
          <Image
            source={{ uri: snapshot }}
            style={styles.fill}
            fadeDuration={0}
            onLoad={onSnapshotLoad}
            onError={onSnapshotError}
          />
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({ fill: { flex: 1 } });
