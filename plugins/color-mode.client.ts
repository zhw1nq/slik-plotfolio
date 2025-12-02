export default defineNuxtPlugin({
  name: 'color-mode-init',
  enforce: 'pre',
  setup() {
    if (typeof window === 'undefined') return

    const storageKey = 'color-mode'
    const preference = localStorage.getItem(storageKey) || 'system'
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const colorMode = preference === 'system' ? systemPreference : preference
    
    document.documentElement.classList.add(colorMode)
    document.documentElement.classList.add(preference === 'system' ? 'system' : preference)
  }
})

