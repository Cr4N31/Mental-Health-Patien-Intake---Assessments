import { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

export function FadeIn({
  children,
  delay = 0,
  style,
}: React.PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
