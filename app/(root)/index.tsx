import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, router, useRouter } from "expo-router";
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { SignOutButton } from "@/components/SignOutButton";
import { useTransactions } from "@/hooks/useTransactions";
import { useEffect, useMemo, useState } from "react";
import { styles } from "@/assets/styles/home.styles";
import { Ionicons } from "@expo/vector-icons";
import { BalanceCard } from "@/components/BalanceCard";
import type { BalanceSummary } from "@/components/BalanceCard";
import { TransactionItem } from "@/components/TransactionItem";
import PageLoader from "@/components/PageLoader";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    transactions,
    fetchTransactions,
    deleteTransaction,
    fetchSummary,
    summary,
    loading,
    error,
  } = useTransactions();

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(user?.id);
    await fetchSummary(user?.id);
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchTransactions(user.id);
      fetchSummary(user.id);
    }
  }, [user?.id, fetchTransactions, fetchSummary]);

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction(id),
        },
      ],
    );
  };

  if (loading && !refreshing) return <PageLoader />;

  const balanceSummary = useMemo<BalanceSummary | null>(() => {
    if (!summary) return null;

    const incomeTotal = summary.byCategory
      .filter((c) => c.category.toLowerCase() === "income")
      .reduce((acc, c) => acc + c.total_amount, 0);

    const expenseTotal = summary.byCategory
      .filter((c) => c.category && c.category.toLowerCase() !== "income")
      .reduce((acc, c) => acc + c.total_amount, 0);

    // Keep expenses negative to match BalanceCard’s current display logic
    const expensesSigned = -Math.abs(expenseTotal);

    return {
      balance: summary.total_amount,
      income: incomeTotal,
      expenses: expenseTotal,
    };
  }, [summary]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* LEFT */}
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.usernameText}>
                {user?.emailAddresses[0]?.emailAddress.split("@")[0]}
              </Text>
            </View>
          </View>
          {/* RIGHT */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/create")}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
            <SignOutButton />
          </View>
        </View>

        <BalanceCard
          summary={balanceSummary ?? { balance: 0, income: 0, expenses: 0 }}
        />

        <View style={styles.transactionsHeaderContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
      </View>
      {/* FlatList is a performant way to render long lists in React Native. */}
      {/* it renders items lazily — only those on the screen. */}
      <FlatList
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsListContent}
        data={transactions}
        renderItem={({ item }) => (
          <TransactionItem item={item} onDelete={handleDelete} />
        )}
        // ListEmptyComponent={<NoTransactionsFound />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
