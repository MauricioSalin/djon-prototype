import type { ImageLoader } from "next/image"

export const passthroughImageLoader: ImageLoader = ({ src }) => src

export function shouldBypassImageOptimization(src: string) {
  return !src.startsWith("/")
}
