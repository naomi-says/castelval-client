import React, { useState } from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'
import { DrawerActions, NavigationContainer, DefaultTheme, DarkTheme, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon } from '../components/Icon'
import { BottomSheet, Txt, ListRow } from '../components/ui'
import { useAuth } from '../state/auth'
import { usePortal } from '../state/portal'
import { fonts, space, useStyles, useTheme } from '../theme'
import { DrawerParamList, RootStackParamList, TabParamList } from './types'

import Login from '../screens/Login'
import Home from '../screens/Home'
import { AccountsScreen, AccountManage, OperationDetail, Statements, OtherDocuments, DocsToSend, DocsToSign, Rib } from '../screens/Accounts'
import { CardsScreen, CardPoints, CardSettings, CardBlocks, CardLimit, CardLimitEdit, CardInfo } from '../screens/Cards'
import {
  TransfersHub, TfFrom, TfTo, TfAmount, TfReview, TfApproval, TfDone, Beneficiaries, BeneficiaryDetail, AddBeneficiary,
  TransferLimits, LimitInfo, Scheduled, ManageUpcoming
} from '../screens/Transfers'
import { WealthScreen, ManualItemScreen } from '../screens/Wealth'
import { Credits, LoanDetail, Insurance } from '../screens/Credits'
import { Messages, MessageRead, MessageCompose, Contact, Appointment } from '../screens/Messages'
import { Profile, ProfileSwitch, Settings, SettingsContact, SettingsAlerts, SettingsAggregation, ConnectionHistory, Approval } from '../screens/Profile'
import { Subscribe, InfoPage } from '../screens/Misc'

const logo = require('../../assets/logo.png')

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()
const Drawer = createDrawerNavigator<DrawerParamList>()

/* ───────── header shown on the five main tabs (website: .ah) ───────── */
function TabHeader() {
  const nav = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const c = useTheme()
  const { S, p, A, unread } = usePortal()
  const { signOut } = useAuth()
  const [menu, setMenu] = useState(false)
  const s = useStyles(col => ({
    bar: { backgroundColor: col.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, gap: 4 },
    brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    btn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: 4, right: 3, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: col.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff55' }
  }))
  return (
    <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
      <Pressable accessibilityLabel="Ouvrir le menu" style={s.btn} onPress={() => nav.dispatch(DrawerActions.openDrawer())}>
        <Icon name="menu" color="#fff" size={26} />
      </Pressable>
      <View style={s.brand}>
        <Image source={logo} style={{ width: 34, height: 15, tintColor: '#fff' }} resizeMode="contain" />
        <Txt raw color="#fff" style={{ fontFamily: fonts.serif, fontSize: 20, lineHeight: 30, letterSpacing: 2.4 }}>CASTELVAL</Txt>
      </View>
      <Pressable accessibilityLabel={S.hide ? 'Afficher les montants' : 'Masquer les montants'} style={s.btn} onPress={A.toggleHide}>
        <Icon name={S.hide ? 'eye' : 'eyeOff'} color="#fff" size={23} />
      </Pressable>
      <Pressable accessibilityLabel="Messages" style={s.btn} onPress={() => nav.navigate('Messages')}>
        <Icon name="mail" color="#fff" size={23} />
        {unread > 0 && (
          <View style={s.badge}>
            <Txt raw color="#0f2a4d" style={{ fontSize: 10, fontFamily: fonts.sansBold }}>{unread}</Txt>
          </View>
        )}
      </Pressable>
      <Pressable accessibilityLabel="Mon profil" style={s.avatar} onPress={() => setMenu(true)}>
        <Txt raw color="#fff" style={{ fontFamily: fonts.sansBold, fontSize: 12 }}>{p.ini}</Txt>
      </Pressable>
      {/* small action list → bottom sheet (website: profile dropdown) */}
      <BottomSheet visible={menu} onClose={() => setMenu(false)} title={p.n}>
        <ListRow icon="user" title="Mon profil" onPress={() => { setMenu(false); nav.navigate('Profile') }} />
        <ListRow icon="bank" title="Changer de profil" onPress={() => { setMenu(false); nav.navigate('ProfileSwitch') }} />
        <ListRow icon="shield" title="Paramètres" onPress={() => { setMenu(false); nav.navigate('Settings') }} />
        <ListRow icon="logout" title="Déconnexion" danger onPress={() => { setMenu(false); signOut() }} />
      </BottomSheet>
      <View />
    </View>
  )
}

function Tabs() {
  const c = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = usePortal()
  const icon = (name: string) => ({ color }: { color: string }) => <Icon name={name} color={color} size={23} />
  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <TabHeader />,
        tabBarActiveTintColor: c.isDark ? c.heading : c.navy,
        tabBarInactiveTintColor: c.mute,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.line, height: 64 + insets.bottom, paddingBottom: insets.bottom + 8, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.sansSemi, fontSize: 11 }
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: t('Accueil'), tabBarIcon: icon('home') }} />
      <Tab.Screen name="Accounts" component={AccountsScreen} options={{ title: t('Comptes'), tabBarIcon: icon('comptes') }} />
      <Tab.Screen name="Cards" component={CardsScreen} options={{ title: t('Cartes'), tabBarIcon: icon('cartes') }} />
      <Tab.Screen name="Transfers" component={TransfersHub} options={{ title: t('Virements'), tabBarIcon: icon('virements') }} />
      <Tab.Screen name="Wealth" component={WealthScreen} options={{ title: t('Patrimoine'), tabBarIcon: icon('patrimoine') }} />
    </Tab.Navigator>
  )
}

/* ───────── drawer = the website's sidebar (#sb) ───────── */
const SUBS: Record<string, { label: string; hint?: string; go: (n: any) => void }[]> = {
  comptes: [
    { label: 'Mes opérations', go: n => n.navigate('Main', { screen: 'Tabs', params: { screen: 'Accounts' } }) },
    { label: 'Mes autres comptes', hint: 'procurations', go: n => n.navigate('ProfileSwitch') },
    { label: 'Gérer le compte', hint: 'RIB, relevés, recherche', go: n => n.navigate('AccountManage') }
  ],
  cartes: [
    { label: 'Mes dépenses carte', go: n => n.navigate('Main', { screen: 'Tabs', params: { screen: 'Cards' } }) },
    { label: 'Mes points et cashback', go: n => n.navigate('CardPoints') },
    { label: 'Mes réglages de carte', go: n => n.navigate('CardSettings') }
  ],
  virements: [
    { label: 'Nouveau virement', go: n => n.navigate('TfFrom') },
    { label: 'Mes bénéficiaires', go: n => n.navigate('Beneficiaries') },
    { label: 'Plafonds de virement', go: n => n.navigate('TransferLimits') },
    { label: 'Virements programmés et prélèvements', go: n => n.navigate('Scheduled') }
  ]
}

function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const c = useTheme()
  const insets = useSafeAreaInsets()
  const { p, A, lang, unread, t } = usePortal()
  const { signOut } = useAuth()
  const [open, setOpen] = useState<string | null>(null)
  const nav = navigation as any
  /* active tab, read from the nested navigator state */
  const tabState: any = (state.routes[0] as any)?.state
  const activeTab: string = tabState ? tabState.routes[tabState.index]?.name : 'Home'
  const tab = (name: keyof TabParamList) => () => nav.navigate('Main', { screen: 'Tabs', params: { screen: name } })
  const go = (fn: () => void) => () => {
    navigation.closeDrawer()
    fn()
  }
  const TAB_OF: Record<string, string> = { home: 'Home', patrimoine: 'Wealth', comptes: 'Accounts', cartes: 'Cards', virements: 'Transfers' }
  const items: { k: string; label: string; onPress: () => void }[] = [
    { k: 'home', label: 'Accueil', onPress: tab('Home') },
    { k: 'patrimoine', label: 'Mon patrimoine', onPress: tab('Wealth') },
    { k: 'comptes', label: 'Mes comptes', onPress: tab('Accounts') },
    { k: 'cartes', label: 'Mes cartes', onPress: tab('Cards') },
    { k: 'virements', label: 'Virements', onPress: tab('Transfers') },
    { k: 'assurances', label: 'Mes assurances', onPress: () => nav.navigate('Insurance') },
    { k: 'credits', label: 'Mes crédits', onPress: () => nav.navigate('Credits') },
    { k: 'documents', label: 'Mes relevés de compte', onPress: () => nav.navigate('Statements') }
  ]
  const s = useStyles(col => ({
    wrap: { flex: 1, backgroundColor: col.side },
    head: { paddingHorizontal: 20, paddingBottom: 18, gap: 12 },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ffffff1f', borderWidth: 1.5, borderColor: col.gold, alignItems: 'center', justifyContent: 'center' },
    pill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#ffffff44' },
    group: { color: '#8fa6cc', fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.6, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 6 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 18, marginHorizontal: 12, borderRadius: 12 },
    on: { backgroundColor: '#ffffff1a' },
    bar: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 4, borderRadius: 2, backgroundColor: col.gold },
    sub: { paddingVertical: 10, paddingLeft: 40, paddingRight: 16, marginHorizontal: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: col.gold, marginTop: 8 },
    foot: { borderTopWidth: 1, borderTopColor: '#ffffff22', padding: 16, gap: 12 },
    seg: { flexDirection: 'row', backgroundColor: '#ffffff14', borderRadius: 999, padding: 3 },
    segBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999 }
  }))
  const Item = ({ label, onPress, chev, badge, on }: { label: string; onPress: () => void; chev?: 'up' | 'down'; badge?: number; on?: boolean }) => (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.item, on && s.on, pressed && { opacity: 0.7 }]}>
      {on && <View style={s.bar} />}
      <Txt color={on ? '#fff' : '#dbe4f3'} style={{ flex: 1, fontFamily: on ? fonts.sansBold : fonts.sansSemi, fontSize: 15.5 }}>{label}</Txt>
      {badge ? (
        <View style={{ backgroundColor: c.gold, borderRadius: 10, minWidth: 20, alignItems: 'center', paddingHorizontal: 5, paddingVertical: 1 }}>
          <Txt raw color="#0f2a4d" style={{ fontSize: 11, fontFamily: fonts.sansBold }}>{badge}</Txt>
        </View>
      ) : null}
      {chev ? <Icon name={chev === 'up' ? 'chevD' : 'chevR'} color="#9fb2d3" size={16} /> : null}
    </Pressable>
  )
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 16 }]}>
      <View style={s.head}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={logo} style={{ width: 40, height: 17, tintColor: '#fff' }} resizeMode="contain" />
          <Txt raw color="#fff" style={{ fontFamily: fonts.serif, fontSize: 22, lineHeight: 32, letterSpacing: 2.6 }}>CASTELVAL</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={s.avatar}>
            <Txt raw color="#fff" style={{ fontFamily: fonts.sansBold, fontSize: 16 }}>{p.ini}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt raw color="#fff" style={{ fontFamily: fonts.sansBold, fontSize: 16 }} numberOfLines={1}>{p.n}</Txt>
            <Txt v="small" color="#9fb2d3">{p.t}</Txt>
          </View>
        </View>
        <Pressable style={s.pill} onPress={go(() => nav.navigate('ProfileSwitch'))} accessibilityRole="button">
          <Txt color="#dbe4f3" style={{ fontFamily: fonts.sansSemi, fontSize: 13 }}>Changer de profil</Txt>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        {items.map(it => {
          const subs = SUBS[it.k]
          const isOpen = open === it.k
          const active = !!TAB_OF[it.k] && TAB_OF[it.k] === activeTab
          return (
            <View key={it.k}>
              <Item
                label={it.label}
                on={active}
                chev={subs ? (isOpen ? 'up' : 'down') : undefined}
                onPress={() => (subs ? setOpen(isOpen ? null : it.k) : go(it.onPress)())}
              />
              {subs && isOpen &&
                subs.map(sb => (
                  <Pressable key={sb.label} style={s.sub} onPress={go(() => sb.go(nav))}>
                    <View style={s.dot} />
                    <View style={{ flex: 1 }}>
                      <Txt color="#dbe4f3">{sb.label}</Txt>
                      {sb.hint ? <Txt v="small" color="#9fb2d3">{sb.hint}</Txt> : null}
                    </View>
                  </Pressable>
                ))}
            </View>
          )
        })}
        <Item label="Messages" badge={unread} onPress={go(() => nav.navigate('Messages'))} />
        <Item label="Téléphone" onPress={go(() => nav.navigate('Contact'))} />
        <Item label="Rendez-vous" onPress={go(() => nav.navigate('Appointment'))} />
        <Item label="Notre offre" onPress={go(() => nav.navigate('Subscribe'))} />
        <Item label="Mon profil" onPress={go(() => nav.navigate('Profile'))} />
        <Item label="Paramètres" onPress={go(() => nav.navigate('Settings'))} />
      </ScrollView>
      <View style={[s.foot, { paddingBottom: insets.bottom + 14 }]}>
        <View style={s.seg}>
          {(['fr', 'en'] as const).map(l => (
            <Pressable key={l} style={[s.segBtn, lang === l && { backgroundColor: '#fff' }]} onPress={() => A.setLang(l)} accessibilityRole="button">
              <Txt raw color={lang === l ? '#0f2a4d' : '#dbe4f3'} style={{ fontFamily: fonts.sansBold, fontSize: 13 }}>{l === 'fr' ? 'Français' : 'English'}</Txt>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => { navigation.closeDrawer(); signOut() }}
          accessibilityRole="button"
          style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff44' }}
        >
          <Icon name="logout" color="#fff" size={18} />
          <Txt color="#fff" style={{ fontFamily: fonts.sansBold }}>Déconnexion</Txt>
        </Pressable>
        <Txt v="small" raw color="#8fa6cc" style={{ textAlign: 'center' }}>© 2026 Castelval</Txt>
      </View>
    </View>
  )
}

function Main() {
  return (
    <Drawer.Navigator
      drawerContent={p => <DrawerContent {...p} />}
      screenOptions={{ headerShown: false, drawerStyle: { width: 300 }, swipeEdgeWidth: 40 }}
    >
      <Drawer.Screen name="Tabs" component={Tabs} />
    </Drawer.Navigator>
  )
}

/* ───────── root stack: every detail / form / wizard step is its own screen ───────── */
export default function RootNavigator() {
  const c = useTheme()
  const { status } = useAuth()
  const { t } = usePortal()
  const theme = { ...(c.isDark ? DarkTheme : DefaultTheme), colors: { ...(c.isDark ? DarkTheme : DefaultTheme).colors, background: c.bg, card: c.header, text: '#fff', border: c.line, primary: c.gold } }
  const o = (title: string, extra?: object) => ({ title: t(title), ...extra })
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: c.header },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: fonts.serif, fontSize: 22 },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: c.bg },
          animation: 'slide_from_right'
        }}
      >
        {status !== 'in' ? (
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={Main} options={{ headerShown: false }} />
            {/* accounts & documents */}
            <Stack.Screen name="AccountManage" component={AccountManage} options={o('Gérer le compte')} />
            <Stack.Screen name="OperationDetail" component={OperationDetail} options={o('Détail de l’opération')} />
            <Stack.Screen name="Statements" component={Statements} options={o('Mes relevés de compte')} />
            <Stack.Screen name="OtherDocuments" component={OtherDocuments} options={o('Autres documents à disposition')} />
            <Stack.Screen name="DocsToSend" component={DocsToSend} options={o('Mes documents à transmettre')} />
            <Stack.Screen name="DocsToSign" component={DocsToSign} options={o('Mes devis et contrats à signer')} />
            <Stack.Screen name="Rib" component={Rib} options={o('Relevé d’identité bancaire')} />
            {/* cards */}
            <Stack.Screen name="CardPoints" component={CardPoints} options={o('Mes points et cashback')} />
            <Stack.Screen name="CardSettings" component={CardSettings} options={o('Mes réglages de carte')} />
            <Stack.Screen name="CardBlocks" component={CardBlocks} options={o('Opposition carte et chéquier')} />
            <Stack.Screen name="CardLimit" component={CardLimit} options={o('Plafonds de carte')} />
            <Stack.Screen name="CardLimitEdit" component={CardLimitEdit} options={o('Modifier mon plafond')} />
            <Stack.Screen name="CardInfo" component={CardInfo} options={o('Ma carte')} />
            {/* transfers */}
            <Stack.Screen name="TfFrom" component={TfFrom} options={o('Nouveau virement')} />
            <Stack.Screen name="TfTo" component={TfTo} options={o('Compte à créditer')} />
            <Stack.Screen name="TfAmount" component={TfAmount} options={o('Montant et caractéristiques')} />
            <Stack.Screen name="TfReview" component={TfReview} options={o('Récapitulatif')} />
            <Stack.Screen name="TfApproval" component={TfApproval} options={o('Validation')} />
            <Stack.Screen name="TfDone" component={TfDone} options={o('Confirmation', { headerBackVisible: false, gestureEnabled: false })} />
            <Stack.Screen name="Beneficiaries" component={Beneficiaries} options={o('Mes bénéficiaires')} />
            <Stack.Screen name="BeneficiaryDetail" component={BeneficiaryDetail} options={o('Bénéficiaire')} />
            <Stack.Screen name="AddBeneficiary" component={AddBeneficiary} options={o('Ajouter un bénéficiaire')} />
            <Stack.Screen name="TransferLimits" component={TransferLimits} options={o('Plafonds de virement')} />
            <Stack.Screen name="LimitInfo" component={LimitInfo} options={o('Modifier un plafond')} />
            <Stack.Screen name="Scheduled" component={Scheduled} options={o('Virements programmés et prélèvements')} />
            <Stack.Screen name="ManageUpcoming" component={ManageUpcoming} options={o('Gérer un élément à venir')} />
            {/* wealth */}
            <Stack.Screen name="ManualItem" component={ManualItemScreen} options={o('Élément déclaré')} />
            {/* loans & insurance */}
            <Stack.Screen name="Credits" component={Credits} options={o('Mes crédits')} />
            <Stack.Screen name="LoanDetail" component={LoanDetail} options={o('Détail du crédit')} />
            <Stack.Screen name="Insurance" component={Insurance} options={o('Mes assurances')} />
            {/* messaging */}
            <Stack.Screen name="Messages" component={Messages} options={o('Ma messagerie')} />
            <Stack.Screen name="MessageRead" component={MessageRead} options={o('Message')} />
            <Stack.Screen name="MessageCompose" component={MessageCompose} options={o('Nouveau message')} />
            <Stack.Screen name="Contact" component={Contact} options={o('Nous contacter')} />
            <Stack.Screen name="Appointment" component={Appointment} options={o('Prendre rendez-vous')} />
            {/* profile & settings */}
            <Stack.Screen name="Profile" component={Profile} options={o('Mon profil')} />
            <Stack.Screen name="ProfileSwitch" component={ProfileSwitch} options={o('Changer de profil')} />
            <Stack.Screen name="Settings" component={Settings} options={o('Paramètres')} />
            <Stack.Screen name="SettingsContact" component={SettingsContact} options={o('Mes paramètres de contact')} />
            <Stack.Screen name="SettingsAlerts" component={SettingsAlerts} options={o('Alertes et évènements')} />
            <Stack.Screen name="SettingsAggregation" component={SettingsAggregation} options={o('Patrimoine financier à agréger')} />
            <Stack.Screen name="ConnectionHistory" component={ConnectionHistory} options={o('Mes dernières connexions')} />
            <Stack.Screen name="Approval" component={Approval} options={o('Validation')} />
            {/* other */}
            <Stack.Screen name="Subscribe" component={Subscribe} options={o('Votre espace de souscription')} />
            <Stack.Screen name="InfoPage" component={InfoPage} options={o('Informations')} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
