import { model } from "@medusajs/framework/utils"

// One slide of the home page hero, edited from the admin (order, image, texts, link, on/off).
export const HomeBanner = model.define("home_banner", {
  id: model.id({ prefix: "hbanner" }).primaryKey(),
  position: model.number().default(0),
  is_active: model.boolean().default(true),
  title: model.text(),
  description: model.text().nullable(),
  cta_label: model.text(),
  cta_href: model.text(),
  // Portrait 4:5 visuals, each a path served by the shop (/banners/...) or a file uploaded from the admin.
  // image_url: the version with its lettering, shown on phones (where the slide shows no title of its own).
  image_url: model.text().nullable(),
  // image_desktop_url: the same visual without lettering, shown on computers next to the title and button.
  // Computers fall back to image_url while it is missing.
  image_desktop_url: model.text().nullable(),
  image_alt: model.text().nullable(),
  // Background behind the slide, taken from the visual's scene colour
  bg_color: model.text().nullable(),
})
