/* Define constants */
const image = "https://vhming.com/myLogo.svg"
const description =
  "Professional JavaScript developer from Turkey specializing in React.js, Vue.js, TypeScript, Node.js, and Flutter. Passionate about crafting innovative software solutions and continuously improving programming skills."

const head = {
  title: "vhming.com",
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    {
      hid: "description",
      name: "description",
      content: description,
    },
    /* Twitter */
    {
      hid: "twitter:card",
      name: "twitter:card",
      content: "summary",
    },
    {
      hid: "twitter:site",
      name: "twitter:site",
      content: "@zhw1nq",
    },
    {
      hid: "twitter:creator",
      name: "twitter:creator",
      content: "@zhw1nq",
    },
    {
      hid: "twitter:title",
      name: "twitter:title",
      content: "vhming.com",
    },
    {
      hid: "twitter:description",
      name: "twitter:description",
      content: description,
    },
    {
      hid: "twitter:image",
      name: "twitter:image",
      content: image,
    },
    /* Open-Graph */
    {
      hid: "og:type",
      name: "og:type",
      content: "website",
    },
    {
      hid: "og:site_name",
      name: "og:site_name",
      content: "vhming.com",
    },
    {
      hid: "og:description",
      name: "og:description",
      content: description,
    },
    {
      hid: "og:image",
      name: "og:image",
      content: image,
    },
    /* Others */
    {
      hid: "theme-color",
      name: "theme-color",
      content: "#171717",
    },
  ].map((i) => {
    // @ts-ignore-next-line
    if (i.name && !i.property) i.property = i.name
    return i
  }),
  link: [
    {
      rel: "icon",
      type: "image/x-icon",
      href: "https://vhming.com/assets/icons/icon.ico",
    },
    {
      rel: "stylesheet",
      type: "text/css",
      href: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css",
    },
  ],
}

export default head
