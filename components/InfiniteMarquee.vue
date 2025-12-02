<script setup lang="ts">
interface Props {
  direction?: 'left' | 'right'
  speed?: number // pixels per second
  pauseOnHover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'left',
  speed: 30, // 30px per second
  pauseOnHover: true
})

const marqueeRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const copies = ref(2)
const duration = ref(20)

// Calculate how many copies we need to fill the container and animation duration
onMounted(() => {
  if (marqueeRef.value && contentRef.value) {
    const containerWidth = marqueeRef.value.offsetWidth
    const contentWidth = contentRef.value.offsetWidth
    if (contentWidth > 0) {
      // Need at least 2 copies, but more if content is smaller than container
      copies.value = Math.max(2, Math.ceil((containerWidth * 2) / contentWidth) + 1)
      // Calculate duration based on content width and speed (pixels per second)
      // Duration = contentWidth / speed
      duration.value = contentWidth / props.speed
    }
  }
})

const animationStyle = computed(() => ({
  '--duration': `${duration.value}s`,
  '--direction': props.direction === 'left' ? 'normal' : 'reverse'
}))
</script>

<template>
  <div 
    ref="marqueeRef"
    class="marquee-wrapper" 
    :class="{ 'pause-on-hover': pauseOnHover }"
    :style="animationStyle"
  >
    <div class="marquee-track">
      <div ref="contentRef" class="marquee-content">
        <slot />
      </div>
      <div v-for="i in copies - 1" :key="i" class="marquee-content" aria-hidden="true">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.marquee-wrapper {
  overflow: hidden;
  position: relative;
  width: 100%;
  /* Mask để fade icons ở 2 đầu */
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
}

.marquee-track {
  display: flex;
  width: max-content;
  animation: scroll var(--duration) linear infinite;
  animation-direction: var(--direction);
}

.pause-on-hover:hover .marquee-track {
  animation-play-state: paused;
}

.marquee-content {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-100% / v-bind(copies)));
  }
}
</style>
