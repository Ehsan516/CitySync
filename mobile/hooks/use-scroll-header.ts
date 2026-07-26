import { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

export function useScrollHeader() {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return { scrollY, onScroll };
}
