import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // PWA: 오프라인 캐시 + iPhone 홈 화면 추가(standalone)
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "favicon.svg"],
      manifest: {
        name: "서킷 뽑기",
        short_name: "서킷 뽑기",
        description: "홈트 서킷 랜덤 생성기 + 음성 가이드 타이머",
        lang: "ko",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        background_color: "#1E2126",
        theme_color: "#1E2126",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // 음성 클립(voice/*)과 자세 삽화(art/*)까지 프리캐시 — 오프라인에서도 동작
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}", "voice/*.{mp3,json}", "art/*.webp"],
        globIgnores: ["splash/**", "og.png"], // iOS 설치용·공유 크롤러용 파일 — 오프라인 캐시 불필요
        // 확장자 있는 경로는 SPA 폴백(index.html) 대상에서 제외 — 프리캐시에 없는
        // 파일(splash/og 등)을 주소창으로 열 때 앱 화면이 뜨는 문제 방지
        navigateFallbackDenylist: [/\.[a-z0-9]+$/i],
        // 구글 폰트는 첫 온라인 로드 때 캐시해 이후 오프라인에서도 유지
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-woff",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { host: true }, // 같은 와이파이의 폰에서 접속해 테스트할 수 있게
});
