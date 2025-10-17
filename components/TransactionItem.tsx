import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { styles } from "@/assets/styles/home.styles";
import { COLORS } from "@/constants/colors";
import { formatDate } from "@/lib/utils";

// Derive the valid Ionicons name union
type IoniconsName = ComponentProps<typeof Ionicons>["name"];

// Map categories to their respective icons
const CATEGORY_ICONS: Record<string, IoniconsName> = {
  "Food & Drinks": "fast-food",
  Shopping: "cart",
  Transportation: "car",
  Entertainment: "film",
  Bills: "receipt",
  Income: "cash",
  Other: "ellipsis-horizontal",
};

export type TransactionItemProps = {
  item: {
    id: number;
    title: string;
    amount: number | string;
    category: string;
    type?: "income" | "expense" | "transfer" | "other" | "unknown";
    created_at?: string;
  };
  onDelete: (id: number) => void;
};

export const TransactionItem = ({ item, onDelete }: TransactionItemProps) => {
  const amountNum =
    typeof item.amount === "number"
      ? item.amount
      : parseFloat(String(item.amount ?? 0));
  // const isIncome = amountNum > 0;
  const isIncome = item.type
    ? item.type === "income"
    : item.category === "Income";
  const iconName: IoniconsName =
    CATEGORY_ICONS[item.category] ?? "pricetag-outline";

  return (
    <View style={styles.transactionCard} key={item.id}>
      <TouchableOpacity style={styles.transactionContent}>
        <View style={styles.categoryIconContainer}>
          <Ionicons
            name={iconName}
            size={22}
            // color={isIncome ? COLORS.income : COLORS.expense}
            color="blue"
          />
        </View>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionCategory}>{item.category}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              { color: isIncome ? COLORS.income : COLORS.expense },
            ]}
          >
            {isIncome ? "+" : "-"} KES {Math.abs(amountNum).toFixed(2)}
          </Text>
          <Text style={styles.transactionDate}>
            {item.created_at ? formatDate(item.created_at) : "-"}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
      </TouchableOpacity>
    </View>
  );
};
