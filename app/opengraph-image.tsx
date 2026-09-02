import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { socialImageAlt } from "@/lib/seo"

export const alt = socialImageAlt
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

const logoDataPromise = readFile(
  join(process.cwd(), "public", "images", "djon-verde.png"),
  "base64",
)

export default async function OpenGraphImage() {
  const logoData = await logoDataPromise
  const logoSrc = `data:image/png;base64,${logoData}`

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#121212",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {/* ImageResponse renders its local image asset through Satori. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height={190}
          src={logoSrc}
          width={751}
        />
      </div>
    ),
    size,
  )
}
