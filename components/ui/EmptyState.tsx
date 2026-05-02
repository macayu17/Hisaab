import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.root}>
      <View style={styles.illustration}>
        <View style={[styles.ledgerLine, styles.ledgerLineLong]} />
        <View style={styles.ledgerLine} />
        <View style={[styles.ledgerLine, styles.ledgerLineShort]} />
        <View style={styles.ledgerDot} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 38,
    paddingHorizontal: 20,
  },
  illustration: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,163,32,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,163,32,0.26)",
    shadowColor: colors.amber,
    shadowOpacity: 0.4,
    shadowRadius: 22,
  },
  ledgerLine: {
    width: 34,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.amber,
    marginVertical: 3,
  },
  ledgerLineLong: {
    width: 40,
  },
  ledgerLineShort: {
    width: 24,
    alignSelf: "flex-start",
    marginLeft: 18,
  },
  ledgerDot: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.amberSoft,
  },
  title: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 24,
    marginTop: 14,
    textAlign: "center",
  },
  message: {
    color: colors.muted,
    fontFamily: "Montserrat_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
});

