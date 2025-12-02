<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  dropUp?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dropUp: false
})

const { locale } = useI18n()

const locales = [
  { code: 'en', name: 'English', flag: 'gb' },
  { code: 'vi', name: 'Tiếng Việt', flag: 'vn' },
  { code: 'zh_Hans', name: '简体中文', flag: 'cn' },
  { code: 'zh_TW', name: '繁體中文（台灣）', flag: 'tw' },
  { code: 'zh_HK', name: '繁體中文（香港）', flag: 'hk' },
  { code: 'id', name: 'Bahasa Indonesia', flag: 'id' },
  { code: 'ru', name: 'Русский', flag: 'ru' },
  { code: 'ja', name: '日本語', flag: 'jp' },
  { code: 'ar', name: 'العربية', flag: 'sa' },
  { code: 'de', name: 'Deutsch', flag: 'de' }
]

const currentLocale = computed(() => {
  const found = locales.find((l) => l.code === locale.value)
  return found || locales[0]
})

// Force re-render when locale changes
const currentFlag = computed(() => currentLocale.value.flag)
const currentName = computed(() => currentLocale.value.name)

const switchLocale = (code: string) => {
  locale.value = code
  // Save to localStorage so it persists and is used on next visit
  if (typeof window !== 'undefined') {
    localStorage.setItem('user-locale', code)
  }
  isOpen.value = false
}

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="cursor-pointer justify-center px-3 sm:px-5 py-1.5 sm:py-2 card-base flex items-center space-x-2 rounded-full backdrop-blur-lg w-max"
      @click="toggleDropdown"
    >
      <img
        :src="`https://flagcdn.com/${currentFlag}.svg`"
        :alt="currentName"
        class="w-4 h-3 sm:w-5 sm:h-4 object-cover rounded"
      />
    </button>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 w-44 sm:w-48 rounded-lg shadow-lg backdrop-blur-md bg-white/30 dark:bg-neutral-800/30 ring-1 ring-black/10 dark:ring-white/10 z-50 overflow-hidden max-h-64 sm:max-h-80 overflow-y-auto hide-scrollbar"
        :class="dropUp ? 'bottom-full mb-2' : 'top-full mt-2'"
      >
        <div class="py-1">
          <button
            v-for="loc in locales"
            :key="loc.code"
            @click="switchLocale(loc.code)"
            class="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 w-full text-left hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            :class="{
              'bg-black/5 dark:bg-white/5': loc.code === currentLocale.code,
            }"
          >
            <img
              :src="`https://flagcdn.com/${loc.flag}.svg`"
              :alt="loc.name"
              class="w-4 h-3 sm:w-5 sm:h-4 object-cover rounded flex-shrink-0"
            />
            <span class="text-xs sm:text-sm font-medium text-black/90 dark:text-white/95 flex-1 truncate">{{ loc.name }}</span>
            <Icon
              v-if="loc.code === currentLocale.code"
              name="heroicons:check"
              class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black/70 dark:text-white/70 flex-shrink-0"
            />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

