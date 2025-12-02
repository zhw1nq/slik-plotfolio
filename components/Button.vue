<script setup lang="ts">
interface Props {
  href?: any
  icon?: string | null
  block?: boolean
  rounded?: boolean
  blank?: boolean
  disabled?: boolean
  backdrop?: boolean
}

defineProps<Props>()
</script>

<template>
  <SmartLink
    v-if="href && !disabled"
    :href="href"
    :blank="blank"
    :class="[
      'cursor-pointer justify-center px-3 sm:px-5 py-1.5 sm:py-2 card-base flex items-center space-x-1.5 sm:space-x-2 text-sm sm:text-base',
      rounded ? 'rounded-full' : 'rounded-lg',
      backdrop && 'backdrop-blur-lg',
      !block && 'w-max',
    ]"
  >
    <Icon :name="icon" v-if="icon && !$slots.icon" class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    <slot v-else name="icon" />
    <span v-if="$slots.default">
      <slot />
    </span>
  </SmartLink>
  <button
    v-else
    :disabled="disabled"
    :class="[
      'cursor-pointer justify-center px-3 sm:px-5 py-1.5 sm:py-2 card-base flex items-center space-x-1.5 sm:space-x-2 text-sm sm:text-base',
      rounded ? 'rounded-full' : 'rounded-lg',
      backdrop && 'backdrop-blur-lg',
      !block && 'w-max',
      disabled && 'opacity-50 cursor-not-allowed',
    ]"
  >
    <Icon :name="icon" v-if="icon && !$slots.icon" class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    <slot v-else name="icon" />
    <span v-if="$slots.default">
      <slot />
    </span>
  </button>
</template>
