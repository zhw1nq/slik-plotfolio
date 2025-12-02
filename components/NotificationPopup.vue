<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const isVisible = ref(true)

const dismissMessage = () => {
  isVisible.value = false
}
</script>

<template>
  <Transition name="fade" mode="out-in">
    <div
      v-if="isVisible"
      class="fixed inset-x-0 w-11/12 p-4 mx-auto space-y-1 rounded-lg shadow-md select-none bottom-4 lg:w-1/4 ring-1 ring-white/10 dark:ring-white/20 lg:mx-0 lg:left-4 background-when-supports z-20"
    >
      <div class="flex items-center justify-between gap-2">
        <ClientOnly>
          <h3 class="font-medium leading-tight dark:text-white">
            📢 {{ t("notification.title") }}
          </h3>
          <template #fallback>
            <h3 class="font-medium leading-tight dark:text-white">
              📢 Notification
            </h3>
          </template>
        </ClientOnly>

        <button
          class="p-1 transition-colors rounded-full hover:bg-black/20 dark:hover:bg-white/20 bg-black/10 dark:bg-white/10 dark:text-white"
          @click="dismissMessage"
        >
          <Icon name="mdi:times" class="w-3 h-3" />
        </button>
      </div>

      <ClientOnly>
        <p class="text-sm light:opacity-50 dark:text-white/50">
          {{ t("notification.message") }}
        </p>
        <template #fallback>
          <p class="text-sm light:opacity-50 dark:text-white/50">
            This is a sample notification.
          </p>
        </template>
      </ClientOnly>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.background-when-supports {
  @apply backdrop-blur-md backdrop-filter bg-white/70 dark:bg-neutral-900;
}

@supports (backdrop-filter: blur()) {
  .background-when-supports {
    @apply backdrop-blur-md backdrop-filter bg-white/30 dark:bg-neutral-800/30;
  }
}
</style>
