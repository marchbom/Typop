import "@testing-library/jest-dom"

// jsdom에는 RAF/CAF가 없으므로 전역 stub 추가
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16)
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id)
}

// Electron window.api mock
window.api = {
  lyrics: {
    search: vi.fn(),
    getLyrics: vi.fn()
  },
  auth: {
    openGoogleLogin: vi.fn()
  }
} as unknown as typeof window.api
