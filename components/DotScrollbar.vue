<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const scrollProgress = ref<number>(0)
const isVisible = ref<boolean>(false)
const isDragging = ref<boolean>(false)
const hideTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const updateScrollProgress = (): void => {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight

  if (docHeight > 0) {
    scrollProgress.value = (scrollTop / docHeight) * 100
  }

  // Show scrollbar when scrolling
  isVisible.value = true

  // Hide after 2 seconds of no scrolling
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
  }
  hideTimeout.value = setTimeout(() => {
    if (!isDragging.value) {
      isVisible.value = false
    }
  }, 2000)
}

// Dot moves from 0% to 100% of the track
const dotPosition = computed<number>(() => {
  return scrollProgress.value
})

const handleTrackClick = (event: MouseEvent): void => {
  const track = event.currentTarget as HTMLElement
  const rect = track.getBoundingClientRect()
  const clickY = event.clientY - rect.top
  const trackHeight = rect.height

  // Calculate scroll position based on click
  const clickPercent = clickY / trackHeight
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  const scrollTo = clickPercent * docHeight

  window.scrollTo({
    top: scrollTo,
    behavior: 'smooth'
  })
}

const startDrag = (event: MouseEvent | TouchEvent): void => {
  event.preventDefault()
  isDragging.value = true
  isVisible.value = true

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (event: MouseEvent | TouchEvent): void => {
  if (!isDragging.value) return

  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  const windowHeight = window.innerHeight

  // Track is from 45% to 55% of viewport (10% height)
  const trackStart = windowHeight * 0.45
  const trackEnd = windowHeight * 0.55
  const trackHeight = trackEnd - trackStart

  let percent = (clientY - trackStart) / trackHeight
  percent = Math.max(0, Math.min(1, percent))

  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({
    top: percent * docHeight,
    behavior: 'auto'
  })
}

const stopDrag = (): void => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)

  // Start hide timeout
  hideTimeout.value = setTimeout(() => {
    isVisible.value = false
  }, 2000)
}

const handleMouseEnter = (): void => {
  isVisible.value = true
}

const handleMouseLeave = (): void => {
  if (!isDragging.value) {
    isVisible.value = false
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateScrollProgress, { passive: true })
  updateScrollProgress()

  // Show initially then fade
  isVisible.value = true
  hideTimeout.value = setTimeout(() => {
    isVisible.value = false
  }, 3000)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollProgress)
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
  }
})
</script>

<template>
  <div
    class="dot-scrollbar"
    :class="{ 'is-visible': isVisible || isDragging }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Track line -->
    <div
      class="scrollbar-track"
      @click="handleTrackClick"
    >
      <div class="track-line" />

      <!-- Dot indicator - moves from top to bottom of track -->
      <div
        class="scrollbar-dot"
        :style="{ top: `${dotPosition}%` }"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <div class="dot-inner" />
        <div class="dot-glow" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dot-scrollbar {
  position: fixed;
  right: 12px;
  top: 0;
  bottom: 0;
  width: 16px;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.dot-scrollbar.is-visible {
  opacity: 1;
  pointer-events: auto;
}

/* Track - short line in center, 10% of viewport height */
.scrollbar-track {
  position: absolute;
  right: 4px;
  top: 45%;
  height: 10%;
  width: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Dark mode track line - white */
.track-line {
  position: absolute;
  width: 2px;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.2);
}

/* Light mode track line */
:global(html:not(.dark)) .track-line {
  background: rgba(74, 63, 92, 0.4);
  box-shadow: 0 0 6px rgba(74, 63, 92, 0.3);
}

.scrollbar-dot {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  cursor: grab;
  transition: top 0.15s ease-out;
}

.scrollbar-dot:active {
  cursor: grabbing;
}

/* Dark mode dot - white */
.dot-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  border-radius: 50%;
  box-shadow: 
    0 0 6px rgba(255, 255, 255, 0.7),
    0 0 12px rgba(255, 255, 255, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.scrollbar-dot:hover .dot-inner {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 
    0 0 10px rgba(255, 255, 255, 0.9),
    0 0 20px rgba(255, 255, 255, 0.6);
}

/* Dark mode glow - white */
.dot-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 70%
  );
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.4;
  }
}

/* Light mode track line */
:global(html:not(.dark)) .track-line {
  background: rgba(0, 0, 0, 0.15);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

/* Light mode dot - black/dark gray */
:global(html:not(.dark)) .dot-inner {
  background: linear-gradient(135deg, #333333 0%, #1a1a1a 100%);
  box-shadow: 
    0 0 6px rgba(0, 0, 0, 0.5),
    0 0 12px rgba(0, 0, 0, 0.3);
}

:global(html:not(.dark)) .scrollbar-dot:hover .dot-inner {
  box-shadow: 
    0 0 10px rgba(0, 0, 0, 0.7),
    0 0 20px rgba(0, 0, 0, 0.4);
}

:global(html:not(.dark)) .dot-glow {
  background: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    transparent 70%
  );
}
</style>

