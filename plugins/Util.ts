import prepareMeta from "~/utils/prepareMeta"

export default defineNuxtPlugin(() => {
  return {
    provide: {
      prepareMeta,
    },
  }
})
