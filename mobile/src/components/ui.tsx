import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView,
  StyleProp, Switch, Text, TextInput, TextInputProps, TextProps, TextStyle, View, ViewStyle
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { usePortal } from '../state/portal'
import { fonts, radius, space, useStyles, useTheme } from '../theme'
import { Icon } from './Icon'

/* ───────── text (auto-translates French source strings when English is on, like tr() on the web) ───────── */
type Variant = 'body' | 'small' | 'h1' | 'h2' | 'h3' | 'big' | 'link' | 'eyebrow' | 'bold' | 'label' | 'err'
export function Txt({ v = 'body', color, style, children, raw, ...rest }: TextProps & { v?: Variant; color?: string; raw?: boolean }) {
  const c = useTheme()
  const { t } = usePortal()
  const base: Record<Variant, TextStyle> = {
    body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: c.ink },
    small: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: c.mute },
    bold: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    label: { fontFamily: fonts.sansSemi, fontSize: 14, color: c.ink },
    h1: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 38, color: c.heading },
    h2: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32, color: c.heading },
    h3: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 27, color: c.heading },
    big: { fontFamily: fonts.sansBold, fontSize: 28, color: c.heading },
    link: { fontFamily: fonts.sansSemi, fontSize: 14.5, color: c.accent, textDecorationLine: 'underline' },
    eyebrow: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.4, color: c.gold },
    err: { fontFamily: fonts.sansSemi, fontSize: 13.5, color: c.neg }
  }
  const tr = (n: React.ReactNode): React.ReactNode =>
    typeof n === 'string' && !raw ? t(n) : Array.isArray(n) ? n.map((x, i) => <React.Fragment key={i}>{tr(x)}</React.Fragment>) : n
  return (
    <Text {...rest} style={[base[v], color ? { color } : null, style]}>
      {tr(children)}
    </Text>
  )
}

/* ───────── toast ───────── */
const ToastCtx = createContext<(m: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const o = useRef(new Animated.Value(0)).current
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const insets = useSafeAreaInsets()
  const c = useTheme()
  const show = useCallback(
    (m: string) => {
      setMsg(m)
      if (timer.current) clearTimeout(timer.current)
      Animated.timing(o, { toValue: 1, duration: 160, useNativeDriver: true }).start()
      timer.current = setTimeout(() => {
        Animated.timing(o, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg(null))
      }, 2600)
    },
    [o]
  )
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 24, opacity: o,
            backgroundColor: c.navy2, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16,
            transform: [{ translateY: o.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }]
          }}
        >
          <Txt color="#fff" style={{ fontFamily: fonts.sansMed }}>{msg}</Txt>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  )
}

/* ───────── layout ───────── */
export function Screen({
  children, scroll = true, style, refresh, footer, keyboard = true
}: {
  children: React.ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle>; refresh?: () => Promise<void> | void
  footer?: React.ReactNode; keyboard?: boolean
}) {
  const c = useTheme()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      contentContainerStyle={[{ padding: space.lg, paddingBottom: space.xl + (footer ? 0 : insets.bottom), gap: space.md }, style]}
      refreshControl={
        refresh ? (
          <RefreshControl
            refreshing={refreshing}
            tintColor={c.gold}
            onRefresh={async () => {
              setRefreshing(true)
              await refresh()
              setRefreshing(false)
            }}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding: space.lg }, style]}>{children}</View>
  )
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={keyboard}>
      {body}
      {footer && (
        <View style={{ padding: space.lg, paddingBottom: space.lg + insets.bottom, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.line, gap: space.sm }}>
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const s = useStyles(c => ({
    card: { backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, padding: space.lg, gap: space.sm }
  }))
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    )
  return <View style={[s.card, style]}>{children}</View>
}

export const Gap = ({ h = space.md }: { h?: number }) => <View style={{ height: h }} />

export function Divider() {
  const c = useTheme()
  return <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
}

export function Row({ label, value, sub, bold, onValue, valueColor }: {
  label: React.ReactNode; value?: React.ReactNode; sub?: string; bold?: boolean; onValue?: () => void; valueColor?: string
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.md, paddingVertical: 5 }}>
      <View style={{ flex: 1 }}>
        <Txt v={bold ? 'bold' : 'body'}>{label}</Txt>
        {sub ? <Txt v="small">{sub}</Txt> : null}
      </View>
      {value != null && (
        <Pressable disabled={!onValue} onPress={onValue} style={{ flexShrink: 1, maxWidth: '58%' }}>
          <Txt v={onValue ? 'link' : 'bold'} style={{ textAlign: 'right' }} color={valueColor} raw={typeof value !== 'string'}>
            {value as any}
          </Txt>
        </Pressable>
      )}
    </View>
  )
}

/** Key/value block — website kv(). */
export const KVList = ({ rows }: { rows: [string, string][] }) => (
  <View>
    {rows.map(([k, v], i) => (
      <View key={i} style={{ paddingVertical: 7, gap: 2 }}>
        <Txt v="small">{k}</Txt>
        <Txt v="bold" style={{ fontFamily: fonts.sansSemi }}>{v}</Txt>
      </View>
    ))}
  </View>
)

/**
 * Heading with the web's gold rule (styles.css):
 *  - 'line' : 2px rule hugging the text (.greet, .card-panel h3, .cb-panel h3, .lim-block h4)
 *  - 'bar'  : 100×4 bar below the text (h3.ul on Home)
 *  - 'short': 44×2 bar below the text (.ledger-title)
 */
export function Heading({ children, v = 'h3', rule = 'line', raw, style }: {
  children: React.ReactNode; v?: Variant; rule?: 'line' | 'bar' | 'short'; raw?: boolean; style?: StyleProp<ViewStyle>
}) {
  const c = useTheme()
  const bar = rule === 'bar' ? { width: 100, height: 4, marginTop: 10 } : rule === 'short' ? { width: 44, height: 2, marginTop: 6 } : null
  return (
    <View style={[{ alignSelf: 'flex-start', flexShrink: 1 }, style]}>
      <View style={rule === 'line' ? { borderBottomWidth: 2, borderBottomColor: c.gold, paddingBottom: 6 } : undefined}>
        <Txt v={v} raw={raw}>{children}</Txt>
      </View>
      {bar && <View style={[bar, { backgroundColor: c.gold }]} />}
    </View>
  )
}

export function SectionTitle({ children, right, rule }: { children: string; right?: React.ReactNode; rule?: 'line' | 'bar' | 'short' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm }}>
      {rule ? <Heading rule={rule}>{children}</Heading> : <Txt v="h3">{children}</Txt>}
      {right}
    </View>
  )
}

export function Tag({ children }: { children: string }) {
  const c = useTheme()
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: c.tag, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Txt v="small" color={c.tagText} style={{ fontFamily: fonts.sansSemi }}>{children}</Txt>
    </View>
  )
}

export function Bar({ used, limit }: { used: number; limit: number }) {
  const c = useTheme()
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  return (
    <View style={{ height: 8, backgroundColor: c.line, borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: 8, backgroundColor: c.gold, borderRadius: 4 }} />
    </View>
  )
}

/* ───────── buttons ───────── */
export function Button({ title, onPress, kind = 'primary', icon, disabled, loading, style }: {
  title: string; onPress?: () => void; kind?: 'primary' | 'outline' | 'ghost' | 'danger'; icon?: string
  disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>
}) {
  const c = useTheme()
  const filled = kind === 'primary' || kind === 'danger'
  const bg = kind === 'danger' ? c.neg : filled ? c.primary : 'transparent'
  const fg = filled ? '#fff' : c.heading
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 48, borderRadius: radius.md, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center',
          flexDirection: 'row', gap: 8, backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          borderWidth: kind === 'outline' ? 1.5 : 0, borderColor: c.line
        },
        style
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Txt v="label" color={fg} style={{ fontFamily: fonts.sansBold }}>{title}</Txt>
    </Pressable>
  )
}

export function ListRow({ title, sub, right, icon, onPress, danger }: {
  title: string; sub?: string; right?: string; icon?: string; onPress?: () => void; danger?: boolean
}) {
  const c = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, opacity: pressed ? 0.6 : 1
      })}
    >
      {icon ? <Icon name={icon} size={22} color={danger ? c.neg : c.heading} /> : null}
      <View style={{ flex: 1 }}>
        <Txt v="label" color={danger ? c.neg : undefined}>{title}</Txt>
        {sub ? <Txt v="small">{sub}</Txt> : null}
      </View>
      {right ? <Txt v="small" style={{ fontFamily: fonts.sansSemi }}>{right}</Txt> : null}
      {onPress ? <Icon name="chevR" size={18} color={c.mute} /> : null}
    </Pressable>
  )
}

export function SwitchRow({ label, value, onChange, sub }: { label: string; value: boolean; onChange: (v: boolean) => void; sub?: string }) {
  const c = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 }}>
      <View style={{ flex: 1 }}>
        <Txt v="label">{label}</Txt>
        {sub ? <Txt v="small">{sub}</Txt> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: c.accent, false: c.line }}
        thumbColor="#fff"
      />
    </View>
  )
}

export function RadioRow({ label, note, selected, onPress }: { label: string; note?: string; selected: boolean; onPress: () => void }) {
  const c = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'center' }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? c.accent : c.mute, alignItems: 'center', justifyContent: 'center' }}>
        {selected && <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: c.accent }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Txt v="label">{label}</Txt>
        {note ? <Txt v="small">{note}</Txt> : null}
      </View>
    </Pressable>
  )
}

/* ───────── inputs ───────── */
export function Field({ label, error, hint, style, ...rest }: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  const c = useTheme()
  const { t } = usePortal()
  const [focus, setFocus] = useState(false)
  return (
    <View style={{ gap: 6 }}>
      <Txt v="label">{label}</Txt>
      <TextInput
        {...rest}
        placeholder={rest.placeholder ? t(rest.placeholder) : undefined}
        accessibilityLabel={t(label)}
        placeholderTextColor={c.mute}
        onFocus={e => { setFocus(true); rest.onFocus?.(e) }}
        onBlur={e => { setFocus(false); rest.onBlur?.(e) }}
        style={[
          {
            borderWidth: 1.5, borderColor: error ? c.neg : focus ? c.accent : c.line, borderRadius: radius.md, backgroundColor: c.card,
            color: c.ink, fontFamily: fonts.sans, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48
          },
          rest.multiline ? { minHeight: 140, textAlignVertical: 'top' } : null,
          style
        ]}
      />
      {hint ? <Txt v="small">{hint}</Txt> : null}
      {error ? <Txt v="err" accessibilityRole="alert">{error}</Txt> : null}
    </View>
  )
}

export const ErrorText = ({ children }: { children?: string | null }) =>
  children ? <Txt v="err" accessibilityRole="alert">{children}</Txt> : null

/* ───────── bottom sheet (small actions / simple selections only) ───────── */
export function BottomSheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const c = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} accessibilityLabel="Fermer" />
      <View style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 12, maxHeight: '75%' }}>
        <View style={{ alignItems: 'center', paddingTop: 10 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.line }} />
        </View>
        {title ? <Txt v="h3" style={{ paddingHorizontal: space.lg, paddingTop: space.md }}>{title}</Txt> : null}
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm }}>{children}</ScrollView>
      </View>
    </Modal>
  )
}

export interface Option { value: string | number; label: string; sub?: string }
/** Dropdown replacement: a tappable field that opens a bottom sheet list (website: Sel). */
export function SelectField({ label, value, options, onChange, placeholder, error }: {
  label?: string; value: string | number | undefined; options: Option[]; onChange: (v: any) => void; placeholder?: string; error?: string | null
}) {
  const c = useTheme()
  const [open, setOpen] = useState(false)
  const cur = options.find(o => String(o.value) === String(value))
  return (
    <View style={{ gap: 6 }}>
      {label ? <Txt v="label">{label}</Txt> : null}
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1.5, borderColor: error ? c.neg : c.line, borderRadius: radius.md, backgroundColor: c.card, minHeight: 48,
          paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8
        }}
      >
        <Txt style={{ flex: 1 }} color={cur ? c.ink : c.mute}>{cur ? cur.label : placeholder || ''}</Txt>
        <Icon name="chevD" size={18} color={c.mute} />
      </Pressable>
      {error ? <Txt v="err">{error}</Txt> : null}
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        {options.map(o => {
          const on = String(o.value) === String(value)
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="menuitem"
              onPress={() => {
                onChange(o.value)
                setOpen(false)
              }}
              style={{ paddingVertical: 14, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: on ? c.tag : 'transparent' }}
            >
              <Txt v="label" color={on ? c.tagText : c.ink}>{o.label}</Txt>
              {o.sub ? <Txt v="small">{o.sub}</Txt> : null}
            </Pressable>
          )
        })}
      </BottomSheet>
    </View>
  )
}

/** Date picker field (ISO yyyy-mm-dd value). */
export function DateField({ label, value, onChange, min }: { label: string; value: string; onChange: (iso: string) => void; min?: string }) {
  const c = useTheme()
  const { fmt } = usePortal()
  const [open, setOpen] = useState(false)
  const date = value ? new Date(value + 'T12:00:00') : new Date()
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return (
    <View style={{ gap: 6 }}>
      <Txt v="label">{label}</Txt>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={{ borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.card, minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Txt>{value ? fmt.D(value) : '—'}</Txt>
        <Icon name="cal" size={20} color={c.mute} />
      </Pressable>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          minimumDate={min ? new Date(min + 'T12:00:00') : undefined}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(e, d) => {
            if (Platform.OS !== 'ios') setOpen(false)
            if (e.type !== 'dismissed' && d) onChange(iso(d))
          }}
        />
      )}
      {open && Platform.OS === 'ios' && <Button title="OK" kind="outline" onPress={() => setOpen(false)} />}
    </View>
  )
}

/* ───────── tabs / chips (sub-sections of one screen) ───────── */
export function Segmented({ items, index, onChange }: { items: string[]; index: number; onChange: (i: number) => void }) {
  const c = useTheme()
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {items.map((it, i) => {
        const on = i === index
        return (
          <Pressable
            key={i}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(i)}
            style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: on ? c.primary : c.card, borderWidth: 1, borderColor: on ? c.primary : c.line }}
          >
            <Txt v="label" color={on ? '#fff' : c.ink}>{it}</Txt>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

/* ───────── states ───────── */
export function Empty({ icon = 'info', title, text, action }: { icon?: string; title: string; text?: string; action?: React.ReactNode }) {
  const c = useTheme()
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: space.xl, paddingHorizontal: space.lg }}>
      <Icon name={icon} size={40} color={c.mute} />
      <Txt v="bold" style={{ textAlign: 'center' }}>{title}</Txt>
      {text ? <Txt v="small" style={{ textAlign: 'center' }}>{text}</Txt> : null}
      {action}
    </View>
  )
}

export function Loading({ text }: { text?: string }) {
  const c = useTheme()
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: c.bg }}>
      <ActivityIndicator color={c.gold} size="large" />
      {text ? <Txt v="small">{text}</Txt> : null}
    </View>
  )
}

/** Run an async job (PDF export etc.) with loading + error feedback. */
export function useJob() {
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const { t } = usePortal()
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])
  const run = useCallback(
    async (fn: () => Promise<string | void>, okMsg?: string) => {
      setBusy(true)
      try {
        const r = await fn()
        if (okMsg || r) toast(t((r as string) || okMsg || ''))
      } catch (e: any) {
        toast(t('Une erreur est survenue. Veuillez réessayer.'))
      } finally {
        if (mounted.current) setBusy(false)
      }
    },
    [toast, t]
  )
  return { busy, run }
}
