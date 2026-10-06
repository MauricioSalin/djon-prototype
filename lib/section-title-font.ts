import { Raleway } from "next/font/google"

// Section headings share the original team title's loaded font, independently
// of the optional body font and the mobile system-font policy.
const sectionTitleFont = Raleway({
  subsets: ["latin"],
  weight: "900",
  style: "normal",
  display: "swap",
  preload: false,
})

export const sectionTitleFontClassName = sectionTitleFont.className
export const sectionTitleClassName = `${sectionTitleFontClassName} text-3xl md:text-5xl font-black tracking-tighter`
