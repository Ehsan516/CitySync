import { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

// Drives the blurred sticky background on ScreenHeader as a screen's
// content scrolls underneath it (Apple's standard-vs-scrollEdge nav bar look).
export function useScrollHeader() {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return { scrollY, onScroll };
}
