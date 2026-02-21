import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import WalletHistory from '../components/WalletHistory';
import { API_BASE_URL } from '../constants/config';
import i18n from '../localization/i18n';

const WalletScreen = ({ navigation }) => {
  const { token } = useSelector(state => state.auth);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const walletResponse = await fetch(`${API_BASE_URL}/api/user/wallet`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const transactionsResponse = await fetch(
          `${API_BASE_URL}/api/user/transactions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const walletData = await walletResponse.json();
        const transactionsData = await transactionsResponse.json();

        setWallet(walletData);
        setTransactions(transactionsData);
        setLoading(false);
      } catch (error) {
        // //console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 💳 Wallet Header */}
      <View style={styles.walletInfo}>
        <FontAwesome name="google-wallet" size={24} color={COLORS.white} />
        <Text style={styles.balanceText}>
           {i18n.t('wallet.balance')}: ₹{wallet ? wallet.balance : '0.00'}
        </Text>
      </View>

      {/* 🧾 Transaction History */}
      <View style={styles.history}>
        <Text style={styles.title}>{i18n.t('wallet.transactionHistory')}</Text>

        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={({ item }) => <WalletHistory transaction={item} />}
            keyExtractor={item => item._id.toString()}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="history" size={60} color={COLORS.gray} />
            <Text style={styles.emptyText}> {i18n.t('wallet.noTransactions')}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  walletInfo: {
    padding: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  balanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  history: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '400',
    margin: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});

export default WalletScreen;
