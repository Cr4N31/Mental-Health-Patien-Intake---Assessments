import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../src/theme/styles";

type IconName = ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  size,
  focused,
}: {
  name: IconName;
  size: number;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.85)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0.85,
      useNativeDriver: true,
      damping: 14,
      stiffness: 220,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View
      style={{
        width: 34,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? colors.brand : "transparent",
        transform: [{ scale }],
      }}
    >
      <Ionicons
        name={name}
        size={size}
        color={focused ? colors.paper : "#BAC9BE"}
      />
    </Animated.View>
  );
}

export default function ScreensLayout() {
  const insets = useSafeAreaInsets();

  const bottomInset = Platform.OS === "android" ? insets.bottom : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: colors.paper,
        tabBarInactiveTintColor: "#BAC9BE",

        tabBarStyle: {
          height: 66 + bottomInset,

          paddingTop: 7,
          paddingBottom: bottomInset,

          backgroundColor: colors.ink,

          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,

          elevation: 12,
          shadowColor: "#10251A",
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: {
            width: 0,
            height: -4,
          },
        },

        tabBarItemStyle: {
          display: "flex",
          flex: 1,
          paddingTop: 2,
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 3,
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="resonance"
        options={{
          title: "Resonance",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="allies"
        options={{
          title: "Allies",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon
              name={focused ? "people" : "people-outline"}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="reflections"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
