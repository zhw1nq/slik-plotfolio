<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { $prepareMeta } = useNuxtApp()
const config = useRuntimeConfig()
const { t } = useI18n()

useHead(() => ({
  title: t("pages.contact.title"),
  meta: $prepareMeta({
    title: t("pages.contact.title"),
    description: t("pages.contact.metaDescription"),
  }),
}))

const email = config.public?.social?.email || ''
const emailAlt = config.public?.social?.emailAlt || ''
const phone = config.public?.social?.phone || ''
const githubUrl = config.public?.social?.github || ''
const discordUsername = config.public?.social?.discord || ''
const discordUserId = config.public?.discord?.userId || ''

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
  <PageLayout :title="t('pages.contact.title')" :description="t('pages.contact.description')">
    <ClientOnly>
      <div class="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
        <!-- Email 1 -->
        <Card v-if="email" :title="t('pages.contact.email')" :href="`mailto:${email}`" :utm="false">
          <template #icon>
            <Icon name="line-md:email" class="h-7 w-7 sm:h-9 sm:w-9" />
          </template>

          <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm break-all">
            {{ email }}
          </span>
        </Card>

        <!-- Email 2 -->
        <Card v-if="emailAlt" :title="t('pages.contact.email')" :href="`mailto:${emailAlt}`" :utm="false">
          <template #icon>
            <Icon name="line-md:email" class="h-7 w-7 sm:h-9 sm:w-9" />
          </template>

          <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm break-all">
            {{ emailAlt }}
          </span>
        </Card>

        <!-- Phone -->
        <Card v-if="phone" title="Phone" :href="`tel:${phone.replace(/\s/g, '')}`" :utm="false">
          <template #icon>
            <Icon name="line-md:phone" class="h-7 w-7 sm:h-9 sm:w-9" />
          </template>

          <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm">
            {{ phone }}
          </span>
        </Card>

        <!-- GitHub -->
        <Card v-if="githubUrl" :title="t('footer.company.github')" :href="githubUrl" blank>
          <template #icon>
            <Icon name="line-md:github" class="h-7 w-7 sm:h-9 sm:w-9" />
          </template>

          <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm break-all">
            {{ githubUrl.replace('https://', '') }}
          </span>
        </Card>

        <!-- Discord -->
        <Card v-if="discordUsername && discordUserId" :title="t('footer.discord.contact')"
          :href="`https://discordapp.com/users/${discordUserId}`" blank>
          <template #icon>
            <Icon name="mdi:discord" class="h-7 w-7 sm:h-9 sm:w-9" />
          </template>

          <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm">
            {{ discordUsername }}
          </span>
        </Card>

        <!-- Timezone UTC+7 -->
        <Card :title="t('footer.company.timezoneUTC7')" :href="'https://time.is/UTC+7'" blank>
          <template #icon>
            <Icon name="heroicons:clock" class="h-7 w-7 sm:h-9 sm:w-9" />
          </template>

          <ClientOnly>
            <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm font-mono">
              {{ timeUTC7 || 'UTC +7 --:--:-- Asia/Ho_Chi_Minh' }}
            </span>
            <template #fallback>
              <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm font-mono">
                UTC +7 --:--:-- Asia/Ho_Chi_Minh
              </span>
            </template>
          </ClientOnly>
        </Card>

        <!-- Timezone UTC+8 -->
        <Card :title="t('footer.company.timezoneUTC8')" :href="'https://time.is/UTC+8'" blank>
          <template #icon>
            <Icon name="heroicons:clock" class="h-7 w-7 sm:h-9 sm:w-9" />
          </template>

          <ClientOnly>
            <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm font-mono">
              {{ timeUTC8 || 'UTC +8 --:--:-- Asia/Shanghai' }}
            </span>
            <template #fallback>
              <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm font-mono">
                UTC +8 --:--:-- Asia/Shanghai
              </span>
            </template>
          </ClientOnly>
        </Card>

        <!-- Location VN -->
        <Card :title="t('footer.company.locationVN')"
          href="https://www.google.com/maps/place/Tp.+M%C3%B3ng+C%C3%A1i,+Qu%E1%BA%A3ng+Ninh,+Vi%E1%BB%87t+Nam" blank>
          <template #icon>
            <Icon name="heroicons:map-pin" class="h-7 w-7 sm:h-9 sm:w-9" />
          </template>

          <ClientOnly>
            <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm break-all">
              {{ t('footer.company.locationVN') }}
            </span>
            <template #fallback>
              <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm break-all">
                Phường Móng Cái 1, Tỉnh Quảng Ninh, Việt Nam
              </span>
            </template>
          </ClientOnly>
        </Card>

        <!-- Location CN -->
        <Card :title="t('footer.company.locationCN')"
          :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t('footer.company.locationCN'))}`"
          blank>
          <template #icon>
            <Icon name="heroicons:map-pin" class="h-7 w-7 sm:h-9 sm:w-9" />
          </template>

          <ClientOnly>
            <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm break-all">
              {{ t('footer.company.locationCN') }}
            </span>
            <template #fallback>
              <span class="text-black/50 dark:text-white/30 text-xs sm:text-sm break-all">
                Đông Hưng, Quảng Tây, Trung Quốc
              </span>
            </template>
          </ClientOnly>
        </Card>
      </div>
      <template #fallback>
        <div class="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          <div v-for="i in 9" :key="i" class="rounded-lg card-base p-3 sm:p-4 animate-pulse">
            <div class="h-6 bg-black/10 dark:bg-white/10 rounded w-1/3 mb-2"></div>
            <div class="h-4 bg-black/5 dark:bg-white/5 rounded w-2/3"></div>
          </div>
        </div>
      </template>
    </ClientOnly>
  </PageLayout>
</template>
