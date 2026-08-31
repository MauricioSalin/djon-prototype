import { redirect } from "next/navigation"

type CourseMaterialsRedirectProps = {
  params: Promise<{ id: string }>
}

export default async function CourseMaterialsRedirect({
  params,
}: CourseMaterialsRedirectProps) {
  const { id } = await params
  redirect(
    `/dashboard/material?category=Cursos&course=${encodeURIComponent(id)}`,
  )
}
