<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const config = useRuntimeConfig()
const { t } = useI18n()
const colorMode = useColorMode()

const discordUserId = config.public?.discord?.userId || ''
const discordProfileUrl = computed(() => discordUserId ? `discord://users/${discordUserId}` : '')

const lanyardUrl = computed(() => {
  if (!discordUserId) return ''
  const theme = colorMode.value === 'dark' ? 'dark' : 'light'
  return `https://lanyard.cnrad.dev/api/${discordUserId}?bg=00000000&theme=${theme}`
})

const email = config.public?.social?.email || ''
const emailAlt = config.public?.social?.emailAlt || ''
const phone = config.public?.social?.phone || ''
const githubUrl = config.public?.social?.github || ''
const discordUsername = config.public?.social?.discord || ''

// Real-time clock for timezones
const timeUTC7 = ref('')
const timeUTC8 = ref('')

const formatTime = (timezone: string, offset: number) => {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const localTime = new Date(utc + (offset * 3600000))

  const hours = String(localTime.getHours()).padStart(2, '0')
  const minutes = String(localTime.getMinutes()).padStart(2, '0')
  const seconds = String(localTime.getSeconds()).padStart(2, '0')

  return `UTC ${offset >= 0 ? '+' : ''}${offset} ${hours}:${minutes}:${seconds} ${timezone}`
}

const updateTime = () => {
  timeUTC7.value = formatTime('Asia/Ho_Chi_Minh', 7)
  timeUTC8.value = formatTime('Asia/Shanghai', 8)
}

let timeInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<template>
  <div
    class="bg-gray-100/80 backdrop-blur-xl text-sm w-full py-4 sm:py-6 text-black/50 dark:bg-white/10 dark:backdrop-blur-xl relative z-10">
    <div class="responsive-screen">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-16 items-start">
        <!-- Left: Website Info -->
        <div class="space-y-2.5 order-2 md:order-1">
          <ClientOnly>
            <h3
              class="font-semibold text-black/90 dark:text-white/90 text-sm sm:text-base uppercase tracking-wide mb-3">
              {{ t('footer.company.name').toUpperCase() }}
            </h3>
            <template #fallback>
              <h3
                class="font-semibold text-black/90 dark:text-white/90 text-sm sm:text-base uppercase tracking-wide mb-3">
                ZHW1NQ
              </h3>
            </template>
          </ClientOnly>
          <ClientOnly>
            <p class="text-black/70 dark:text-white/70 leading-relaxed text-xs sm:text-sm mb-3">
              {{ t('footer.company.description') }}
            </p>
            <template #fallback>
              <p class="text-black/70 dark:text-white/70 leading-relaxed text-xs sm:text-sm mb-3">
                A passionate full-stack developer and game designer, crafting digital experiences with modern web technologies and creative design.
              </p>
            </template>
          </ClientOnly>

          <!-- Contact Info with Icons -->
          <div class="space-y-2">
            <!-- Email 1 -->
            <div v-if="email" class="flex items-center gap-2 text-black/70 dark:text-white/70 text-xs sm:text-sm break-all sm:break-normal">
              <Icon name="line-md:email" class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <a :href="`mailto:${email}`"
                class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors">
                {{ email }}
              </a>
            </div>

            <!-- Email 2 -->
            <div v-if="emailAlt" class="flex items-center gap-2 text-black/70 dark:text-white/70 text-xs sm:text-sm break-all sm:break-normal">
              <Icon name="line-md:email" class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <a :href="`mailto:${emailAlt}`"
                class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors text-black/60 dark:text-white/60">
                {{ emailAlt }}
              </a>
            </div>

            <!-- Phone -->
            <div
              v-if="phone"
              class="flex items-center gap-2 text-black/70 dark:text-white/70 text-xs sm:text-sm break-all sm:break-normal">
              <Icon name="line-md:phone" class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <a :href="`tel:${phone.replace(/\s/g, '')}`"
                class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors">
                {{ phone }}
              </a>
            </div>

            <!-- GitHub -->
            <div
              v-if="githubUrl"
              class="flex items-center gap-2 text-black/70 dark:text-white/70 text-xs sm:text-sm break-all sm:break-normal">
              <Icon name="line-md:github" class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <a :href="githubUrl" target="_blank" rel="noopener noreferrer"
                class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors">
                {{ githubUrl.replace('https://', '') }}
              </a>
            </div>

            <!-- Discord -->
            <div
              v-if="discordUsername && discordUserId"
              class="flex items-center gap-2 text-black/70 dark:text-white/70 text-xs sm:text-sm break-all sm:break-normal">
              <Icon name="mdi:discord" class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <a :href="`https://discordapp.com/users/${discordUserId}`" target="_blank" rel="noopener noreferrer"
                class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors">
                {{ discordUsername }}
              </a>
            </div>

            <!-- Timezone UTC+7 -->
            <div
              class="flex items-center gap-2 text-black/70 dark:text-white/70 text-xs sm:text-sm break-all sm:break-normal">
              <Icon name="heroicons:clock" class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <ClientOnly>
                <a :href="'https://time.is/UTC+7'" target="_blank" rel="noopener noreferrer"
                  class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors font-mono">
                  {{ timeUTC7 || 'UTC +7 --:--:-- Asia/Ho_Chi_Minh' }}
                </a>
                <template #fallback>
                  <span class="font-mono">UTC +7 --:--:-- Asia/Ho_Chi_Minh</span>
                </template>
              </ClientOnly>
            </div>

            <!-- Timezone UTC+8 -->
            <div
              class="flex items-center gap-2 text-black/70 dark:text-white/70 text-xs sm:text-sm break-all sm:break-normal">
              <Icon name="heroicons:clock" class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <ClientOnly>
                <a :href="'https://time.is/UTC+8'" target="_blank" rel="noopener noreferrer"
                  class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors text-black/60 dark:text-white/60 font-mono">
                  {{ timeUTC8 || 'UTC +8 --:--:-- Asia/Shanghai' }}
                </a>
                <template #fallback>
                  <span class="font-mono text-black/60 dark:text-white/60">UTC +8 --:--:-- Asia/Shanghai</span>
                </template>
              </ClientOnly>
            </div>

            <!-- Location VN -->
            <div class="flex items-center gap-2 text-black/70 dark:text-white/70 text-xs sm:text-sm break-all sm:break-normal">
              <Icon name="heroicons:map-pin" class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <ClientOnly>
                <a href="https://www.google.com/maps/place/Tp.+M%C3%B3ng+C%C3%A1i,+Qu%E1%BA%A3ng+Ninh,+Vi%E1%BB%87t+Nam" target="_blank" rel="noopener noreferrer"
                  class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors">
                  {{ t('footer.company.locationVN') }}
                </a>
                <template #fallback>
                  <a href="https://www.google.com/maps/place/Tp.+M%C3%B3ng+C%C3%A1i,+Qu%E1%BA%A3ng+Ninh,+Vi%E1%BB%87t+Nam" target="_blank" rel="noopener noreferrer"
                    class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors">
                    Phường Móng Cái 1, Tỉnh Quảng Ninh, Việt Nam
                  </a>
                </template>
              </ClientOnly>
            </div>

            <!-- Location CN -->
            <div class="flex items-center gap-2 text-black/70 dark:text-white/70 text-xs sm:text-sm break-all sm:break-normal">
              <Icon name="heroicons:map-pin" class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <ClientOnly>
                <a :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t('footer.company.locationCN'))}`" target="_blank" rel="noopener noreferrer"
                  class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors text-black/60 dark:text-white/60">
                  {{ t('footer.company.locationCN') }}
                </a>
                <template #fallback>
                  <a :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Đông Hưng, Quảng Tây, Trung Quốc')}`" target="_blank" rel="noopener noreferrer"
                    class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors text-black/60 dark:text-white/60">
                    Đông Hưng, Quảng Tây, Trung Quốc
                  </a>
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>

        <!-- Right: Discord Contact -->
        <div class="space-y-2 flex flex-col items-center md:items-end order-1 md:order-2">
          <ClientOnly>
            <h3
              class="font-semibold text-black/90 dark:text-white/90 text-sm sm:text-base uppercase tracking-wide mb-2 text-center md:text-right w-full">
              {{ t('footer.discord.contact') }}
            </h3>
            <template #fallback>
              <h3
                class="font-semibold text-black/90 dark:text-white/90 text-sm sm:text-base uppercase tracking-wide mb-2 text-center md:text-right w-full">
                Contact Discord Account Owner
              </h3>
            </template>
          </ClientOnly>
          <a v-if="discordProfileUrl" :href="discordProfileUrl"
            class="block cursor-pointer hover:opacity-80 transition-opacity w-full max-w-full md:max-w-xs mx-auto md:ml-auto md:mr-0 px-2 sm:px-0">
            <ClientOnly>
              <div class="w-full relative rounded-lg" style="max-width: 100%; box-sizing: border-box;">
                <img :src="lanyardUrl" alt="Discord Activity" class="w-full h-auto rounded-lg"
                  style="max-width: 100%; height: auto; display: block; width: 100%; box-sizing: border-box;"
                  loading="lazy" @error="(e: Event) => { (e.target as HTMLImageElement).style.display = 'none' }" />
              </div>
              <template #fallback>
                <div
                  class="w-full h-28 sm:h-40 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse flex items-center justify-center">
                  <Icon name="heroicons:user-circle"
                    class="h-10 w-10 sm:h-12 sm:w-12 text-black/20 dark:text-white/20" />
                </div>
              </template>
            </ClientOnly>
          </a>
        </div>
      </div>

      <!-- Copyright - Center between columns -->
      <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-black/10 dark:border-white/10 text-center">
        <ClientOnly>
          <template #default>
            <p class="text-black/60 dark:text-white/60 text-[10px] sm:text-xs leading-relaxed">
              {{ t('footer.company.copyright') }}
            </p>
            <p class="text-black/60 dark:text-white/60 text-[10px] sm:text-xs leading-relaxed">
              {{ t('footer.company.website') }}
            </p>
          </template>
          <template #fallback>
            <p class="text-black/60 dark:text-white/60 text-[10px] sm:text-xs leading-relaxed">
              © 2007 - Present. All rights reserved.
            </p>
            <p class="text-black/60 dark:text-white/60 text-[10px] sm:text-xs leading-relaxed">
              zhw1nq/vhming.com
            </p>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>
