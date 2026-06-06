import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { useProfile, useUser } from '@/features/auth/store';
import { useCartActions, useCartItems, useCartStitchingTotal, useCartSubtotal } from '@/features/cart/store';
import { placeOrder } from '@/features/checkout/placeOrder';
import { paymentOrder, paymentProviders } from '@/features/payments/providers';
import { ZONE_LABELS, useShippingRates, zoneForCity } from '@/features/shipping/useShippingRates';
import { formatPKR } from '@/lib/format';
import { font, ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';
import type { PaymentMethod, ShippingZone } from '@/types/database';

export default function CheckoutScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const stitching = useCartStitchingTotal();
  const { clear } = useCartActions();
  const user = useUser();
  const profile = useProfile();
  const { data: rates = [] } = useShippingRates();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [zone, setZone] = useState<ShippingZone>('rest_of_pakistan');
  const [carrierId, setCarrierId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const zoneRates = useMemo(() => rates.filter((r) => r.zone === zone), [rates, zone]);
  const selectedRate = useMemo(
    () => zoneRates.find((r) => r.id === carrierId) ?? zoneRates[0],
    [zoneRates, carrierId],
  );
  const shippingPaisas = selectedRate?.base_paisas ?? 0;
  const total = subtotal + stitching + shippingPaisas;

  if (items.length === 0) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Checkout" />
        <EmptyState
          icon="shopping-bag"
          title="Your cart is empty"
          message="Add something to your cart before checking out."
          actionLabel="Browse shop"
          onAction={() => router.replace('/shop')}
        />
      </View>
    );
  }

  function pickZone(z: ShippingZone) {
    setZone(z);
    setCarrierId(null); // reset carrier to cheapest in the new zone
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Required';
    if (!/^[0-9+\-\s]{7,}$/.test(phone)) e.phone = 'Enter a valid phone number';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email';
    if (!line1.trim()) e.line1 = 'Required';
    if (!city.trim()) e.city = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onPlaceOrder() {
    if (!validate() || !selectedRate) return;
    setSubmitting(true);
    try {
      const order = await placeOrder({
        items,
        contactEmail: email,
        contactPhone: phone,
        shipFullName: fullName,
        shipLine1: line1,
        shipLine2: line2 || undefined,
        shipCity: city,
        shipProvince: province || undefined,
        shipZone: zone,
        shipCarrier: selectedRate.carrier,
        subtotalPaisas: subtotal,
        shippingPaisas,
        stitchingPaisas: stitching,
        totalPaisas: total,
        paymentMethod: method,
      });
      clear();
      router.replace(
        `/order-confirmation?order=${order.orderNumber}&total=${total}&method=${method}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Checkout" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + ms(56)}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: ms(140) + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Contact */}
          <Block title="Contact" icon="user">
            <TextField
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              placeholder="Ahmed Khan"
              autoCapitalize="words"
            />
            <TextField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              placeholder="03xx-xxxxxxx"
              keyboardType="phone-pad"
              icon="phone"
            />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail"
            />
          </Block>

          {/* Shipping address */}
          <Block title="Shipping address" icon="map-pin">
            <TextField label="Address line 1" value={line1} onChangeText={setLine1} error={errors.line1} placeholder="House, street, area" />
            <TextField label="Address line 2 (optional)" value={line2} onChangeText={setLine2} placeholder="Apartment, landmark" />
            <View style={styles.row}>
              <TextField
                containerStyle={styles.flex}
                label="City"
                value={city}
                onChangeText={(t) => {
                  setCity(t);
                  pickZone(zoneForCity(t));
                }}
                error={errors.city}
                placeholder="Lahore"
                autoCapitalize="words"
              />
              <TextField
                containerStyle={styles.flex}
                label="Province"
                value={province}
                onChangeText={setProvince}
                placeholder="Punjab"
                autoCapitalize="words"
              />
            </View>
          </Block>

          {/* Shipping method */}
          <Block title="Delivery" icon="truck">
            <View style={styles.zoneToggle}>
              {(['lahore', 'rest_of_pakistan'] as ShippingZone[]).map((z) => {
                const active = zone === z;
                return (
                  <PressableScale
                    key={z}
                    onPress={() => pickZone(z)}
                    activeScale={0.97}
                    style={[styles.zoneOption, active && styles.zoneOptionActive]}
                  >
                    <ThemedText weight={active ? 'bold' : 'medium'} color={active ? colors.white : colors.text} style={styles.zoneText}>
                      {ZONE_LABELS[z]}
                    </ThemedText>
                  </PressableScale>
                );
              })}
            </View>

            <View style={styles.carriers}>
              {zoneRates.map((r) => {
                const active = selectedRate?.id === r.id;
                return (
                  <PressableScale
                    key={r.id}
                    onPress={() => setCarrierId(r.id)}
                    activeScale={0.98}
                    style={[styles.optionRow, active && styles.optionRowActive]}
                  >
                    <Icon
                      name={active ? 'check-circle' : 'circle'}
                      size={20}
                      color={active ? colors.primary : colors.borderStrong}
                    />
                    <View style={styles.flex}>
                      <ThemedText variant="label" weight="semibold">
                        {r.carrier}
                      </ThemedText>
                      <ThemedText variant="caption" muted>
                        {r.eta_days_min}–{r.eta_days_max} business days
                      </ThemedText>
                    </View>
                    <ThemedText variant="label" weight="bold" color={colors.primaryDark}>
                      {formatPKR(r.base_paisas)}
                    </ThemedText>
                  </PressableScale>
                );
              })}
            </View>
          </Block>

          {/* Payment */}
          <Block title="Payment" icon="credit-card">
            {paymentOrder.map((m) => {
              const p = paymentProviders[m];
              const active = method === m;
              return (
                <PressableScale
                  key={m}
                  onPress={() => p.enabled && setMethod(m)}
                  disabled={!p.enabled}
                  activeScale={0.98}
                  style={[styles.optionRow, active && styles.optionRowActive, !p.enabled && styles.optionDisabled]}
                >
                  <Icon
                    name={active ? 'check-circle' : 'circle'}
                    size={20}
                    color={active ? colors.primary : colors.borderStrong}
                  />
                  <View style={styles.flex}>
                    <View style={styles.methodLabel}>
                      <ThemedText variant="label" weight="semibold">
                        {p.label}
                      </ThemedText>
                      {!p.enabled && <Chip label="Soon" tone="neutral" />}
                    </View>
                    <ThemedText variant="caption" muted>
                      {p.tagline}
                    </ThemedText>
                  </View>
                </PressableScale>
              );
            })}
          </Block>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <SummaryRow label="Subtotal" value={formatPKR(subtotal)} />
            {stitching > 0 && <SummaryRow label="Custom stitching" value={formatPKR(stitching)} />}
            <SummaryRow label={`Shipping${selectedRate ? ` · ${selectedRate.carrier}` : ''}`} value={formatPKR(shippingPaisas)} />
            <View style={styles.summaryDivider} />
            <SummaryRow label="Total" value={formatPKR(total)} emphasize />
          </View>
        </ScrollView>

        {/* Sticky place-order bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.flex}>
            <ThemedText variant="caption" muted>
              Total payable
            </ThemedText>
            <ThemedText variant="h3" color={colors.primaryDark}>
              {formatPKR(total)}
            </ThemedText>
          </View>
          <Button
            label="Place Order"
            variant="gold"
            size="lg"
            rightIcon="arrow-right"
            loading={submitting}
            onPress={onPlaceOrder}
            style={styles.placeBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Block({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <Icon name={icon} size={18} color={colors.primary} />
        <ThemedText variant="title">{title}</ThemedText>
      </View>
      <View style={styles.blockBody}>{children}</View>
    </View>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.summaryRow}>
      <ThemedText variant={emphasize ? 'title' : 'body'} muted={!emphasize}>
        {label}
      </ThemedText>
      <ThemedText variant={emphasize ? 'h3' : 'label'} weight={emphasize ? 'bold' : 'semibold'} color={emphasize ? colors.primaryDark : undefined}>
        {value}
      </ThemedText>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  block: { gap: spacing.md },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  blockBody: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  zoneToggle: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
  },
  zoneOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  zoneOptionActive: { backgroundColor: colors.primary },
  zoneText: { fontSize: font(13) },
  carriers: { gap: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  optionRowActive: { borderColor: colors.primary, backgroundColor: colors.brand[50] },
  optionDisabled: { opacity: 0.55 },
  methodLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  placeBtn: {},
});
