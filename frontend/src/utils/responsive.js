import { Dimensions, PixelRatio } from "react-native";

// Base dimensions this design was built against (a common mid-size Android phone)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

function getScreen() {
  const { width, height } = Dimensions.get("window");
  return { width, height };
}

/** Scales a size horizontally based on the current device width vs the base design width. */
export function scaleWidth(size) {
  const { width } = getScreen();
  return (width / BASE_WIDTH) * size;
}

/** Scales a size vertically based on the current device height vs the base design height. */
export function scaleHeight(size) {
  const { height } = getScreen();
  return (height / BASE_HEIGHT) * size;
}

/**
 * Scales font sizes moderately (not 1:1 with width) so text doesn't
 * become huge on tablets or tiny on small phones - blends the scale
 * factor with 1 so it doesn't overshoot on very large/small screens.
 */
export function scaleFont(size) {
  const { width } = getScreen();
  const scale = width / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize * 0.5 + size * 0.5));
}

export function isSmallDevice() {
  const { width } = getScreen();
  return width < 360;
}

export function isTablet() {
  const { width } = getScreen();
  return width >= 768;
}

export const screen = getScreen();
