import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from "react-native"

import { colors, fonts, radius, spacing } from "@/theme"

interface SearchFieldProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string
  onChangeText: (text: string) => void
}

/** A white search box with a clear button, for the navy band. */
export function SearchField({ value, onChangeText, placeholder, ...rest }: SearchFieldProps) {
  return (
    <View style={styles.field}>
      <Ionicons name="search" size={18} color={colors.textDim} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        accessibilityLabel={placeholder}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.input}
        {...rest}
      />
      {!!value && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
          onPress={() => onChangeText("")}
        >
          <Ionicons name="close-circle" size={18} color={colors.textDim} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    height: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: fonts.normal,
    fontSize: 16,
    color: colors.text,
  },
})
