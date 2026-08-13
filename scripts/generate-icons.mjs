// Generates all Android launcher icons + splash from the brand SVG
import sharp from 'sharp'
import { mkdirSync } from 'fs'

const ROOT = new URL('../', import.meta.url).pathname

const BOLT = `
<g transform="translate(87.7, 83.3) scale(1.45)">
  <path fill="#ffffff" d="M101.141 53H136.632C151.023 53 162.689 64.6662 162.689 79.0573V112.904H148.112V79.0573C148.112 78.7105 148.098 78.3662 148.072 78.0251L112.581 112.898C112.701 112.902 112.821 112.904 112.941 112.904H148.112V126.672H112.941C98.5504 126.672 86.5638 114.891 86.5638 100.5V66.7434H101.141V100.5C101.141 101.15 101.191 101.792 101.289 102.422L137.56 66.7816C137.255 66.7563 136.945 66.7434 136.632 66.7434H101.141V53Z" />
  <path fill="#ffffff" d="M65.2926 124.136L14 66.7372H34.6355L64.7495 100.436V66.7372H80.1365V118.47C80.1365 126.278 70.4953 129.958 65.2926 124.136Z" />
</g>`

function foregroundSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">${BOLT}</svg>`
}

const res = `${ROOT}android/app/src/main/res/`
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
const LEGACY = 48 // base size for mdpi
const FG = 108 // adaptive foreground base size for mdpi

// Legacy (full-bleed) + round icons
for (const [dpi, mult] of Object.entries(densities)) {
  const size = LEGACY * mult
  const dir = `${res}mipmap-${dpi}/`
  mkdirSync(dir, { recursive: true })
  await sharp(`${ROOT}public/app-icon.svg`, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(`${dir}ic_launcher.png`)
  await sharp(`${ROOT}public/app-icon.svg`, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(`${dir}ic_launcher_round.png`)
  // Adaptive foreground (bolt in safe zone, transparent bg)
  await sharp(Buffer.from(foregroundSvg(FG * mult)))
    .png()
    .toFile(`${dir}ic_launcher_foreground.png`)
  console.log(`✓ ${dpi} (${size}px)`)
}

// Splash
await sharp(Buffer.from(`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#2563eb"/></svg>`))
  .png()
  .toFile(`${res}drawable/splash.png`)
console.log('✓ splash.png')
