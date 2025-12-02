<script setup lang="ts">
import { SmartLink, SmartImage } from "#components"

interface Props {
  name: string
  artist?: string
  nowPlaying?: boolean
  plays?: number
  url: string
  image: string
}

const props = defineProps<Props>()
</script>

<template>
  <SmartLink
    :href="url"
    class="card-base rounded-lg flex items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
    blank
  >
    <SmartImage
      :src="image"
      :alt="name"
      class="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 rounded-lg object-cover"
    />

    <div class="flex-1 min-w-0 space-y-1">
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-black/90 dark:text-white/90 text-sm sm:text-base truncate">
          {{ name }}
        </h3>
        <Icon
          v-if="nowPlaying"
          name="heroicons:signal"
          class="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 animate-pulse"
        />
      </div>

      <div v-if="artist" class="text-black/60 dark:text-white/60 text-xs sm:text-sm truncate">
        {{ artist }}
      </div>

      <div v-if="plays !== undefined" class="text-black/40 dark:text-white/40 text-[10px] sm:text-xs">
        {{ plays }} {{ plays === 1 ? 'play' : 'plays' }}
      </div>
    </div>
  </SmartLink>
</template>

