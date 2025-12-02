import { defineNuxtConfig } from "nuxt/config"
import head from "./config/head"

const nitroPreset = process.env.NITRO_PRESET || "vercel"

export default defineNuxtConfig({
  nitro: {
    preset: nitroPreset,
    experimental: {
      trustedProxy: true,
    },
    ...(process.env.NODE_ENV === "development" && {
      minify: false,
      sourceMap: false,
    }),
  },

  devServer: {
    host: "0.0.0.0",
  },

  app: {
    head,
    pageTransition: { name: "fade", mode: "out-in" },
  },

  vite: {
    optimizeDeps: {
      include: ["vue-i18n", "vue-tippy", "medium-zoom"],
      exclude: process.env.NODE_ENV === "development" ? ["@nuxtjs/google-fonts"] : [],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },

  css: ["~/assets/css/main.scss"],

  modules: [
    ...(process.env.NODE_ENV === "production" ? ["@vite-pwa/nuxt"] : []),
    [
      "@nuxtjs/color-mode",
      {
        preference: "system",
        fallback: "light",
        hid: "nuxt-color-mode-script",
        classSuffix: "",
        storageKey: "color-mode",
      },
    ],
    [
      "@nuxt/icon",
      {
        serverBundle: {
          collections: process.env.NODE_ENV === "production"
            ? ["heroicons", "line-md", "mdi", "svg-spinners", "devicon"]
            : ["heroicons", "line-md", "mdi"],
        },
      },
    ],
    ...(process.env.NODE_ENV === "production" ? ["@nuxtjs/sitemap", "@nuxtjs/robots"] : []),
    ...(process.env.NODE_ENV === "production"
      ? [
          [
            "@nuxtjs/google-fonts",
            {
              display: "swap",
              families: {
                Inter: [400, 500, 600, 700],
              },
              preload: false,
              preconnect: false,
            },
          ],
        ]
      : []),
    [
      "@nuxtjs/tailwindcss",
      {
        viewer: false,
        config: "~/tailwind.config.ts",
        exposeConfig: false,
        injectPosition: 0,
        cssPath: "~/assets/css/tailwind.css",
      },
    ],
    ...(process.env.NODE_ENV === "production"
      ? [
          [
            "nuxt-disqus",
            {
              shortname: "vhming-com",
            },
          ],
        ]
      : []),
    [
      "nuxt-gtag",
      {
        enabled: process.env.NODE_ENV === "production",
        id: process.env.GOOGLE_ANALYTICS_ID,
      },
    ],
  ],

  sitemap: {},

  site: {
    url: "https://vhming.com",
    name: "vhming.com",
  },

  pwa: {
    manifest: {
      name: "vhming.com",
      short_name: "vhming.com",
      theme_color: "#f56565",
      description:
        "Professional JavaScript developer from Turkey specializing in React.js, Vue.js, TypeScript, Node.js, and Flutter. Passionate about crafting innovative software solutions and continuously improving programming skills.",
      lang: "en",
      icons: [
        {
          src: "/myLogo.svg",
          sizes: "512x512",
          type: "image/svg+xml",
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      social: {
        github: "https://github.com/zhw1nq",
        email: "vhming@zhw1nq.com",
        emailAlt: "hi@vhming.com",
        phone: "+84 876.7878.32",
        discord: "@vhming_",
      },
      location: {
        timezone: "UTC+7 và UTC+8",
        address: "Phường Móng Cái 1, Tỉnh Quảng Ninh, Việt Nam",
      },
      sponsor: {
        github: "https://github.com/sponsors/vhming",
      },
      discord: {
        userId: process.env.DISCORD_USER_ID || "1263398676345393204",
      },
      isDev: process.env.NODE_ENV === "development",
      spotifyApiUrl: process.env.SPOTIFY_API_URL || "/api/spotify",
    },
  },

  compatibilityDate: "2025-01-16",
})
