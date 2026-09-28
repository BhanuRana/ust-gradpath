import { Ionicons } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { SearchField } from "@/components/ui/search-field"
import { Text } from "@/components/ui/text"
import type { Department } from "@/data/types"
import { colors, spacing } from "@/theme"

import { DeptBadge } from "./dept-badge"

interface DepartmentPickerProps {
  visible: boolean
  departments: Department[]
  /** Course count per prefix under the current term and level filters. */
  counts: Map<string, number>
  selected?: string
  onSelect: (prefix: string | undefined) => void
  onClose: () => void
}

/** A page sheet listing all 129 departments, filterable, with live course counts. */
export function DepartmentPicker(props: DepartmentPickerProps) {
  const { visible, departments, counts, selected, onSelect, onClose } = props
  const { bottom } = useSafeAreaInsets()
  const [filter, setFilter] = useState("")

  const rows = useMemo(() => {
    const q = filter.trim().toUpperCase()
    return [undefined, ...departments.filter((d) => d.prefix.includes(q))]
  }, [departments, filter])

  const choose = (prefix: string | undefined) => {
    onSelect(prefix)
    setFilter("")
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text size="lg" weight="medium">
            Department
          </Text>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12}>
            <Text weight="medium" style={styles.tint}>
              Done
            </Text>
          </Pressable>
        </View>
        <View style={styles.filter}>
          <SearchField
            value={filter}
            onChangeText={setFilter}
            placeholder="Filter, e.g. COMP"
            autoCapitalize="characters"
          />
        </View>
        <FlatList
          data={rows}
          keyExtractor={(d) => d?.prefix ?? "all"}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: bottom + spacing.md }}
          renderItem={({ item }) => {
            const isSelected = item?.prefix === selected
            const count = item && (counts.get(item.prefix) ?? 0)
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => choose(item?.prefix)}
                testID={`department-${item?.prefix ?? "all"}`}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                {item ? (
                  <DeptBadge prefix={item.prefix} size={32} />
                ) : (
                  <View style={styles.allIcon}>
                    <Ionicons name="apps-outline" size={16} color={colors.textDim} />
                  </View>
                )}
                <Text weight={isSelected ? "bold" : "normal"} style={styles.grow}>
                  {item ? item.prefix : "All departments"}
                </Text>
                {item && (
                  <>
                    <Text size="xxs" style={styles.dim}>
                      {item.career === "Mixed" ? "UG/PG" : item.career}
                    </Text>
                    <Text size="xs" style={[styles.dim, count === 0 && styles.zero]}>
                      {count}
                    </Text>
                  </>
                )}
                {isSelected && <Ionicons name="checkmark" size={18} color={colors.tint} />}
              </Pressable>
            )
          }}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  tint: { color: colors.tint },
  filter: { paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  pressed: { opacity: 0.6 },
  grow: { flex: 1 },
  allIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  dim: { color: colors.textDim },
  zero: { opacity: 0.5 },
})
