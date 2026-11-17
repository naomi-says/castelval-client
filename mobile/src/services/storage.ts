import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

/* Plain key/value storage (preferences, portal state) — AsyncStorage, never throws. */
export const kv = {
  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  async set(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      /* storage full / unavailable: the app keeps working in memory */
    }
  },
  async del(key: string) {
    try {
      await AsyncStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}

/* Secrets (session token) — Keychain / Keystore on devices; SecureStore has no web backend. */
export const secure = {
  async get(key: string): Promise<string | null> {
    try {
      return Platform.OS === 'web' ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  async set(key: string, value: string) {
    try {
      if (Platform.OS === 'web') await AsyncStorage.setItem(key, value)
      else await SecureStore.setItemAsync(key, value)
    } catch {
      /* ignore */
    }
  },
  async del(key: string) {
    try {
      if (Platform.OS === 'web') await AsyncStorage.removeItem(key)
      else await SecureStore.deleteItemAsync(key)
    } catch {
      /* ignore */
    }
  }
}
