<script setup lang="ts">
interface Props {
  name: string
  language?: string | null
  stars: string | number
  top?: boolean
  license?: string | null
  description?: string
}


const icons = {
  Vue: "devicon:vuejs",
  TypeScript: "devicon:typescript",
  JavaScript: "devicon:javascript",
  HTML: "devicon:html5",
}

const props = withDefaults(defineProps<Props>(), {
  language: null,
  top: false,
  license: null,
})

const languageIcon = computed(() => {
  if (!props.language) return null
  return icons[props.language as keyof typeof icons] || null
})
</script>

<template>
  <div class="rounded-lg card-base">
    <div class="space-y-1.5 sm:space-y-2">
      <div :class="top && 'flex justify-between space-x-2'">
        <h3
          class="text-black/90 dark:text-white/90 items-center truncate space-x-1 text-sm sm:text-base"
        >
          <span class="text-black/50 dark:text-white/30">zhw1nq/</span
          ><span>{{ name }}</span>
        </h3>

        <Icon
          v-if="top === true"
          class="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0"
          title="Top repository"
          name="heroicons:star-solid"
        />
      </div>

      <p class="text-black/50 dark:text-white/30 line-clamp-2 text-xs sm:text-sm">
        {{ description }}
      </p>
    </div>

    <div class="mt-3 sm:mt-4 text-xs sm:text-sm">
      <div
        class="flex items-center justify-between text-black/50 dark:text-white/30"
      >
        <span>Stars:</span>
        <span>{{ stars }}</span>
      </div>

      <div
        v-if="language"
        class="flex items-center justify-between text-black/50 dark:text-white/30"
      >
        <span>Language:</span>
        <Icon
          v-if="languageIcon"
          :name="languageIcon"
          class="h-4 w-4 sm:h-5 sm:w-5"
        />
        <span v-else class="text-xs sm:text-sm">{{ language }}</span>
      </div>

      <div
        v-if="license"
        class="flex items-center justify-between text-black/50 dark:text-white/30"
      >
        <span>License:</span>
        <span>{{ license }}</span>
      </div>
    </div>
  </div>
</template>
