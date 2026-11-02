import { Image, ImageStyle, StyleProp } from "react-native";

const logo = require("../../assets/logo_x.png");

export function BrandLogo({ style }: { style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={logo}
      accessibilityLabel="PranatiX"
      resizeMode="contain"
      style={[{ width: 36, height: 36 }, style]}
    />
  );
}
