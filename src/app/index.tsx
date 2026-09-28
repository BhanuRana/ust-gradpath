import { StyleSheet, Text, View } from "react-native"

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>UST GradPath</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700" },
})
