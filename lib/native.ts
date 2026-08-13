// Bridge between the web app and the native Android wrapper (Capacitor).
// In the browser, files are saved via a classic blob download.
// In the Android app, blob downloads are not supported by the WebView, so the
// file is written to the app cache and handed to the system share sheet
// (save to Files / Google Drive / send via WhatsApp…).

export function isNative(): boolean {
  if (typeof window === "undefined") return false
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.()
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1] ?? result)
    }
    reader.readAsDataURL(blob)
  })
}

export async function saveFile(filename: string, blob: Blob): Promise<void> {
  if (!isNative()) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  // Native Android path
  const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem")
  const { Share } = await import("@capacitor/share")
  const base64 = await blobToBase64(blob)
  const path = `${Date.now()}-${filename}`
  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  const uri = await Filesystem.getUri({ path, directory: Directory.Cache })
  try {
    await Share.share({ title: filename, url: uri.uri })
  } finally {
    await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined)
  }
}
