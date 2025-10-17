import { View, Text } from "react-native";
import { styles } from "@/assets/styles/home.styles";
import { COLORS } from "@/constants/colors";
import { formatAmount } from "@/lib/utils";

export type BalanceSummary = {
  balance: number | string;
  income: number | string;
  expenses: number | string;
};

type BalanceCardProps = {
  summary: BalanceSummary;
};

export const BalanceCard = ({ summary }: BalanceCardProps) => {
  console.log(summary);
  const balanceNum =
    typeof summary.balance === "number"
      ? summary.balance
      : parseFloat(String(summary.balance ?? 0));
  const incomeNum =
    typeof summary.income === "number"
      ? summary.income
      : parseFloat(String(summary.income ?? 0));
  const expensesNum =
    typeof summary.expenses === "number"
      ? summary.expenses
      : parseFloat(String(summary.expenses ?? 0));

  return (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceTitle}>Total Balance</Text>
      <Text style={styles.balanceAmount}>KES {formatAmount(balanceNum)}</Text>
      <View style={styles.balanceStats}>
        <View style={styles.balanceStatItem}>
          <Text style={styles.balanceStatLabel}>Income</Text>
          <Text style={[styles.balanceStatAmount, { color: COLORS.income }]}>
            + KES {formatAmount(incomeNum)}
          </Text>
        </View>
        <View style={[styles.balanceStatItem, styles.statDivider]} />
        <View style={styles.balanceStatItem}>
          <Text style={styles.balanceStatLabel}>Expenses</Text>
          <Text style={[styles.balanceStatAmount, { color: COLORS.expense }]}>
            - KES {formatAmount(expensesNum)}
          </Text>
        </View>
      </View>
    </View>
  );
};
