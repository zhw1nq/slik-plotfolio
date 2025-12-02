import { createI18n } from 'vue-i18n'
import en from '~/lang/en.json'
import vi from '~/lang/vi.json'
import zh_Hans from '~/lang/zh_Hans.json'
import zh_TW from '~/lang/zh_TW.json'
import zh_HK from '~/lang/zh_HK.json'
import id from '~/lang/id.json'
import ru from '~/lang/ru.json'
import ja from '~/lang/ja.json'
import ar from '~/lang/ar.json'
import de from '~/lang/de.json'

// Supported locales
const supportedLocales = ['en', 'vi', 'zh_Hans', 'zh_TW', 'zh_HK', 'id', 'ru', 'ja', 'ar', 'de']

// Storage key for saved locale
const LOCALE_STORAGE_KEY = 'user-locale'

// Country code to locale mapping
const countryToLocale: Record<string, string> = {
  // Vietnamese
  'VN': 'vi',
  
  // Chinese variants
  'CN': 'zh_Hans',  // China - Simplified
  'SG': 'zh_Hans',  // Singapore - Simplified (majority)
  'TW': 'zh_TW',    // Taiwan - Traditional
  'HK': 'zh_HK',    // Hong Kong - Traditional
  'MO': 'zh_HK',    // Macau - Traditional (similar to HK)
  
  // Indonesian
  'ID': 'id',
  
  // Russian
  'RU': 'ru',
  'BY': 'ru',       // Belarus
  'KZ': 'ru',       // Kazakhstan
  
  // Japanese
  'JP': 'ja',
  
  // Arabic
  'SA': 'ar',       // Saudi Arabia
  'AE': 'ar',       // UAE
  'EG': 'ar',       // Egypt
  'IQ': 'ar',       // Iraq
  'JO': 'ar',       // Jordan
  'KW': 'ar',       // Kuwait
  'LB': 'ar',       // Lebanon
  'OM': 'ar',       // Oman
  'QA': 'ar',       // Qatar
  'SY': 'ar',       // Syria
  'YE': 'ar',       // Yemen
  'BH': 'ar',       // Bahrain
  'LY': 'ar',       // Libya
  'MA': 'ar',       // Morocco
  'DZ': 'ar',       // Algeria
  'TN': 'ar',       // Tunisia
  'SD': 'ar',       // Sudan
  
  // German
  'DE': 'de',       // Germany
  'AT': 'de',       // Austria
  'CH': 'de',       // Switzerland (German part)
  'LI': 'de',       // Liechtenstein
  'LU': 'de',       // Luxembourg
}

/**
 * Detect locale from IP using free API
 */
async function detectLocaleFromIP(): Promise<string | null> {
  try {
    // Using ip-api.com (free, no API key needed, 45 requests/minute)
    const response = await fetch('http://ip-api.com/json/?fields=countryCode', {
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const countryCode = data.countryCode
    
    if (countryCode && countryToLocale[countryCode]) {
      return countryToLocale[countryCode]
    }
    
    return null
  } catch (error) {
    console.warn('Failed to detect locale from IP:', error)
    return null
  }
}

/**
 * Detect user's preferred locale from browser language
 */
function detectLocaleFromBrowser(): string {
  if (typeof window === 'undefined') return 'en'
  
  const browserLanguages = navigator.languages || [navigator.language]
  
  for (const lang of browserLanguages) {
    const normalizedLang = lang.toLowerCase().replace('-', '_')
    
    // Exact match
    if (supportedLocales.includes(normalizedLang)) {
      return normalizedLang
    }
    
    // Handle Chinese variants
    if (normalizedLang.startsWith('zh')) {
      if (normalizedLang.includes('cn') || normalizedLang.includes('sg') || normalizedLang === 'zh_hans') {
        return 'zh_Hans'
      }
      if (normalizedLang.includes('tw')) {
        return 'zh_TW'
      }
      if (normalizedLang.includes('hk') || normalizedLang.includes('mo')) {
        return 'zh_HK'
      }
      return 'zh_Hans'
    }
    
    // Handle other language variants
    const baseLang = normalizedLang.split('_')[0]
    if (supportedLocales.includes(baseLang)) {
      return baseLang
    }
  }
  
  return 'en'
}

export default defineNuxtPlugin(({ vueApp, ssrContext }) => {
  // Get initial locale from cookie (SSR) or localStorage (client)
  let initialLocale = 'en'
  
  if (process.server && ssrContext?.event) {
    // Read locale from cookie in SSR
    const cookieLocale = useCookie('user-locale', {
      default: () => 'en',
      sameSite: 'lax',
      secure: true,
      httpOnly: false
    }).value
    
    if (cookieLocale && supportedLocales.includes(cookieLocale)) {
      initialLocale = cookieLocale
    }
  } else if (process.client) {
    // Check localStorage on client
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (savedLocale && supportedLocales.includes(savedLocale)) {
      initialLocale = savedLocale
    }
  }
  
  // Start with detected locale
  const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    fallbackLocale: 'en',
    messages: {
      en,
      vi,
      zh_Hans,
      zh_TW,
      zh_HK,
      id,
      ru,
      ja,
      ar,
      de
    }
  })
  
  vueApp.use(i18n)
  
  // Detect and set locale on client side
  if (typeof window !== 'undefined') {
    // Check saved preference first
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (savedLocale && supportedLocales.includes(savedLocale)) {
      i18n.global.locale.value = savedLocale
      // Sync to cookie
      useCookie('user-locale', {
        default: () => 'en',
        sameSite: 'lax',
        secure: true,
        httpOnly: false
      }).value = savedLocale
    } else {
      // Try IP detection first, fallback to browser
      detectLocaleFromIP().then((ipLocale) => {
        const detectedLocale = ipLocale || detectLocaleFromBrowser()
        i18n.global.locale.value = detectedLocale
        localStorage.setItem(LOCALE_STORAGE_KEY, detectedLocale)
        // Sync to cookie
        useCookie('user-locale', {
          default: () => 'en',
          sameSite: 'lax',
          secure: true,
          httpOnly: false
        }).value = detectedLocale
      })
    }
    
    // Watch for locale changes and save to localStorage and cookie
    watch(() => i18n.global.locale.value, (newLocale) => {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      useCookie('user-locale', {
        default: () => 'en',
        sameSite: 'lax',
        secure: true,
        httpOnly: false
      }).value = newLocale
    })
  }
})

