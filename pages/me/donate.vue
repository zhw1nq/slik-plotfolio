<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { $config, $prepareMeta } = useNuxtApp()

const { t } = useI18n()

useHead(() => ({
  title: t("pages.donate.title"),
  meta: $prepareMeta({
    title: t("pages.donate.title"),
    description: t("pages.donate.metaDescription"),
    keywords: "donate",
    url: "https://vhming.com/me/donate",
  }),
  link: [
    {
      rel: "canonical",
      href: "https://vhming.com/me/donate",
    },
  ],
}))

// Bank options - logo từ local SVG
const banks = [
  {
    id: 'TCB',
    name: 'Techcombank',
    shortName: 'TCB',
    accountNumber: '3110311099',
    accountName: 'VU GIA MINH',
    logo: '/assets/icons/TCB.svg'
  },
  {
    id: 'MB',
    name: 'MB Bank',
    shortName: 'MB',
    accountNumber: '81689999999',
    accountName: 'VU GIA MINH',
    logo: '/assets/icons/MB.svg'
  }
]

// Crypto options - QR code từ API: https://api.qrserver.com/v1/create-qr-code/
const cryptoOptions = [
  {
    id: 'usdt',
    name: 'USDT',
    network: 'TRC20 (Tron)',
    address: 'TQAm9T5mixZLFEHG7raF8a53EtxtGSbVXW',
    minimum: '1 USDT',
    icon: 'cryptocurrency-color:usdt'
  },
  {
    id: 'ltc',
    name: 'Litecoin',
    network: 'LTC',
    address: 'MNA52GQPqtZxynCeVutrmoY9fVUFnFdd3N',
    minimum: '0.05 LTC',
    icon: 'cryptocurrency-color:ltc'
  }
]

// Generate QR code URL for crypto address
const getCryptoQrUrl = (address: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}&bgcolor=transparent&color=000000&format=svg`
}

// Selected bank
const selectedBank = ref(banks[0])

// Selected crypto for QR display
const selectedCrypto = ref(cryptoOptions[0])

// VietQR Payment Integration
const amount = ref('50000')
const description = ref('')
const predefinedAmounts = [50000, 100000, 200000, 500000]

const paymentSteps = computed(() => [
  {
    title: t('pages.donate.vietqr.steps.openApp.title'),
    icon: 'heroicons:device-phone-mobile',
    description: t('pages.donate.vietqr.steps.openApp.description')
  },
  {
    title: t('pages.donate.vietqr.steps.scanQr.title'),
    icon: 'heroicons:qr-code',
    description: t('pages.donate.vietqr.steps.scanQr.description')
  },
  {
    title: t('pages.donate.vietqr.steps.confirm.title'),
    icon: 'heroicons:check-circle',
    description: t('pages.donate.vietqr.steps.confirm.description')
  }
])

const qrUrl = computed(() => {
  const baseUrl = `https://img.vietqr.io/image/${selectedBank.value.id}-${selectedBank.value.accountNumber}-qr_only.png`
  const params = new URLSearchParams({
    amount: amount.value || '50000',
    addInfo: description.value || t('pages.donate.vietqr.donationMessage'),
    accountName: selectedBank.value.accountName
  })
  return `${baseUrl}?${params.toString()}`
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}

// Copy to clipboard
const copiedAddress = ref<string | null>(null)
const copyToClipboard = async (text: string, id: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedAddress.value = id
    setTimeout(() => {
      copiedAddress.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Process QR image: grayscale → invert → remove background
const processedQrUrl = ref<string | null>(null)
const isProcessing = ref(false)
const colorMode = useColorMode()

const processQrImage = async (imageUrl: string, isDark: boolean) => {
  if (typeof window === 'undefined') return

  isProcessing.value = true

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height

    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Màu QR cho dark mode: #e5e7eb (229, 231, 235)
    const qrColorDark = { r: 229, g: 231, b: 235 }
    // Màu QR cho light mode: giữ đen
    const qrColorLight = { r: 0, g: 0, b: 0 }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Bước 1: Chuyển sang grayscale (loại bỏ màu đỏ của logo)
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

      // Ảnh gốc từ VietQR: nền TRẮNG (gray ~255), QR ĐEN (gray ~0), logo ĐỎ

      if (gray > 200) {
        // Nền trắng gốc → trong suốt
        data[i] = 0
        data[i + 1] = 0
        data[i + 2] = 0
        data[i + 3] = 0
      } else {
        // QR đen gốc + logo đỏ → chuyển về màu QR
        if (isDark) {
          // Dark mode: màu #e5e7eb, alpha 100%
          data[i] = qrColorDark.r
          data[i + 1] = qrColorDark.g
          data[i + 2] = qrColorDark.b
          data[i + 3] = 255
        } else {
          // Light mode: màu đen, alpha 50%
          data[i] = qrColorLight.r
          data[i + 1] = qrColorLight.g
          data[i + 2] = qrColorLight.b
          data[i + 3] = 128 // 0.5 * 255 = 127.5 ≈ 128
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
    processedQrUrl.value = canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error processing QR image:', error)
    processedQrUrl.value = null
  } finally {
    isProcessing.value = false
  }
}

// Process Crypto QR image
const processedCryptoQrUrls = ref<Record<string, string | null>>({})
const processingCryptoQr = ref<Record<string, boolean>>({})

const processCryptoQrImage = async (crypto: typeof cryptoOptions[0], isDark: boolean) => {
  if (typeof window === 'undefined') return

  processingCryptoQr.value[crypto.id] = true

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const qrUrl = getCryptoQrUrl(crypto.address)

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = qrUrl
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height

    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    const qrColorDark = { r: 229, g: 231, b: 235 }
    const qrColorLight = { r: 0, g: 0, b: 0 }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      // Skip transparent pixels
      if (a === 0) continue

      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

      if (gray > 200) {
        // White background → transparent
        data[i + 3] = 0
      } else {
        // Dark pixels (QR code)
        if (isDark) {
          data[i] = qrColorDark.r
          data[i + 1] = qrColorDark.g
          data[i + 2] = qrColorDark.b
          data[i + 3] = 255
        } else {
          data[i] = qrColorLight.r
          data[i + 1] = qrColorLight.g
          data[i + 2] = qrColorLight.b
          data[i + 3] = 128
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
    processedCryptoQrUrls.value[crypto.id] = canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error processing crypto QR image:', error)
    processedCryptoQrUrls.value[crypto.id] = null
  } finally {
    processingCryptoQr.value[crypto.id] = false
  }
}

// Watch QR URL và color mode, xử lý khi thay đổi
watch([qrUrl, () => colorMode.value], ([newUrl, mode]) => {
  if (newUrl) {
    const isDark = mode === 'dark'
    processQrImage(newUrl, isDark)
  }
}, { immediate: true })

// Watch color mode for crypto QR
watch(() => colorMode.value, (mode) => {
  const isDark = mode === 'dark'
  cryptoOptions.forEach(crypto => {
    processCryptoQrImage(crypto, isDark)
  })
}, { immediate: true })

// Xử lý khi mounted (client-side)
onMounted(() => {
  const isDark = colorMode.value === 'dark'
  if (qrUrl.value) {
    processQrImage(qrUrl.value, isDark)
  }
  // Process all crypto QR codes
  cryptoOptions.forEach(crypto => {
    processCryptoQrImage(crypto, isDark)
  })
})
</script>

<template>
  <PageLayout :title="t('pages.donate.title')" :description="t('pages.donate.description')"
    class="space-y-8 sm:space-y-12 pb-8 sm:pb-12">
    <!-- VietQR Payment Section -->
    <section class="space-y-3 sm:space-y-4">
      <PageTitle>
        <span class="inline-flex items-center gap-2">
          <Icon name="heroicons:heart" class="h-5 w-5" />
          {{ t('pages.donate.vietqr.title') }}
        </span>
      </PageTitle>

      <!-- Bank Selector -->
      <div class="flex flex-wrap gap-2 sm:gap-3">
        <button
          v-for="bank in banks"
          :key="bank.id"
          @click="selectedBank = bank"
          :class="[
            'flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm sm:text-base transition-all duration-200',
            selectedBank.id === bank.id
              ? 'bg-blue-600 dark:bg-blue-500 text-white ring-2 ring-blue-600 dark:ring-blue-500'
              : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/10 dark:ring-white/10'
          ]"
        >
          <img
            :src="bank.logo"
            :alt="bank.name"
            class="h-5 w-5 sm:h-6 sm:w-6 object-contain transition-all duration-200"
            :class="[
              selectedBank.id === bank.id
                ? 'brightness-0 invert'
                : 'brightness-0 dark:invert'
            ]"
          />
          <span>{{ bank.name }}</span>
        </button>
      </div>

      <div class="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <!-- QR Code Card -->
        <div class="card-base p-4 sm:p-6">
          <div class="space-y-4">
            <div class="flex justify-center">
              <div class="relative inline-block qr-wrapper rounded-xl">
                <!-- Loading state -->
                <div v-if="isProcessing || !processedQrUrl"
                  class="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-xl">
                  <Icon name="svg-spinners:ring-resize" class="w-8 h-8 text-black/30 dark:text-white/30" />
                </div>
                <!-- Processed QR -->
                <img
                  v-else
                  :src="processedQrUrl"
                  alt="Mã Thanh Toán VietQR"
                  class="w-64 h-64 sm:w-80 sm:h-80 object-contain"
                />
              </div>
            </div>

            <!-- Bank Info -->
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm sm:text-base">
                <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <Icon name="heroicons:building-library"
                    class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
                  <span>{{ t('pages.donate.vietqr.bank') }}</span>
                </div>
                <div class="truncate text-xs sm:text-sm font-semibold">
                  {{ selectedBank.name }} ({{ selectedBank.shortName }})
                </div>
              </div>

              <div class="flex items-center justify-between text-sm sm:text-base">
                <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <Icon name="heroicons:credit-card" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
                  <span>{{ t('pages.donate.vietqr.accountNumber') }}</span>
                </div>
                <div class="truncate text-xs sm:text-sm font-mono font-semibold">
                  {{ selectedBank.accountNumber }}
                </div>
              </div>

              <div class="flex items-center justify-between text-sm sm:text-base">
                <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <Icon name="heroicons:user" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
                  <span>{{ t('pages.donate.vietqr.accountName') }}</span>
                </div>
                <div class="truncate text-xs sm:text-sm font-semibold">
                  {{ selectedBank.accountName }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Donation Form Card -->
        <div class="card-base p-4 sm:p-6">
          <p class="text-sm sm:text-base leading-relaxed text-black/60 dark:text-white/60 mb-4 sm:mb-6">
            {{ t('pages.donate.vietqr.supportMessage') }}
          </p>

          <div class="space-y-4">
            <!-- Quick Amount Selection -->
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2 mb-2">
                <Icon name="heroicons:banknotes" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
                <span class="text-sm sm:text-base font-medium">{{ t('pages.donate.vietqr.quickAmount') }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="preAmount in predefinedAmounts" :key="preAmount" @click="amount = preAmount.toString()"
                  :class="[
                    'px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200',
                    amount === preAmount.toString()
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : 'bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
                  ]">
                  {{ formatCurrency(preAmount) }}
                </button>
              </div>
            </div>

            <!-- Custom Amount -->
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2 mb-2">
                <Icon name="heroicons:pencil-square" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
                <span class="text-sm sm:text-base font-medium">{{ t('pages.donate.vietqr.customAmount') }}</span>
              </div>
              <input v-model="amount" type="number" :placeholder="t('pages.donate.vietqr.amountPlaceholder')"
                class="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200">
            </div>

            <!-- Message -->
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2 mb-2">
                <Icon name="heroicons:chat-bubble-left-right"
                  class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
                <span class="text-sm sm:text-base font-medium">{{ t('pages.donate.vietqr.message') }}</span>
              </div>
              <textarea v-model="description" :placeholder="t('pages.donate.vietqr.messagePlaceholder')" rows="3"
                class="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none transition-all duration-200"></textarea>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Crypto Payment Section -->
    <section class="space-y-3 sm:space-y-4">
      <PageTitle>
        <span class="inline-flex items-center gap-2">
          <Icon name="heroicons:currency-dollar" class="h-5 w-5" />
          {{ t('pages.donate.crypto.title') }}
        </span>
      </PageTitle>

      <div class="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <div v-for="crypto in cryptoOptions" :key="crypto.id" class="card-base p-4 sm:p-6">
          <div class="flex items-center gap-3 mb-4">
            <Icon :name="crypto.icon" class="h-8 w-8 sm:h-10 sm:w-10" />
            <div>
              <h3 class="font-semibold text-black/90 dark:text-white/90 text-base sm:text-lg">
                {{ crypto.name }}
              </h3>
              <p class="text-black/50 dark:text-white/50 text-xs sm:text-sm">
                {{ crypto.network }}
              </p>
            </div>
          </div>

          <!-- QR Code -->
          <div class="flex justify-center mb-4">
            <div class="relative inline-block rounded-xl">
              <!-- Loading state -->
              <div v-if="processingCryptoQr[crypto.id] || !processedCryptoQrUrls[crypto.id]"
                class="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-xl">
                <Icon name="svg-spinners:ring-resize" class="w-6 h-6 text-black/30 dark:text-white/30" />
              </div>
              <!-- Processed QR -->
              <img
                v-else
                :src="processedCryptoQrUrls[crypto.id]!"
                :alt="`${crypto.name} QR Code`"
                class="w-40 h-40 sm:w-48 sm:h-48 object-contain"
              />
            </div>
          </div>

          <div class="space-y-3">
            <!-- Address -->
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2 mb-2">
                <Icon name="heroicons:wallet" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
                <span class="text-sm font-medium">{{ t('pages.donate.crypto.walletAddress') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <code class="flex-1 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 text-xs sm:text-sm font-mono text-black/80 dark:text-white/80 break-all">
                  {{ crypto.address }}
                </code>
                <button
                  @click="copyToClipboard(crypto.address, crypto.id)"
                  class="flex-shrink-0 p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  :title="copiedAddress === crypto.id ? t('pages.donate.crypto.copied') : t('pages.donate.crypto.copyAddress')"
                >
                  <Icon
                    :name="copiedAddress === crypto.id ? 'heroicons:check' : 'heroicons:clipboard-document'"
                    class="h-4 w-4 sm:h-5 sm:w-5"
                    :class="copiedAddress === crypto.id ? 'text-green-500' : 'text-black/50 dark:text-white/50'"
                  />
                </button>
              </div>
            </div>

            <!-- Minimum -->
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <Icon name="heroicons:information-circle" class="h-4 w-4 sm:h-5 sm:w-5 text-black/50 dark:text-white/50" />
                <span class="text-black/60 dark:text-white/60">{{ t('pages.donate.crypto.minimum') }}</span>
              </div>
              <span class="font-semibold text-black/80 dark:text-white/80">{{ crypto.minimum }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Support Platforms -->
    <section class="space-y-3 sm:space-y-4">
      <PageTitle>{{ t('pages.donate.platforms.title') }}</PageTitle>

      <div class="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-2">
        <Button v-if="$config.public?.sponsor?.github" :href="$config.public.sponsor.github" blank>
          <template #icon>
            <Icon name="mdi:github" class="h-4 w-4 sm:h-5 sm:w-5" />
          </template>
          GitHub Sponsors
        </Button>

        <Button href="https://ko-fi.com/vhming" blank>
          <template #icon>
            <Icon name="simple-icons:kofi" class="h-4 w-4 sm:h-5 sm:w-5" />
          </template>
          Ko-fi
        </Button>

        <Button href="https://www.patreon.com/vhming" blank>
          <template #icon>
            <Icon name="mdi:patreon" class="h-4 w-4 sm:h-5 sm:w-5" />
          </template>
          Patreon
        </Button>

        <Button href="https://www.buymeacoffee.com/vhming" blank>
          <template #icon>
            <Icon name="simple-icons:buymeacoffee" class="h-4 w-4 sm:h-5 sm:w-5" />
          </template>
          Buy Me a Coffee
        </Button>
      </div>
    </section>

    <!-- Payment Steps -->
    <section class="space-y-3 sm:space-y-4">
      <PageTitle>
        <span class="inline-flex items-center gap-2">
          <Icon name="heroicons:book-open" class="h-5 w-5" />
          {{ t('pages.donate.vietqr.steps.title') }}
        </span>
      </PageTitle>
      <div class="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
        <div v-for="(step, index) in paymentSteps" :key="index" class="card-base p-4 text-center">
          <Icon :name="step.icon" class="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2" />
          <h4 class="font-semibold text-black/80 dark:text-white/80 text-xs sm:text-sm mb-1">
            {{ step.title }}
          </h4>
          <p class="text-black/50 dark:text-white/50 text-[10px] sm:text-xs leading-relaxed">
            {{ step.description }}
          </p>
        </div>
      </div>
    </section>
  </PageLayout>
</template>

<style scoped>
.qr-wrapper {
  padding: 1rem;
}

/* Light mode: nền trắng để QR trắng hiển thị trên card */
/* Dark mode: không cần nền vì QR trắng hiển thị trên nền tối của card */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
