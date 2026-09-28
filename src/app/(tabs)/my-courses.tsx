import { StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"

export default function MyCoursesScreen() {
  return (
    <View style={styles.container}>
      <Text size="xl" weight="bold">
        My Courses
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
})
