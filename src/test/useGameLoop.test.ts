import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useGameLoop } from "../renderer/src/hooks/useGameLoop"

// RAF mock
const rafCallbacks: Map<number, FrameRequestCallback> = new Map()
let rafId = 0

beforeEach(() => {
  rafCallbacks.clear()
  rafId = 0

  globalThis.requestAnimationFrame = vi.fn((cb) => {
    const id = ++rafId
    rafCallbacks.set(id, cb)
    return id
  })
  globalThis.cancelAnimationFrame = vi.fn((id) => {
    rafCallbacks.delete(id)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function tickRaf(timestamp = 16): void {
  const callbacks = [...rafCallbacks.values()]
  rafCallbacks.clear()
  callbacks.forEach((cb) => cb(timestamp))
}

describe("useGameLoop", () => {
  it("초기 phase는 idle", () => {
    const { result } = renderHook(() => useGameLoop())
    expect(result.current.phase).toBe("idle")
  })

  it("초기 상태값 확인", () => {
    const { result } = renderHook(() => useGameLoop())
    expect(result.current.score).toBe(0)
    expect(result.current.lives).toBe(3)
    expect(result.current.round).toBe(1)
  })

  it("startGame 호출 시 phase가 playing으로 전환", () => {
    const { result } = renderHook(() => useGameLoop())
    act(() => result.current.startGame())
    expect(result.current.phase).toBe("playing")
  })

  it("startGame 시 score/lives/round 리셋", () => {
    const { result } = renderHook(() => useGameLoop())
    act(() => result.current.startGame())
    expect(result.current.score).toBe(0)
    expect(result.current.lives).toBe(3)
    expect(result.current.round).toBe(1)
  })

  it("startGame 시 첫 단어 즉시 스폰 (spawnTimerRef = Infinity)", () => {
    const { result } = renderHook(() => useGameLoop())
    act(() => result.current.startGame())
    // RAF 한 번 실행 → 스폰 타이머가 Infinity이므로 즉시 단어 등장
    act(() => tickRaf(100))
    expect(result.current.words.length).toBeGreaterThan(0)
  })

  it("RAF 루프에서 단어 y 위치 증가", () => {
    const { result } = renderHook(() => useGameLoop())
    act(() => result.current.startGame())

    act(() => tickRaf(100)) // 첫 단어 스폰
    const initialY = result.current.words[0]?.y ?? -40

    act(() => tickRaf(1100)) // 1초 경과 (dt=1)
    const newY = result.current.words[0]?.y ?? initialY
    expect(newY).toBeGreaterThan(initialY)
  })

  it("handleInput: 일치하는 단어 입력 시 score 증가", () => {
    const { result } = renderHook(() => useGameLoop())
    act(() => result.current.startGame())
    act(() => tickRaf(100)) // 단어 스폰

    const word = result.current.words[0]
    if (!word) return

    act(() => {
      result.current.handleInput({
        target: { value: word.text }
      } as React.ChangeEvent<HTMLInputElement>)
    })
    expect(result.current.score).toBe(1)
  })

  it("handleInput: 일치하는 단어 입력 시 단어 제거 (다음 RAF 프레임에서 반영)", () => {
    const { result } = renderHook(() => useGameLoop())
    act(() => result.current.startGame())
    act(() => tickRaf(100))

    const word = result.current.words[0]
    if (!word) return

    act(() => {
      result.current.handleInput({
        target: { value: word.text }
      } as React.ChangeEvent<HTMLInputElement>)
    })
    // words state는 다음 RAF 프레임(setWords 호출)에서 갱신됨
    act(() => tickRaf(116))
    expect(result.current.words.find((w) => w.id === word.id)).toBeUndefined()
  })

  it("handleInput: 대소문자 무관 매칭", () => {
    const { result } = renderHook(() => useGameLoop())
    act(() => result.current.startGame())
    act(() => tickRaf(100))

    const word = result.current.words[0]
    if (!word) return

    act(() => {
      result.current.handleInput({
        target: { value: word.text.toUpperCase() }
      } as React.ChangeEvent<HTMLInputElement>)
    })
    expect(result.current.score).toBe(1)
  })

  it("onGameOver 콜백은 게임 오버 시 호출됨", () => {
    const onGameOver = vi.fn()
    const { result } = renderHook(() => useGameLoop({ onGameOver }))
    act(() => result.current.startGame())

    // 화면 높이 기본값 600, y > 520이면 생명 차감
    // 충분한 시간(큰 dt)을 주어 단어가 화면 밖으로 떨어지게 함
    act(() => {
      let ts = 100
      // 여러 번 tick으로 lives가 0이 될 때까지 진행
      for (let i = 0; i < 30; i++) {
        ts += 3000 // dt=3초씩 → 속도*3 만큼 이동
        tickRaf(ts)
        if (result.current.phase === "gameover") break
      }
    })

    if (result.current.phase === "gameover") {
      expect(onGameOver).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      )
    }
  })

  it("unmount 시 RAF 취소", () => {
    const { result, unmount } = renderHook(() => useGameLoop())
    act(() => result.current.startGame())
    act(() => tickRaf(100))

    unmount()
    expect(cancelAnimationFrame).toHaveBeenCalled()
  })
})
