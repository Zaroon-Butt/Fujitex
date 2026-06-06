import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MeasurementDiagram } from '@/components/stitching/MeasurementDiagram';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { isPurchasable } from '@/features/cart/mapper';
import { supportsStitching, useProduct } from '@/features/catalog/useProduct';
import { useCartActions } from '@/features/cart/store';
import { productToStitchedCartItem } from '@/features/stitching/mapper';
import { useStitchingPrice } from '@/features/stitching/useStitchingPrice';
import {
  allMeasurementFields,
  convertValue,
  kameezMeasurements,
  shalwarMeasurements,
  parseMeasurement,
  rangeFor,
  validateMeasurements,
  type MeasurementField,
  type MeasurementKey,
  type MeasurementUnit,
  type MeasurementValues,
} from '@/features/stitching/measurements';
import { formatPKR } from '@/lib/format';
import { ms, radius, shadows, spacing, useColors, useThemedStyles, type ThemeColors } from '@/theme';

const UNITS: { id: MeasurementUnit; label: string }[] = [
  { id: 'in', label: 'Inches' },
  { id: 'cm', label: 'Cm' },
];

export default function StitchingScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug);
  const { pricePaisas } = useStitchingPrice();
  const { add } = useCartActions();

  const [unit, setUnit] = useState<MeasurementUnit>('in');
  const [values, setValues] = useState<MeasurementValues>({});
  const [errors, setErrors] = useState<Partial<Record<MeasurementKey, string>>>({});
  const [activeField, setActiveField] = useState<MeasurementKey | null>(null);

  const activeLabel = useMemo(
    () => allMeasurementFields.find((f) => f.key === activeField)?.label,
    [activeField],
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Custom Stitching" />
        <View style={styles.loading}>
          <Skeleton width="100%" height={ms(150)} borderRadius={radius['2xl']} />
          <Skeleton width="100%" height={ms(320)} borderRadius={radius.lg} />
        </View>
      </View>
    );
  }

  // Stitching is men's-only and requires a buyable product.
  if (!product || !supportsStitching(product) || !isPurchasable(product)) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Custom Stitching" />
        <EmptyState
          icon="alert-circle"
          tone="error"
          title="Stitching unavailable"
          message="Custom stitching isn’t offered for this item."
          actionLabel="Back to shop"
          onAction={() => router.replace('/shop')}
        />
      </View>
    );
  }

  function changeUnit(next: MeasurementUnit) {
    if (next === unit) return;
    setValues((prev) => {
      const converted: MeasurementValues = {};
      for (const f of allMeasurementFields) {
        const v = prev[f.key as MeasurementKey];
        if (v !== undefined) converted[f.key as MeasurementKey] = convertValue(v, unit, next);
      }
      return converted;
    });
    setErrors({});
    setUnit(next);
  }

  function handleChange(key: MeasurementKey, value: number | undefined) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleAdd() {
    if (!product) return;
    const found = validateMeasurements(values, unit);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const firstKey = allMeasurementFields.find((f) => found[f.key as MeasurementKey])?.key;
      if (firstKey) setActiveField(firstKey as MeasurementKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    add(productToStitchedCartItem(product, { unit, values, feePaisas: pricePaisas }), 1);
    router.push('/cart');
  }

  const lineTotal = product.price_paisas + pricePaisas;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Custom Stitching" />
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
          <ThemedText variant="caption" muted>
            Enter your measurements for{' '}
            <ThemedText variant="caption" weight="semibold" color={colors.text}>
              {product.name}
            </ThemedText>
            . Tailored, stitched & delivered with your fabric.
          </ThemedText>

          {/* Sizing diagram — small, highlights the focused measurement */}
          <MeasurementDiagram activeField={activeField} activeLabel={activeLabel} />

          {/* Unit toggle */}
          <View style={styles.unitRow}>
            <View style={styles.unitLabel}>
              <Icon name="maximize-2" size={14} color={colors.textMuted} />
              <ThemedText variant="caption" muted>Units</ThemedText>
            </View>
            <View style={styles.unitToggle}>
              {UNITS.map((u) => {
                const active = unit === u.id;
                return (
                  <PressableScale
                    key={u.id}
                    onPress={() => changeUnit(u.id)}
                    activeScale={0.97}
                    style={[styles.unitOption, active && styles.unitOptionActive]}
                  >
                    <ThemedText weight={active ? 'bold' : 'medium'} color={active ? colors.white : colors.text}>
                      {u.label}
                    </ThemedText>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          <FieldGroup
            title="Kameez"
            fields={kameezMeasurements}
            unit={unit}
            values={values}
            errors={errors}
            onChange={handleChange}
            onFocusField={setActiveField}
          />
          <FieldGroup
            title="Shalwar"
            fields={shalwarMeasurements}
            unit={unit}
            values={values}
            errors={errors}
            onChange={handleChange}
            onFocusField={setActiveField}
          />

          {/* Price breakdown */}
          <View style={styles.priceCard}>
            <PriceRow label="Fabric" value={formatPKR(product.price_paisas)} />
            <PriceRow label="Custom stitching" value={`+ ${formatPKR(pricePaisas)}`} />
            <View style={styles.priceDivider} />
            <PriceRow label="Total per suit" value={formatPKR(lineTotal)} emphasize />
          </View>
        </ScrollView>

        {/* Sticky add-to-cart bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.flex}>
            <ThemedText variant="caption" muted>Total per suit</ThemedText>
            <ThemedText variant="h3" color={colors.primaryDark}>{formatPKR(lineTotal)}</ThemedText>
          </View>
          <Button label="Add to Cart" variant="gold" size="lg" leftIcon="scissors" onPress={handleAdd} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

interface GroupProps {
  title: string;
  fields: readonly MeasurementField[];
  unit: MeasurementUnit;
  values: MeasurementValues;
  errors: Partial<Record<MeasurementKey, string>>;
  onChange: (key: MeasurementKey, value: number | undefined) => void;
  onFocusField: (key: MeasurementKey | null) => void;
}

function FieldGroup({ title, fields, unit, values, errors, onChange, onFocusField }: GroupProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.groupCard}>
      <ThemedText variant="title" style={styles.groupTitle}>{title}</ThemedText>
      <View style={styles.grid}>
        {fields.map((f) => {
          const key = f.key as MeasurementKey;
          const value = values[key];
          const [min, max] = rangeFor(f, unit);
          return (
            <View key={key} style={styles.gridItem}>
              <TextField
                label={f.label}
                value={value === undefined || Number.isNaN(value) ? '' : String(value)}
                onChangeText={(t) => onChange(key, parseMeasurement(t))}
                onFocus={() => onFocusField(key)}
                error={errors[key]}
                keyboardType="numeric"
                placeholder={`${min}–${max}`}
                returnKeyType="next"
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PriceRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.priceRow}>
      <ThemedText variant={emphasize ? 'title' : 'body'} muted={!emphasize}>
        {label}
      </ThemedText>
      <ThemedText
        variant={emphasize ? 'title' : 'label'}
        weight={emphasize ? 'bold' : 'semibold'}
        color={emphasize ? colors.primaryDark : undefined}
      >
        {value}
      </ThemedText>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    loading: { padding: spacing.lg, gap: spacing.lg },
    content: { padding: spacing.lg, gap: spacing.lg },
    unitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    unitLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    unitToggle: {
      flexDirection: 'row',
      backgroundColor: colors.neutral[100],
      borderRadius: radius.full,
      padding: 4,
      gap: 4,
    },
    unitOption: { paddingVertical: spacing.xs, paddingHorizontal: spacing.base, borderRadius: radius.full },
    unitOptionActive: { backgroundColor: colors.primary },
    groupCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      ...shadows.sm,
    },
    groupTitle: { marginBottom: spacing.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
    gridItem: { width: '48%' },
    priceCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.xs,
      ...shadows.sm,
    },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    priceDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },
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
  });
