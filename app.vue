<script setup lang="ts">
const colorMode = useColorMode()
const isProduction = import.meta.env.PROD

useHead(() => {
  let string = "vhming.com"

  return {
    titleTemplate: `%s - ${string}`,
    htmlAttrs: {
      class: `min-h-screen ${colorMode.preference} ${colorMode.value}`,
    },
    meta: [
      {
        hid: "og:site_name",
        name: "og:site_name",
        content: string,
      },
    ],
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-neutral-900 relative">
    <Navbar class="pt-10 relative z-20" />

    <!-- Nuxt component -->
    <main class="responsive-screen min-h-screen pb-12 sm:pb-16 md:pb-20 relative z-10">
      <NuxtPage />
    </main>

    <!-- Footer -->
    <Footer class="relative z-20" />

    <!-- Go to top button -->
    <GoTop />

    <!-- Custom Dot Scrollbar -->
    <ClientOnly>
      <DotScrollbar />
    </ClientOnly>

    <!-- Notification Popup -->
    <LazyNotificationPopup />

    <!-- Other Components -->
    <ClientOnly>
      <component :is="'VitePwaManifest'" v-if="isProduction" />
    </ClientOnly>
    <NuxtLoadingIndicator />
  </div>
</template>
