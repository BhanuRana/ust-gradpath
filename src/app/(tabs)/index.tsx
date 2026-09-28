import { StyleSheet, View } from "react-native"

import { Text } from "@/components/ui/text"

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text size="xl" weight="bold">
        Explore
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
})
