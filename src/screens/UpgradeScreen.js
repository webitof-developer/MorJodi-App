import React, { useEffect, useState, useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import RazorpayCheckout from 'react-native-razorpay';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import { fetchSubscription, setSubscription } from '../redux/slices/subscriptionSlice';
import { fetchUserData } from '../redux/actions/authActions';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';
import { LanguageContext } from '../contexts/LanguageContext';


import CustomHeader from '../components/CustomHeader';
import SkeletonUpgrade from '../components/SkeletonUpgrade';

const UpgradeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { subscription } = useSelector(state => state.subscription);
  const auth = useSelector(state => state.auth);
  const token = auth?.token;
  const hasPaidActive =
    subscription?.status === 'active' &&
    subscription?.subscription?.plan &&
    subscription.subscription.plan.isFree === false;

  // ---------------- STATE ----------------
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [contactNumber, setContactNumber] = useState(null);
  const [contactEmail, setContactEmail] = useState(null);

  const [walletBalance, setWalletBalance] = useState(0);
  const [walletUse, setWalletUse] = useState(0);
  const [masterFeatures, setMasterFeatures] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const { language } = useContext(LanguageContext);

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    fetchPlans();
    fetchContactInfo();
    fetchMasterFeatures();
    if (token) {
      fetchWallet();
      dispatch(fetchSubscription());
    }
  }, [token]);

  // Prevent selecting free plan when a paid plan is active
  useEffect(() => {
    if (hasPaidActive && selectedPlan?.isFree) {
      const paidPlan = plans.find(p => !p.isFree);
      if (paidPlan) {
        setSelectedPlan(paidPlan);
        setSelectedDuration(Math.max(1, paidPlan.durationInDays / 30 || 1));
      }
    }
  }, [hasPaidActive, selectedPlan, plans]);

  useEffect(() => {
    if (!couponStatus) return;
    setCouponStatus(null);
    setCouponError('');
  }, [selectedPlan?._id, selectedDuration]);

  const fetchMasterFeatures = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/plans/features`);
      setMasterFeatures(data);
    } catch (err) {
      // //console.error("Master features fetch error:", err?.response?.data || err);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/plans`);
      setPlans(data);
      if (subscription?.status === 'active' && subscription?.subscription?.plan) {
        const activePlan = data.find(
          p => p._id === subscription.subscription.plan._id,
        );
        setSelectedPlan(activePlan);
        const durationFromApi =
          subscription.subscription.durationMonths ||
          Math.max(
            1,
            Math.round(
              (new Date(subscription.subscription.endDate) -
                new Date(subscription.subscription.startDate)) /
              ((activePlan?.durationInDays || 30) * 24 * 60 * 60 * 1000),
            ),
          );
        setSelectedDuration(durationFromApi);
      } else if (data.length > 0) {
        const firstPaid = hasPaidActive ? data.find(p => !p.isFree) : null;
        setSelectedPlan(firstPaid || data[0]);
      }
    } catch (err) {
      // //console.error("Plans fetch error:", err?.response?.data || err);
      Alert.alert(
        i18n.t('upgrade.common.error'),
        i18n.t('upgrade.alerts.planLoadFailed')
      );

    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/user/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWalletBalance(Number(data?.balance || 0));
    } catch (err) {
      // //console.error("Wallet fetch error:", err?.response?.data || err);
      if (err?.response?.status === 401)
        Alert.alert(
          i18n.t('upgrade.common.sessionExpired'),
          i18n.t('upgrade.alerts.loginAgain')
        );

    }
  };

  const fetchContactInfo = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/contact`);
      setContactNumber(data.data[0].phone);
      setContactEmail(data.data[0].email);
    } catch (err) {
      // //console.error("Contact fetch error:", err?.response?.data || err);
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponError(i18n.t('upgrade.coupon.enterCode'));
      return;
    }
    if (!selectedPlan || selectedPlan.isFree) {
      setCouponError(i18n.t('upgrade.coupon.notAvailable'));
      return;
    }
    if (!token) {
      setCouponError(i18n.t('upgrade.alerts.loginFirst'));
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError('');
      const { data } = await axios.post(
        `${API_BASE_URL}/api/coupons/apply`,
        {
          code,
          planId: selectedPlan._id,
          monthsToBuy: selectedDuration,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCouponStatus({
        code: data.code,
        discountAmount: Number(data.discountAmount || 0),
        finalAmount: Number(data.finalAmount || 0),
        type: data.type,
        value: data.value,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message || i18n.t('upgrade.coupon.applyFailed');
      setCouponStatus(null);
      setCouponError(message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponStatus(null);
    setCouponCode('');
    setCouponError('');
  };

  // ---------------- PRICE CALCULATION ----------------
  const pricing = useMemo(() => {
    if (!selectedPlan) {
      return {
        basePrice: 0,
        totalPlanPrice: 0,
        discountAmount: 0,
        discountedTotal: 0,
      };
    }

    const base =
      selectedPlan.offerPrice && selectedPlan.offerPrice < selectedPlan.price
        ? selectedPlan.offerPrice
        : selectedPlan.price;

    const totalPlanPrice = base * selectedDuration;
    const discountAmount = Math.min(
      Number(couponStatus?.discountAmount || 0),
      totalPlanPrice,
    );
    const discountedTotal = Math.max(totalPlanPrice - discountAmount, 0);

    return { basePrice: base, totalPlanPrice, discountAmount, discountedTotal };
  }, [selectedPlan, selectedDuration, couponStatus]);

  const finalPayable = useMemo(() => {
    return Math.max(pricing.discountedTotal - walletUse, 0);
  }, [pricing.discountedTotal, walletUse]);

  const formatMoney = (value) => Number(value || 0).toFixed(2);

  useEffect(() => {
    const maxWalletUse = Math.min(walletBalance, pricing.discountedTotal || 0);
    if (walletUse > maxWalletUse) {
      setWalletUse(maxWalletUse);
    }
  }, [walletBalance, pricing.discountedTotal, walletUse]);

  // ---------------- PAYMENT HANDLER ----------------
  const handlePayment = async plan => {
    if (!token) return Alert.alert(
      i18n.t('upgrade.common.error'),
      i18n.t('upgrade.alerts.loginFirst')
    );
    ;
    if (hasPaidActive && plan?.isFree) {
      return Alert.alert(
        i18n.t('upgrade.common.error'),
        'You already have a paid plan. Free plan is not available while premium is active.'
      );
    }
    if (!plan) return Alert.alert(
      i18n.t('upgrade.common.error'),
      i18n.t('upgrade.alerts.selectPlan')
    );
    ;

    if (plan.isFree) {
      try {
        setProcessing(true);
        const res = await axios.post(
          `${API_BASE_URL}/api/plans/activate-free-plan`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res?.data) {
          dispatch(setSubscription(res.data));
        }
        await dispatch(fetchSubscription());
        await dispatch(fetchUserData());
        Alert.alert(
          i18n.t('upgrade.common.success'),
          i18n.t('upgrade.alerts.freePlanActivated')
        );

      } catch (err) {
        // //console.error(
        //   'Free plan activation error:',
        //   err?.response?.data || err,
        // );
        Alert.alert(
          i18n.t('upgrade.common.error'),
          i18n.t('upgrade.alerts.freePlanFailed')
        );

      } finally {
        setProcessing(false);
      }
      return;
    }

    try {
      setProcessing(true);

      const { data } = await axios.post(
        `${API_BASE_URL}/api/payment/create-order`,
        {
          planId: plan._id,
          walletBalanceToUse: Math.min(
            walletUse,
            walletBalance,
            pricing.discountedTotal,
          ),
          monthsToBuy: selectedDuration,
          couponCode: couponStatus?.code || '',
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // 🔸 Wallet Only Payment
      if (data.walletOnly || finalPayable <= 0) {
        const verifyRes = await axios.post(
          `${API_BASE_URL}/api/payment/verify`,
          {
            razorpay_order_id: data.order.id,
            notes: data.order.notes,
            planId: plan._id,
            walletBalanceToUse: walletUse,
            monthsToBuy: selectedDuration,
            couponCode: couponStatus?.code || '',
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (verifyRes?.data) {
          dispatch(setSubscription(verifyRes.data));
        }
        await dispatch(fetchSubscription());
        await dispatch(fetchUserData());
        await fetchWallet();
        Alert.alert(
          i18n.t('upgrade.common.success'),
          i18n.t('upgrade.alerts.walletSuccess')
        );
        handleRemoveCoupon();
        return;

      }

      // 🔹 Razorpay Payment
      const { key, order } = data;
      const options = {
        description: `${plan.name} Subscription`,
        currency: order.currency,
        key,
        amount: order.amount,
        name: 'MorJodi Premium',
        order_id: order.id,
        prefill: {
          email: auth?.user?.email || 'test@example.com',
          contact: auth?.user?.phoneNumber || '9999999999',
          name: auth?.user?.name || 'User',
        },
        theme: { color: COLORS.primary },
      };

      const paymentData = await RazorpayCheckout.open(options);

      const verifyRes = await axios.post(
        `${API_BASE_URL}/api/payment/verify`,
        {
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
          planId: plan._id,
          walletBalanceToUse: walletUse,
          monthsToBuy: selectedDuration,
          couponCode: couponStatus?.code || '',
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (verifyRes?.data) {
        dispatch(setSubscription(verifyRes.data));
      }
      await dispatch(fetchSubscription());
      await dispatch(fetchUserData());
      await fetchWallet();
      Alert.alert(
        i18n.t('upgrade.common.success'),
        i18n.t('upgrade.alerts.paymentSuccess')
      );
      handleRemoveCoupon();

    } catch (err) {
      // //console.error('Payment error:', err?.response?.data || err);
      if (!String(err?.code || '').includes('USER_CANCELLED')) {
        Alert.alert(
          i18n.t('upgrade.common.error'),
          i18n.t('upgrade.alerts.paymentFailed')
        );

      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCall = () => {
    if (contactNumber) {
      Linking.openURL(`tel:${contactNumber}`);
    }
  };

  const handleEmail = () => {
    if (contactEmail) {
      Linking.openURL(`mailto:${contactEmail}`);
    }
  };

  const activePlanId = subscription?.subscription?.plan?._id;
  const activeDuration =
    subscription?.subscription?.durationMonths ||
    (subscription?.subscription?.startDate &&
      subscription?.subscription?.endDate &&
      Math.max(
        1,
        Math.round(
          (new Date(subscription.subscription.endDate) -
            new Date(subscription.subscription.startDate)) /
          (
            ((subscription?.subscription?.plan?.durationInDays ||
              selectedPlan?.durationInDays ||
              30) *
              24 *
              60 *
              60 *
              1000)
          )
        )
      )) ||
    1;

  const isPlanActive = useMemo(() => {
    if (
      subscription?.status !== 'active' ||
      !activePlanId ||
      !selectedPlan?._id
    )
      return false;
    if (selectedPlan._id !== activePlanId) return false;
    // same plan: block if trying to buy same or shorter duration (downgrade)
    return selectedDuration <= activeDuration;
  }, [subscription, selectedPlan, selectedDuration, activePlanId, activeDuration]);

  const isFreeBlocked = hasPaidActive && selectedPlan?.isFree;

  // ---------------- RENDER ----------------
  if (loading)
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
        <CustomHeader titleKey="tabs.upgrade" navigation={navigation} />
        <SkeletonUpgrade />
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <CustomHeader titleKey="tabs.upgrade" navigation={navigation} />
      <ScrollView style={styles.container}>
        <View style={{ alignItems: 'flex-end', padding: 10 }}>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.helpButtonText}>   {i18n.t('upgrade.needHelp')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{i18n.t('upgrade.section.planDuration')}</Text>
        {/* Duration Selection */}
        <View
          style={[
            styles.durationRow,
            selectedPlan?.isFree && styles.disabledSection,
          ]}
        >
          {[1, 3, 6].map(m => (
            <TouchableOpacity
              key={m}
              style={[
                styles.durationBox,
                selectedDuration === m && styles.selectedDuration,
              ]}
              onPress={() => setSelectedDuration(m)}
              disabled={
                selectedPlan?.isFree ||
                (subscription?.status === 'active' &&
                  selectedPlan?._id === activePlanId &&
                  m < activeDuration) // no downgrade
              }
            >
              <Text style={styles.durationText}>{i18n.t('upgrade.month', { count: m })}</Text>
            </TouchableOpacity>
          ))}
        </View>


        {subscription?.status === 'active' && (
          <View style={styles.activePlanSimpleCard}>
            <Text style={styles.activePlanSimpleTitle}>
              {i18n.t('upgrade.activePlanDetails')}
            </Text>
            <Text style={styles.activePlanLine}>
              {i18n.t('upgrade.plan')}: {subscription.subscription.plan.name}
            </Text>
            <Text style={styles.activePlanLine}>
              {i18n.t('upgrade.activatedOn')}: {' '}
              {new Date(
                subscription.subscription.activatedOn ||
                subscription.subscription.startDate,
              ).toLocaleDateString()}
            </Text>
            <Text style={styles.activePlanLine}>
              {i18n.t('upgrade.expiresOn')}: {' '}
              {new Date(subscription.subscription.endDate).toLocaleDateString()}
            </Text>
          </View>
        )}


        <View style={styles.billingGrid}>
          <View
            style={[
              styles.billingBox,
              selectedPlan?.isFree && styles.disabledSection,
            ]}
          >
            <View style={styles.billingHeader}>
              <Text style={styles.label}>{i18n.t('upgrade.billing.summary')}</Text>
              <Text style={styles.walletBalanceText}>
                {i18n.t('upgrade.walletBalance', { amount: walletBalance })}
              </Text>
            </View>

            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>{i18n.t('upgrade.billing.planTotal')}</Text>
              <Text style={styles.billingValue}>₹{formatMoney(pricing.totalPlanPrice)}</Text>
            </View>
            {pricing.discountAmount > 0 && (
              <View style={styles.billingRow}>
                <Text style={[styles.billingLabel, styles.discountText]}>
                  {i18n.t('upgrade.billing.couponDiscount')}
                </Text>
                <Text style={[styles.billingValue, styles.discountText]}>
                  -₹{formatMoney(pricing.discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.walletRow}>
              <Text style={styles.billingLabel}>{i18n.t('upgrade.billing.useWallet')}</Text>
              <View style={styles.walletControls}>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => setWalletUse(Math.max(walletUse - 100, 0))}
                  disabled={selectedPlan?.isFree || walletUse <= 0}
                >
                  <Text style={styles.adjustText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.walletUseText}>₹{walletUse}</Text>

                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() =>
                    setWalletUse(
                      Math.min(walletUse + 100, walletBalance, pricing.discountedTotal),
                    )
                  }
                  disabled={
                    selectedPlan?.isFree ||
                    walletUse >= walletBalance ||
                    walletUse >= pricing.discountedTotal
                  }
                >
                  <Text style={styles.adjustText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.billingDivider} />
            <View style={styles.billingRow}>
              <Text style={styles.totalLabel}>{i18n.t('upgrade.billing.finalPayable')}</Text>
              <Text style={styles.totalText}>₹{formatMoney(finalPayable)}</Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.couponBox,
            selectedPlan?.isFree && styles.disabledSection,
          ]}
        >
          <View style={styles.couponHeaderRow}>
            <Text style={styles.couponTitle}>
              {i18n.t('upgrade.coupon.title')}
            </Text>
            {couponStatus && (
              <Text style={styles.couponBadge}>
                {i18n.t('upgrade.coupon.applied')}
              </Text>
            )}
          </View>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder={i18n.t('upgrade.coupon.placeholder')}
              placeholderTextColor={COLORS.gray}
              value={couponCode}
              onChangeText={text => {
                setCouponCode(text);
                setCouponError('');
              }}
              editable={!selectedPlan?.isFree && !processing}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[
                styles.couponButton,
                (couponLoading || selectedPlan?.isFree || processing) &&
                styles.couponButtonDisabled,
              ]}
              onPress={handleApplyCoupon}
              disabled={couponLoading || selectedPlan?.isFree || processing}
            >
              {couponLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.couponButtonText}>
                  {i18n.t('upgrade.coupon.apply')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {couponStatus && (
            <View style={styles.couponMetaRow}>
              <Text style={styles.couponMetaText}>
                {i18n.t('upgrade.coupon.appliedCode', {
                  code: couponStatus.code,
                })}
              </Text>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Text style={styles.couponRemoveText}>
                  {i18n.t('upgrade.coupon.remove')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {couponError ? (
            <Text style={styles.couponError}>{couponError}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>{i18n.t('upgrade.features')}</Text>
        <View style={styles.comparisonWrapper}>
          <View style={styles.featureCol}>
            {masterFeatures.map(feature => {
              if (feature === 'Contact View') {
                return (
                  <React.Fragment key={feature}>
                    <Text style={styles.featureLabel}>Contact View (Daily)</Text>
                    <Text style={styles.featureLabel}>Contact View (Monthly)</Text>
                  </React.Fragment>
                );
              }
              return (
                <Text key={feature} style={styles.featureLabel}>
                  {feature}
                </Text>
              );
            })}
          </View>

          {plans.map(plan => (
            <TouchableOpacity
              key={plan._id}
              style={[
                styles.planCol,
                selectedPlan?._id === plan._id && styles.selectedPlan,
                hasPaidActive && plan.isFree && styles.disabledSection,
              ]}
              onPress={() => {
                if (hasPaidActive && plan.isFree) return;
                setSelectedPlan(plan);
              }}
              disabled={processing || (hasPaidActive && plan.isFree)}
            >
              <View style={styles.planHeaderRow}>
                <Text style={styles.planHeader}>{plan.name}</Text>
                {subscription?.status === 'active' && plan._id === activePlanId && (
                  <Text style={styles.planActiveBadge}>Active</Text>
                )}
              </View>
              {masterFeatures.map(featureName => {
                const planFeature = plan.features.find(
                  f => f.name === featureName,
                );
                const hasFeature = !!planFeature;

                // 🌟 SPECIAL HANDLING: Split "Contact View" into Daily & Monthly
                if (featureName === 'Contact View') {
                  const dailyLimit =
                    planFeature?.dailyLimit ?? planFeature?.limit ?? 0;
                  const monthlyLimit = planFeature?.monthlyLimit ?? 0;

                  const dailyText =
                    dailyLimit === 0 ? ' (Unlimited)' : ` (${dailyLimit}/day)`;
                  const monthlyText =
                    monthlyLimit === 0 ? ' (Unlimited)' : ` (${monthlyLimit}/mo)`;

                  return (
                    <React.Fragment key={featureName}>
                      {/* 1. Daily Row */}
                      <View style={styles.featureItem}>
                        <Icon
                          name={
                            hasFeature ? 'checkmark-circle' : 'close-circle'
                          }
                          size={18}
                          color={hasFeature ? COLORS.success : COLORS.gray}
                          style={styles.icon}
                        />
                        {hasFeature && (
                          <Text style={styles.limitText}>{dailyText}</Text>
                        )}
                      </View>

                      {/* 2. Monthly Row */}
                      <View style={styles.featureItem}>
                        <Icon
                          name={
                            hasFeature ? 'checkmark-circle' : 'close-circle'
                          }
                          size={18}
                          color={hasFeature ? COLORS.success : COLORS.gray}
                          style={styles.icon}
                        />
                        {hasFeature && (
                          <Text style={styles.limitText}>{monthlyText}</Text>
                        )}
                      </View>
                    </React.Fragment>
                  );
                }

                // 🔹 STANDARD HANDLING (Other features)
                let limitText = '';
                if (hasFeature) {
                  if (planFeature.limit === 0) {
                    limitText = ' (Unlimited)';
                  } else if (planFeature.limit > 0) {
                    limitText = ` (${planFeature.limit}/day)`;
                  }
                }

                return (
                  <View key={featureName} style={styles.featureItem}>
                    <Icon
                      name={hasFeature ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={hasFeature ? COLORS.success : COLORS.gray}
                      style={styles.icon}
                    />
                    {hasFeature && (
                      <Text style={styles.limitText}>{limitText}</Text>
                    )}
                  </View>
                );
              })}
            </TouchableOpacity>
          ))}
        </View>

        {selectedPlan && (
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              isPlanActive && styles.disabledCheckoutButton,
              isFreeBlocked && styles.disabledCheckoutButton,
              processing && { opacity: 0.7 },
            ]}
            disabled={processing || isPlanActive || isFreeBlocked}
            onPress={() => handlePayment(selectedPlan)}
          >
            {processing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.checkoutText}>
                {selectedPlan.isFree
                  ? isPlanActive
                    ? i18n.t('upgrade.currentPlan')
                    : isFreeBlocked
                      ? i18n.t('upgrade.currentPlan')
                      : i18n.t('upgrade.activate')
                  : subscription?.status === 'active'
                    ? i18n.t('upgrade.upgrade')
                    : i18n.t('upgrade.pay', { amount: formatMoney(finalPayable) })}
              </Text>

            )}
          </TouchableOpacity>
        )}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => {
            setModalVisible(!isModalVisible);
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{i18n.t('upgrade.needHelpTitle')}</Text>
              <Text style={styles.modalSubtitle}>
                {i18n.t('upgrade.needHelpTitle')}
              </Text>
              <View style={styles.helpOptions}>
                <TouchableOpacity
                  style={styles.helpOption}
                  onPress={handleCall}
                >
                  <Icon name="call-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.helpOptionText}>{i18n.t('upgrade.callUs')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.helpOption}
                  onPress={handleEmail}
                >
                  <Icon
                    name="mail-unread-outline"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.helpOptionText}>{i18n.t('upgrade.emailUs')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff', paddingHorizontal: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  title: {
    ...FONTS.h3,
    textAlign: 'start',
    marginVertical: 10,
    color: COLORS.black,
  },
  helpButton: {
    padding: 5,
  },
  helpButtonText: {
    ...FONTS.body4,
    color: COLORS.primary,
  },
  sectionTitle: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  durationBox: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  selectedDuration: { borderColor: COLORS.primary, backgroundColor: '#fff1f4' },
  durationText: { ...FONTS.body3, color: COLORS.darkGray, textAlign: 'center' },


  billingGrid: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  billingBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000000ff',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  billingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletBalanceText: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  billingLabel: {
    ...FONTS.body4,
    color: COLORS.darkGray,
  },
  billingValue: {
    ...FONTS.body4,
    color: COLORS.darkGray,
  },
  billingDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    marginVertical: 10,
  },
  totalLabel: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },
  walletControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: { ...FONTS.body4, color: COLORS.darkGray },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  adjustBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustText: { ...FONTS.h2, color: COLORS.white },
  walletUseText: {
    ...FONTS.body3,
    color: COLORS.primary,
    marginHorizontal: 12,
  },
  totalText: {
    ...FONTS.h3,
    textAlign: 'right',
    marginTop: 10,
    color: COLORS.primary,
  },
  discountText: {
    ...FONTS.body4,
    color: COLORS.success,
    marginTop: 4,
  },
  couponBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginHorizontal: 4,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#c7c7c7ff',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  couponHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponTitle: {
    ...FONTS.h4,
    color: COLORS.darkGray,
  },
  couponBadge: { ...FONTS.body5, color: COLORS.success },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    color: COLORS.darkGray,
  },
  couponButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  couponButtonDisabled: {
    opacity: 0.6,
  },
  couponButtonText: {
    ...FONTS.body4,
    color: COLORS.white,
  },
  couponMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  couponMetaText: {
    ...FONTS.body4,
    color: COLORS.darkGray,
  },
  couponRemoveText: {
    ...FONTS.body4,
    color: COLORS.primary,
  },
  couponError: {
    ...FONTS.body5,
    color: COLORS.primary,
    marginTop: 6,
  },
  activePlanSimpleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 4,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  activePlanSimpleTitle: {
    ...FONTS.body3,
    color: COLORS.primary,
    marginBottom: 6,
  },
  activePlanLine: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  comparisonWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  featureCol: {
    flex: 1,
    paddingTop: 30,
  },
  featureLabel: {
    ...FONTS.body4,
    color: COLORS.darkGray,
    marginBottom: 10,
  },
  planCol: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  selectedPlan: {
    borderColor: COLORS.primary,
    backgroundColor: '#fff4f6',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planHeader: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },
  planActiveBadge: {
    ...FONTS.body5,
    color: COLORS.success,
  },
  icon: { marginRight: 4 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  limitText: { ...FONTS.body5, color: COLORS.gray },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    marginHorizontal: 12,
    borderRadius: 16,
    marginVertical: 18,
  },
  disabledCheckoutButton: {
    backgroundColor: COLORS.gray,
  },
  disabledSection: {
    opacity: 0.5,
  },
  checkoutText: { ...FONTS.h3, color: COLORS.white, textAlign: 'center' },
  planContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    elevation: 3,
  },
  planTitle: {
    ...FONTS.h3,
    color: COLORS.primary,
    marginBottom: 10,
  },
  planPrice: {
    ...FONTS.h2,
    color: COLORS.darkGray,
    marginBottom: 15,
  },
  planFeatures: {
    alignItems: 'flex-start',
  },
  featureText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: 8,
  },
  selectedPlanCard: {
    borderColor: COLORS.primary,
    transform: [{ scale: 1.05 }],
  },
  popularBadge: {
    backgroundColor: COLORS.secondary,
    position: 'absolute',
    top: -10,
    right: -10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    transform: [{ rotate: '15deg' }],
  },
  badgeText: {
    ...FONTS.body5,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...FONTS.h3,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...FONTS.body4,
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.gray,
  },
  helpOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  helpOption: {
    alignItems: 'center',
  },
  helpOptionText: {
    ...FONTS.body4,
    color: COLORS.primary,
    marginTop: 5,
  },
});

export default UpgradeScreen;
