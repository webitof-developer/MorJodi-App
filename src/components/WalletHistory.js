import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "../constants/theme";

const WalletHistory = ({ transaction }) => {
  const isNegative = String(transaction.amount).startsWith("-");
  const firstLetter = transaction.type?.charAt(0)?.toUpperCase() || "?";

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: COLORS.lightGray },
        ]}
      >
        <Text style={styles.iconText}>{firstLetter}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.type}>{transaction.type}</Text>
      </View>

      <Text
        style={[
          styles.amount,
          { color: isNegative ? COLORS.danger : COLORS.success },
        ]}
      >
        ₹{transaction.amount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.base * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
    marginHorizontal: SIZES.base * 1.5,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.darkGray,
  },
  type: {
    ...FONTS.body5,
    color: COLORS.gray,
    textTransform: "capitalize",
  },
  amount: {
    ...FONTS.h4,
    fontWeight: "600",
  },
});

export default WalletHistory;
