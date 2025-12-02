<script lang="ts" setup>
interface Props {
  type?:
    | "repository"
    | "iframe"
    | "song"
    | "block"
    | "spinner"
    | "rounded"
  iframeUrl?: string | boolean | null
}

const props = withDefaults(defineProps<Props>(), {
  type: "block",
  iframeUrl: null,
})

const attrs = useAttrs()
const { class: className, ...restAttrs } = attrs
</script>

<template>
  <!-- Repository Card -->
  <SkeletonLoaderRepository v-if="type === 'repository'" v-bind="restAttrs" :class="className" />

  <!-- Iframe -->
  <SkeletonLoaderIframe v-else-if="type === 'iframe'" :iframe-url="iframeUrl" v-bind="restAttrs" :class="className" />

  <!-- Song Card -->
  <SkeletonLoaderSong v-else-if="type === 'song'" v-bind="restAttrs" :class="className" />

  <!-- Spinner -->
  <SkeletonLoaderSpinner v-else-if="type === 'spinner'" v-bind="restAttrs" :class="className" />

  <!-- Block -->
  <div
    v-else-if="type === 'block'"
    class="bg-black/5 rounded animate-pulse dark:bg-white/5"
    v-bind="restAttrs"
    :class="className"
  />

  <!-- Rounded -->
  <div
    v-else-if="type === 'rounded'"
    class="bg-black/5 rounded-full animate-pulse dark:bg-white/5"
    v-bind="restAttrs"
    :class="className"
  />
</template>
