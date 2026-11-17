import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope'
import { CormorantGaramond_600SemiBold, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond'
import { Loading, ToastProvider } from './src/components/ui'
import RootNavigator from './src/navigation'
import { AuthProvider, useAuth } from './src/state/auth'
import { PortalProvider, usePortal } from './src/state/portal'
import { ThemeProvider } from './src/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

/* Wires the session to the portal state: a new sign-in starts from a clean portal (as the website
   does on login) and signing out / session expiry wipes the locally kept drafts. */
function Gate() {
  const { status } = useAuth()
  const { ready } = usePortal()
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold,
    CormorantGaramond_600SemiBold, CormorantGaramond_700Bold
  })
  const ok = (fontsLoaded || !!fontError) && ready && status !== 'loading'
  useEffect(() => {
    if (ok) SplashScreen.hideAsync().catch(() => {})
  }, [ok])
  if (!ok) return <Loading />
  return <RootNavigator />
}

function Providers() {
  const { A } = usePortal()
  return (
    <AuthProvider onSignedIn={A.reset} onSignedOut={A.reset}>
      <Gate />
    </AuthProvider>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PortalProvider>
            <ToastProvider>
              <Providers />
            </ToastProvider>
            <StatusBar style="light" />
          </PortalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
