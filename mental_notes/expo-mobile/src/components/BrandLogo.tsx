import { Image, StyleProp, ViewStyle } from "react-native";

const logo = require("../../assets/pranatix-logo.png");

export function BrandLogo({ style }: { style?: StyleProp<ViewStyle> }) {
  return <Image source={logo} accessibilityLabel="PranatiX" resizeMode="contain" style={[{ width: 132, height: 34 }, style]} />;
}
