export function getReportFileName(response: Response, fallback: string) {
  const disposition = response.headers.get("content-disposition") || ""
  const match = disposition.match(/filename="([^"]+)"/)

  return match?.[1] || fallback
}

export async function downloadReport(url: string, fallbackFileName: string) {
  const response = await fetch(url)

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const data = await response.json()
      throw new Error(data?.message || "No se pudo generar el reporte.")
    }

    throw new Error("No se pudo generar el reporte.")
  }

  const blob = await response.blob()
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = downloadUrl
  link.download = getReportFileName(response, fallbackFileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(downloadUrl)
}
