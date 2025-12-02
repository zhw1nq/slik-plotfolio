<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const getTargetLink = computed(() => {
  return "/"
})
</script>

<template>
  <nav class="w-full relative z-10">
    <div class="responsive-screen relative">
      <div class="flex items-center gap-3 sm:gap-6 justify-between">
        <SmartLink
          :href="getTargetLink"
          class="flex-shrink-0 flex items-center space-x-4"
        >
          <img
            src="/myLogo.svg"
            alt="Logo"
            class="transition-transform sm:transform hover:-rotate-6 flex-shrink-0 h-10 sm:h-12 w-auto dark:invert-0 invert"
          />
        </SmartLink>

        <div class="flex space-x-1.5 sm:space-x-2 items-center">
          <ColorSwitcher />
          <ClientOnly>
            <LanguageSwitcher />
            <template #fallback>
              <div class="px-3 sm:px-5 py-1.5 sm:py-2 card-base rounded-full backdrop-blur-lg w-max">
                <div class="w-4 sm:w-5 h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </div>
  </nav>
</template>
