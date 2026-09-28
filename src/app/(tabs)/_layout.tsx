import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router"

import { colors, fonts } from "@/theme"

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.separator },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-courses"
        options={{
          title: "My Courses",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bookmark" : "bookmark-outline"} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  )
}
