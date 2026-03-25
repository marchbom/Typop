import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useTyping } from "../renderer/src/hooks/useTyping"
import { SongResult } from "../renderer/src/types"

const mockSong: SongResult = {
  id: 1,
  title: "Dynamite",
  artist: "BTS",
  thumbnail: "",
  url: ""
}

const mockLyrics = ["Cause I, I, I'm in the stars tonight", "So watch me bring the fire"]

describe("useTyping", () => {
  beforeEach(() => {
    vi.mocked(window.api.lyrics.getLyrics).mockReset()
  })

  it("song이 null이면 초기 상태 유지", () => {
    const { result } = renderHook(() => useTyping(null))
    expect(result.current.loading).toBe(false)
    expect(result.current.lyrics).toEqual([])
    expect(result.current.lineIndex).toBe(0)
  })

  it("song 로딩 시작 시 loading true", async () => {
    vi.mocked(window.api.lyrics.getLyrics).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useTyping(mockSong))
    expect(result.current.loading).toBe(true)
  })

  it("가사 로드 성공", async () => {
    vi.mocked(window.api.lyrics.getLyrics).mockResolvedValue(mockLyrics)
    const { result } = renderHook(() => useTyping(mockSong))

    await act(async () => {})
    expect(result.current.lyrics).toEqual(mockLyrics)
    expect(result.current.loading).toBe(false)
  })

  it("가사 로드 실패 시 error 설정", async () => {
    vi.mocked(window.api.lyrics.getLyrics).mockRejectedValue(new Error("fail"))
    const { result } = renderHook(() => useTyping(mockSong))

    await act(async () => {})
    expect(result.current.error).toBe("가사 로딩 실패")
  })

  it("가사가 빈 배열이면 에러 메시지", async () => {
    vi.mocked(window.api.lyrics.getLyrics).mockResolvedValue([])
    const { result } = renderHook(() => useTyping(mockSong))

    await act(async () => {})
    expect(result.current.error).toBe("가사를 불러올 수 없습니다.")
  })

  describe("입력 처리", () => {
    async function setupWithLyrics() {
      vi.mocked(window.api.lyrics.getLyrics).mockResolvedValue(mockLyrics)
      const { result } = renderHook(() => useTyping(mockSong))
      await act(async () => {})
      return result
    }

    function makeInputEvent(val: string): React.ChangeEvent<HTMLInputElement> {
      return { target: { value: val } } as React.ChangeEvent<HTMLInputElement>
    }

    it("올바른 글자 입력 시 correct charState", async () => {
      const result = await setupWithLyrics()
      // "Cause I" 첫 글자들
      act(() => result.current.handleInput(makeInputEvent("C")))
      expect(result.current.charStates[0]).toBe("correct")
    })

    it("틀린 글자 입력 시 wrong charState", async () => {
      const result = await setupWithLyrics()
      act(() => result.current.handleInput(makeInputEvent("X")))
      expect(result.current.charStates[0]).toBe("wrong")
    })

    it("현재 줄 길이 초과 입력 무시", async () => {
      const result = await setupWithLyrics()
      const overLength = "C".repeat(mockLyrics[0].length + 5)
      act(() => result.current.handleInput(makeInputEvent(overLength)))
      expect(result.current.input).toBe("")
    })

    it("Enter 키로 다음 줄 이동", async () => {
      const result = await setupWithLyrics()
      act(() =>
        result.current.handleKeyDown({
          key: "Enter",
          preventDefault: vi.fn()
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      )
      expect(result.current.lineIndex).toBe(1)
      expect(result.current.input).toBe("")
    })

    it("마지막 줄에서 Enter 시 finished true", async () => {
      const result = await setupWithLyrics()
      // 첫 줄 → 둘째 줄
      act(() =>
        result.current.handleKeyDown({
          key: "Enter",
          preventDefault: vi.fn()
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      )
      // 마지막 줄에서 Enter
      act(() =>
        result.current.handleKeyDown({
          key: "Enter",
          preventDefault: vi.fn()
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      )
      expect(result.current.finished).toBe(true)
    })

    it("SET_ACTIVE_KEY: keydown 이벤트에서 activeKey 업데이트", async () => {
      const result = await setupWithLyrics()
      act(() =>
        result.current.handleKeyDown({
          key: "a",
          preventDefault: vi.fn()
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      )
      expect(result.current.activeKey).toBe("a")
    })
  })
})
