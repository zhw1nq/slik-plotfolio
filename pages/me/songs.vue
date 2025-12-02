<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface SpotifyUser {
  name: string
  registered: number
  totalPlays: number
  image: string
  url: string
  followers?: number
  id?: string
}

interface SpotifySong {
  name: string
  artist: string
  image: string
  url: string
  date: number
  plays?: number
  nowPlaying: boolean
  duration?: number
  progress?: number
}

interface SpotifyArtist {
  name: string
  plays: number
  image: string
  url: string
}

interface SpotifyResponse {
  error?: boolean
  notConfigured?: boolean
  message?: string
  user: SpotifyUser | null
  topTracks: SpotifySong[]
  recentTracks: SpotifySong[]
  topArtists: SpotifyArtist[]
  currentlyPlaying: SpotifySong | null
  totalListeningTime?: number
}

const { $prepareMeta } = useNuxtApp()
const { t } = useI18n()

const {
  data: spotify,
  status,
  error,
  pending,
  refresh,
} = await useLazyAsyncData<SpotifyResponse>(
  "spotify",
  () =>
    $fetch("/api/spotify", {
      responseType: "json",
    }),
  {
    server: false,
    lazy: true,
    immediate: true,
  },
)

// Ensure data is fetched on client side
onMounted(() => {
  if (!spotify.value && !pending.value && !error.value) {
    refresh()
  }
})

// Computed to check if we have valid data
const hasData = computed(() => {
  return spotify.value && spotify.value.user && !spotify.value.notConfigured
})

// Computed to check if we should show loader
const showLoader = computed(() => {
  return (pending.value || status.value === 'pending') && !spotify.value && !error.value
})

useHead(() => ({
  title: t("pages.songs.title"),
  meta: $prepareMeta({
    title: t("pages.songs.title"),
    description: t("pages.songs.metaDescription"),
  }),
}))

// Real-time progress cho bài hát đang nghe (chỉ update client-side, KHÔNG fetch API)
const currentProgress = ref(0)
const progressInterval = ref<NodeJS.Timeout | null>(null)
const lastUpdateTime = ref<number | null>(null)
const refreshInterval = ref<NodeJS.Timeout | null>(null)

// Format time từ milliseconds sang MM:SS
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

// Format tổng thời gian nghe
const formatListeningTime = (ms: number): string => {
  if (!ms || ms === 0) return "0 phút"

  const totalSeconds = Math.floor(ms / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`
  }
  return `${minutes} phút`
}

// Refresh data từ API (chỉ khi cần, không quá thường xuyên)
const refreshSpotifyData = async () => {
  try {
    const newData = await $fetch<SpotifyResponse>("/api/spotify", {
      responseType: "json",
    })
    if (newData) {
      spotify.value = newData
      // Reset progress nếu có bài hát mới
      if (newData.currentlyPlaying?.nowPlaying) {
        currentProgress.value = newData.currentlyPlaying.progress || 0
        lastUpdateTime.value = Date.now()
      }
    }
  } catch (error) {
    console.error("Error refreshing Spotify data:", error)
  }
}

// Update real-time progress (chỉ client-side, không fetch API)
watch(
  () => spotify.value?.currentlyPlaying,
  (currentlyPlaying) => {
    // Clear intervals cũ
    if (progressInterval.value) {
      clearInterval(progressInterval.value)
      progressInterval.value = null
    }
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }

    // Nếu có bài hát đang nghe, bắt đầu update progress
    if (currentlyPlaying?.nowPlaying && currentlyPlaying.duration) {
      currentProgress.value = currentlyPlaying.progress || 0
      lastUpdateTime.value = Date.now()

      // Update progress mỗi giây (chỉ client-side, KHÔNG fetch API)
      progressInterval.value = setInterval(() => {
        if (currentProgress.value < (currentlyPlaying.duration || 0)) {
          currentProgress.value += 1000 // Tăng 1 giây mỗi lần
        } else {
          // Nếu đã hết bài, clear interval và fetch lại để xem bài mới
          if (progressInterval.value) {
            clearInterval(progressInterval.value)
            progressInterval.value = null
          }
          // Fetch lại sau khi bài hát kết thúc
          setTimeout(() => {
            refreshSpotifyData()
          }, 2000)
        }
      }, 1000) // Update mỗi giây

      // Fetch lại mỗi 30 giây để cập nhật nếu đổi nhạc (không quá thường xuyên)
      refreshInterval.value = setInterval(() => {
        refreshSpotifyData()
      }, 30000) // 30 giây - đủ để phát hiện đổi nhạc mà không bị rate limit
    } else {
      currentProgress.value = 0
      lastUpdateTime.value = null
    }
  },
  { immediate: true },
)

// Fetch lại khi user quay lại tab (visibility change)
if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && spotify.value?.currentlyPlaying?.nowPlaying) {
      // User quay lại tab, fetch lại để cập nhật
      refreshSpotifyData()
    }
  })

  // Fetch lại khi window được focus
  window.addEventListener("focus", () => {
    if (spotify.value?.currentlyPlaying?.nowPlaying) {
      refreshSpotifyData()
    }
  })
}

// Cleanup khi component unmount
onUnmounted(() => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
  }
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <PageLayout
    :title="t('pages.songs.title')"
    :description="t('pages.songs.description')"
    class="space-y-12 pb-8 sm:pb-12"
  >
    <ClientOnly>
      <!-- Show loader only when truly pending and no data -->
      <LoadersSongs v-if="showLoader" />

      <!-- Show error only if there's an error and no data -->
      <template v-else-if="error && !spotify">
        <section class="text-center py-12">
          <Icon name="heroicons:exclamation-triangle" class="h-16 w-16 mx-auto text-red-400 dark:text-red-600 mb-4" />
          <h2 class="text-2xl font-semibold text-black/70 dark:text-white/70 mb-2">
            Lỗi tải dữ liệu
          </h2>
          <p class="text-black/50 dark:text-white/50 mb-4">
            Không thể tải dữ liệu từ Spotify. Vui lòng thử lại sau.
          </p>
        </section>
      </template>

      <!-- Show not configured message -->
      <template v-else-if="spotify?.notConfigured">
      <section class="text-center py-12">
        <Icon name="heroicons:musical-note" class="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h2 class="text-2xl font-semibold text-black/70 dark:text-white/70 mb-2">
          {{ t("pages.songs.notConfigured.title") }}
        </h2>
        <p class="text-black/50 dark:text-white/50 mb-4">
          {{ t("pages.songs.notConfigured.message") }}
        </p>
        <p class="text-sm text-black/40 dark:text-white/40">
          {{ t("pages.songs.notConfigured.guide") }} <code class="bg-black/5 dark:bg-white/5 px-2 py-1 rounded">scripts/get-spotify-refresh-token.md</code>
        </p>
      </section>
    </template>

    <template v-else-if="spotify && spotify.user">
      <!-- Currently Playing -->
      <section v-if="spotify.currentlyPlaying" class="mb-6 sm:mb-8">
        <PageTitle class="mb-3 sm:mb-4">{{ t("pages.songs.currentlyPlaying") }}</PageTitle>
        <div class="card-base p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div class="flex-shrink-0 relative mx-auto sm:mx-0">
              <SmartImage
                :src="spotify.currentlyPlaying.image"
                class="rounded-lg w-24 h-24 sm:w-20 sm:h-20 object-cover"
              />
              <div
                v-if="spotify.currentlyPlaying.nowPlaying"
                class="absolute inset-0 rounded-lg flex bg-black/50 items-center justify-center"
              >
                <Icon
                  name="svg-spinners:bars-scale-middle"
                  class="h-8 text-white w-8"
                />
              </div>
            </div>
            <div class="flex-1 min-w-0 w-full text-center sm:text-left">
              <div class="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <Icon
                  name="heroicons:speaker-wave"
                  class="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0"
                />
                <h3 class="font-semibold text-base sm:text-lg truncate max-w-full">
                  {{ spotify.currentlyPlaying.name }}
                </h3>
              </div>
              <p class="text-xs sm:text-sm text-black/50 dark:text-white/50 truncate mb-2 sm:mb-3">
                {{ spotify.currentlyPlaying.artist }}
              </p>
              <div v-if="spotify.currentlyPlaying.duration" class="space-y-1">
                <div class="w-full bg-black/10 dark:bg-white/10 rounded-full h-1 sm:h-1.5">
                  <div
                    class="bg-green-500 h-1 sm:h-1.5 rounded-full transition-all"
                    :style="{
                      width: `${
                        (currentProgress || spotify.currentlyPlaying.progress || 0) /
                        spotify.currentlyPlaying.duration *
                        100
                      }%`,
                    }"
                  />
                </div>
                <div class="flex justify-between text-[10px] sm:text-xs text-black/40 dark:text-white/40">
                  <span>{{ formatTime(currentProgress || spotify.currentlyPlaying.progress || 0) }}</span>
                  <span>{{ formatTime(spotify.currentlyPlaying.duration) }}</span>
                </div>
              </div>
              <SmartLink
                :href="spotify.currentlyPlaying.url"
                blank
                class="mt-2 inline-flex items-center justify-center sm:justify-start gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {{ t("pages.songs.openOnSpotify") }}
                <Icon name="heroicons:arrow-top-right-on-square" class="h-3 w-3 sm:h-4 sm:w-4" />
              </SmartLink>
            </div>
          </div>
        </div>
      </section>

      <section>
        <PageTitle class="mb-3 sm:mb-4">{{ t("pages.songs.accountInfo") }}</PageTitle>

        <div class="grid gap-y-3 sm:gap-y-4 gap-x-6 sm:gap-x-12 grid-cols-1 md:grid-cols-2">
          <!-- Profile -->
          <div class="flex space-x-3 sm:space-x-4 items-center justify-between text-sm sm:text-base">
            <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Icon name="heroicons:user-circle" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
              <span>{{ t("pages.songs.profile") }}</span>
            </div>

            <div class="flex space-x-2 items-center min-w-0">
              <SmartLink
                :href="spotify.user.url"
                class="flex-shrink truncate text-xs sm:text-sm"
                blank
                >@{{ spotify.user.name }}</SmartLink
              >

              <SmartImage
                :src="spotify.user.image"
                class="rounded-full h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"
              />
            </div>
          </div>

          <!-- Followers -->
          <div v-if="spotify.user.followers" class="flex space-x-3 sm:space-x-4 items-center justify-between text-sm sm:text-base">
            <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Icon name="heroicons:user-group" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
              <span>{{ t("pages.songs.followers") }}</span>
            </div>

            <div class="flex space-x-2 items-center">
              <div class="truncate text-xs sm:text-sm">{{ spotify.user.followers.toLocaleString() }}</div>
              <Icon
                name="heroicons:heart"
                class="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400 flex-shrink-0"
              />
            </div>
          </div>

          <!-- Total Listening Time -->
          <div class="flex space-x-3 sm:space-x-4 items-center justify-between text-sm sm:text-base">
            <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Icon name="heroicons:clock" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
              <span class="flex-shrink-0 text-xs sm:text-sm">{{ t("pages.songs.totalListeningTime") }}</span>
            </div>

            <div class="flex space-x-2 items-center">
              <div class="truncate text-xs sm:text-sm">
                {{ formatListeningTime(spotify.totalListeningTime || 0) }}
              </div>
              <Icon
                name="heroicons:musical-note"
                class="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0"
              />
            </div>
          </div>

          <!-- User ID -->
          <div v-if="spotify.user.id" class="flex space-x-3 sm:space-x-4 items-center justify-between text-sm sm:text-base">
            <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Icon name="heroicons:identification" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
              <span>{{ t("pages.songs.id") }}</span>
            </div>

            <div class="flex space-x-2 items-center min-w-0">
              <div class="truncate text-[10px] sm:text-sm font-mono">{{ spotify.user.id }}</div>
              <Icon
                name="heroicons:key"
                class="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400 flex-shrink-0"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="top-songs">
        <PageTitle class="mb-3 sm:mb-4">{{ t("pages.songs.topSongs") }}</PageTitle>

        <div class="grid gap-x-3 sm:gap-x-4 gap-y-2 grid-cols-1 md:grid-cols-2">
          <CardSpotify
            v-for="song of spotify.topTracks"
            :key="song.name"
            :name="song.name"
            :artist="song.artist"
            :now-playing="song.nowPlaying"
            :plays="song.plays"
            :url="song.url"
            :image="song.image"
          />
        </div>
      </section>

      <section id="top-artists">
        <PageTitle class="mb-3 sm:mb-4">{{ t("pages.songs.topArtists") }}</PageTitle>

        <div class="grid gap-x-3 sm:gap-x-4 gap-y-2 grid-cols-1 md:grid-cols-2">
          <CardSpotify
            v-for="artist of spotify.topArtists"
            :key="artist.name"
            :name="artist.name"
            :plays="artist.plays"
            :url="artist.url"
            :image="artist.image"
          />
        </div>
      </section>

      <section id="recent">
        <PageTitle class="mb-3 sm:mb-4">{{ t("pages.songs.recentSongs") }}</PageTitle>

        <div class="grid gap-x-3 sm:gap-x-4 gap-y-2 grid-cols-1 md:grid-cols-2">
          <CardSpotify
            v-for="song of spotify.recentTracks"
            :key="song.name"
            :name="song.name"
            :artist="song.artist"
            :image="song.image"
            :now-playing="song.nowPlaying"
            :url="song.url"
          />
        </div>
      </section>
      </template>

      <template #fallback>
        <LoadersSongs />
      </template>
    </ClientOnly>
  </PageLayout>
</template>
