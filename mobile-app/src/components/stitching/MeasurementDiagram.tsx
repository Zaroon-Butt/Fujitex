import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { DIAGRAM_IMAGE } from '@/features/stitching/diagramAsset';
import { DIAGRAM_HOTSPOTS, type MeasurementKey } from '@/features/stitching/measurements';
import { ThemedText } from '@/components/ui/ThemedText';
import {
  ms,
  palette,
  radius,
  spacing,
  useColors,
  useIsDark,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

interface Props {
  /** The focused field — drives which part of the diagram is highlighted. */
  activeField: MeasurementKey | null;
  activeLabel?: string;
}

/* ---------------------------------------------------------------------------
 * Diagram geometry — ported 1:1 from the web SchematicDiagram so the mobile and
 * storefront artwork stay pixel-identical. Authored in a 1000×560 user space
 * (25:14 aspect ratio). For each measurement we store a double-headed arrow plus
 * the yellow numbered badge that labels it. `n` matches DIAGRAM_HOTSPOTS so the
 * schematic and the reference PNG agree.
 * ------------------------------------------------------------------------- */
const VB_W = 1000;
const VB_H = 560;

interface Arrow {
  n: number;
  /** Double-headed measurement line. */
  line: [x1: number, y1: number, x2: number, y2: number];
  /** Yellow numbered badge centre. */
  badge: [x: number, y: number];
  /** Optional point on the garment the badge connects to (for offset badges). */
  lead?: [x: number, y: number];
}

const ARROWS: Record<MeasurementKey, Arrow> = {
  // Kameez
  kameezLength: { n: 1, line: [148, 92, 148, 480], badge: [148, 286] },
  shoulder: { n: 2, line: [248, 106, 412, 106], badge: [330, 106] },
  chest: { n: 3, line: [256, 205, 404, 205], badge: [330, 205] },
  waist: { n: 4, line: [252, 300, 408, 300], badge: [330, 300] },
  hips: { n: 5, line: [244, 388, 416, 388], badge: [330, 388] },
  armhole: { n: 6, line: [250, 104, 252, 186], badge: [205, 150], lead: [251, 150] },
  collar: { n: 7, line: [305, 74, 355, 74], badge: [330, 48], lead: [330, 73] },
  cuff: { n: 8, line: [464, 314, 485, 285], badge: [516, 320], lead: [474, 299] },
  sleeveLength: { n: 12, line: [418, 100, 476, 290], badge: [520, 205], lead: [447, 195] },
  ghair: { n: 11, line: [238, 502, 422, 502], badge: [330, 502] },
  // Shalwar
  shalwarWaist: { n: 11, line: [690, 106, 830, 106], badge: [760, 106] },
  shalwarLength: { n: 9, line: [862, 122, 856, 488], badge: [888, 305], lead: [859, 305] },
  paancha: { n: 10, line: [700, 503, 736, 503], badge: [718, 503] },
};

const GOLD = '#f5b301';
const ARROW_MUTED = '#94a3b8';
const INK = '#1c1917';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Padded bounding box around an arrow + its badge — drives the highlight box. */
function spotlightBox(a: Arrow) {
  const xs = [a.line[0], a.line[2], a.badge[0]];
  const ys = [a.line[1], a.line[3], a.badge[1]];
  if (a.lead) {
    xs.push(a.lead[0]);
    ys.push(a.lead[1]);
  }
  const pad = 30;
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX - pad, y: minY - pad, w: Math.max(...xs) - minX + pad * 2, h: Math.max(...ys) - minY + pad * 2 };
}

/** Open arrowhead (chevron) path of length `len` pointing from `from` → `tip`. */
function arrowHead(tipX: number, tipY: number, fromX: number, fromY: number, len: number): string {
  const dx = tipX - fromX;
  const dy = tipY - fromY;
  const m = Math.hypot(dx, dy) || 1;
  const ux = dx / m;
  const uy = dy / m;
  const a = (26 * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  // Backward vector (-u) rotated by ±a gives the two barbs.
  const b1x = -ux * ca + uy * sa;
  const b1y = -ux * sa - uy * ca;
  const b2x = -ux * ca - uy * sa;
  const b2y = ux * sa - uy * ca;
  return `M${tipX + len * b1x} ${tipY + len * b1y} L${tipX} ${tipY} L${tipX + len * b2x} ${tipY + len * b2y}`;
}

/** A double-headed measurement line with manual arrowheads at both ends. */
function MeasureLine({
  line,
  color,
  width,
  opacity = 1,
  head = 14,
}: {
  line: Arrow['line'];
  color: string;
  width: number;
  opacity?: number;
  head?: number;
}) {
  const [x1, y1, x2, y2] = line;
  return (
    <G opacity={opacity}>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <Path d={arrowHead(x2, y2, x1, y1, head)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={arrowHead(x1, y1, x2, y2, head)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

/**
 * Sizing diagram shown above the measurement form. Renders the reference PNG
 * when available (with a pulsing marker overlay), otherwise a fully annotated
 * built-in schematic with measurement arrows + numbered badges. The arrow/badge
 * for the currently focused input is highlighted in gold.
 */
export function MeasurementDiagram({ activeField, activeLabel }: Props) {
  const colors = useColors();
  const isDark = useIsDark();
  const styles = useThemedStyles(makeStyles);
  const hotspot = activeField ? DIAGRAM_HOTSPOTS[activeField] : null;
  const bg = (isDark ? [colors.surface, colors.bg] : [palette.gold[50], palette.white]) as [string, string];

  return (
    <View style={styles.root}>
      <LinearGradient colors={bg} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

      {/* Diagram surface — the artwork fills this box exactly (25:14). */}
      <View style={styles.surface}>
        {DIAGRAM_IMAGE ? (
          <>
            <Image source={DIAGRAM_IMAGE} contentFit="contain" style={StyleSheet.absoluteFill} />
            {hotspot && (
              <View
                pointerEvents="none"
                style={[
                  styles.pngMarker,
                  {
                    left: `${hotspot.x * 100}%` as DimensionValue,
                    top: `${hotspot.y * 100}%` as DimensionValue,
                  },
                ]}
              >
                <ThemedText weight="bold" color={INK} style={styles.pngMarkerText}>
                  {hotspot.n}
                </ThemedText>
              </View>
            )}
          </>
        ) : (
          <Schematic activeField={activeField} isDark={isDark} />
        )}
      </View>

      {/* Caption strip: helper hint, or the focused measurement's name. */}
      <View style={[styles.caption, { borderTopColor: colors.border }]}>
        {activeField && activeLabel ? (
          <ThemedText variant="caption" weight="semibold" color={isDark ? palette.gold[400] : palette.gold[600]}>
            {activeLabel}
          </ThemedText>
        ) : (
          <ThemedText variant="caption" muted>
            Tap a measurement to see where it goes
          </ThemedText>
        )}
      </View>
    </View>
  );
}

/** Annotated kameez + shalwar schematic with measurement arrows + badges. */
function Schematic({ activeField, isDark }: { activeField: MeasurementKey | null; isDark: boolean }) {
  const entries = Object.entries(ARROWS) as [MeasurementKey, Arrow][];
  const focused = activeField != null;
  const spot = activeField ? spotlightBox(ARROWS[activeField]) : null;
  const garment = isDark ? palette.brand[300] : palette.brand[500];

  // Expanding "ping" ring around the focused badge.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!activeField) return;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [activeField, pulse]);
  const pulseR = pulse.interpolate({ inputRange: [0, 1], outputRange: [17, 31] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  return (
    <Svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* ---- Spotlight box around the focused measurement ---- */}
      {spot && (
        <Rect
          x={spot.x}
          y={spot.y}
          width={spot.w}
          height={spot.h}
          rx={22}
          ry={22}
          fill={GOLD}
          fillOpacity={0.13}
          stroke={GOLD}
          strokeOpacity={0.45}
          strokeWidth={1.5}
        />
      )}

      {/* ---- Garment outlines (faded when one measurement is focused) ---- */}
      <G
        fill="none"
        stroke={garment}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={focused ? 0.36 : 0.8}
      >
        {/* Kameez (long-sleeve kurta) */}
        <Path d="M305 72 L245 92 L175 285 L196 314 L252 188 L238 480 L422 480 L408 188 L464 314 L485 285 L415 92 L355 72 Q330 96 305 72 Z" />
        {/* stand collar */}
        <Path d="M305 72 Q330 58 355 72" />
        {/* front placket */}
        <Path d="M330 96 L330 210" strokeWidth={2.2} />
        {/* buttons */}
        <Circle cx={330} cy={120} r={3.2} />
        <Circle cx={330} cy={150} r={3.2} />
        <Circle cx={330} cy={180} r={3.2} />

        {/* Shalwar (trousers) */}
        <Path d="M690 122 L700 488 L736 488 L760 312 L784 488 L820 488 L830 122 Z" />
        <Path d="M690 152 L830 152" strokeWidth={2.2} />
        {/* drawstring */}
        <Path d="M752 152 L748 176 M768 152 L772 176" strokeWidth={2} />
      </G>

      {/* ---- Measurement arrows (inactive first, active last so it sits on top) ---- */}
      {entries.map(([key, a]) =>
        key === activeField ? null : (
          <MeasureLine key={key} line={a.line} color={ARROW_MUTED} width={2} opacity={focused ? 0.12 : 1} />
        ),
      )}
      {activeField && <MeasureLine line={ARROWS[activeField].line} color={GOLD} width={3.5} head={17} />}

      {/* ---- Yellow numbered badges ---- */}
      {entries.map(([key, a]) => {
        const active = key === activeField;
        const [bx, by] = a.badge;
        const r = active ? 17 : 14;
        const fontSize = active ? 17 : 15;
        return (
          <G key={`b-${key}`} opacity={focused && !active ? 0.16 : 1}>
            {a.lead && (
              <Line x1={bx} y1={by} x2={a.lead[0]} y2={a.lead[1]} stroke={active ? GOLD : ARROW_MUTED} strokeWidth={1.5} />
            )}
            <Circle cx={bx} cy={by} r={r} fill={GOLD} stroke="#ffffff" strokeWidth={active ? 2.5 : 1.5} />
            <SvgText
              x={bx}
              y={by + fontSize * 0.34}
              fontSize={fontSize}
              fontWeight="700"
              fill={INK}
              textAnchor="middle"
            >
              {a.n}
            </SvgText>
          </G>
        );
      })}

      {/* ---- Pulsing ring on the focused badge ---- */}
      {activeField && (
        <AnimatedCircle
          cx={ARROWS[activeField].badge[0]}
          cy={ARROWS[activeField].badge[1]}
          r={pulseR}
          fill="none"
          stroke={GOLD}
          strokeWidth={2}
          opacity={pulseOpacity}
        />
      )}
    </Svg>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      width: '100%',
      borderRadius: radius['2xl'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    surface: { width: '100%', aspectRatio: 25 / 14 },
    caption: {
      minHeight: ms(34),
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
    },
    pngMarker: {
      position: 'absolute',
      width: ms(26),
      height: ms(26),
      borderRadius: ms(13),
      backgroundColor: GOLD,
      borderWidth: 2,
      borderColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ translateX: -ms(13) }, { translateY: -ms(13) }],
    },
    pngMarkerText: { fontSize: ms(11) },
  });
