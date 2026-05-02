import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.root}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, active && styles.active]}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  active: {
    backgroundColor: colors.amber,
    shadowColor: colors.amber,
    shadowOpacity: 0.34,
    shadowRadius: 14,
  },
  label: {
    color: colors.muted,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    textAlign: "center",
  },
  activeLabel: {
    color: colors.ink,
  },
});

