import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSearch } from "../renderer/src/hooks/useSearch"
import { SongResult } from "../renderer/src/types"

const mockSongs: SongResult[] = [
  { id: 1, title: "Dynamite", artist: "BTS", thumbnail: "", url: "" },
  { id: 2, title: "Celebrity", artist: "IU", thumbnail: "", url: "" }
]

describe("useSearch", () => {
  beforeEach(() => {
    vi.mocked(window.api.lyrics.search).mockReset()
  })

  it("초기 상태", () => {
    const { result } = renderHook(() => useSearch())
    expect(result.current.query).toBe("")
    expect(result.current.results).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe("")
  })

  it("setQuery로 query 업데이트", () => {
    const { result } = renderHook(() => useSearch())
    act(() => result.current.setQuery("BTS"))
    expect(result.current.query).toBe("BTS")
  })

  it("검색 성공 시 results 업데이트", async () => {
    vi.mocked(window.api.lyrics.search).mockResolvedValue(mockSongs)
    const { result } = renderHook(() => useSearch())

    act(() => result.current.setQuery("BTS"))
    await act(async () => {
      await result.current.handleSearch({ preventDefault: vi.fn() } as unknown as React.SubmitEvent)
    })

    expect(result.current.results).toEqual(mockSongs)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe("")
  })

  it("검색 실패 시 error 설정", async () => {
    vi.mocked(window.api.lyrics.search).mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useSearch())

    act(() => result.current.setQuery("BTS"))
    await act(async () => {
      await result.current.handleSearch({ preventDefault: vi.fn() } as unknown as React.SubmitEvent)
    })

    expect(result.current.error).toBe("검색 실패")
    expect(result.current.results).toEqual([])
  })

  it("빈 query로 검색 시 API 호출 안함", async () => {
    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.handleSearch({ preventDefault: vi.fn() } as unknown as React.SubmitEvent)
    })

    expect(window.api.lyrics.search).not.toHaveBeenCalled()
  })

  it("검색 중 loading 상태 true", async () => {
    let resolveFn!: (v: SongResult[]) => void
    vi.mocked(window.api.lyrics.search).mockReturnValue(
      new Promise((r) => {
        resolveFn = r
      })
    )
    const { result } = renderHook(() => useSearch())
    act(() => result.current.setQuery("IU"))

    // 검색 시작 (await 없이)
    act(() => {
      result.current.handleSearch({ preventDefault: vi.fn() } as unknown as React.SubmitEvent)
    })
    expect(result.current.loading).toBe(true)

    // 검색 완료
    await act(async () => {
      resolveFn(mockSongs)
    })
    expect(result.current.loading).toBe(false)
  })
})
