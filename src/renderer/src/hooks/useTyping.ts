import { useReducer, useEffect, useRef, useCallback } from "react"
import { SongResult, TypingStats, CharState } from "../types"

interface TypingState {
  lyrics: string[]
  lineIndex: number
  input: string
  charStates: CharState[]
  stats: TypingStats
  finished: boolean
  loading: boolean
  error: string
  startTime: number | null
  activeKey: string
}

type TypingAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; lyrics: string[] }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "INPUT_CHANGE"; input: string; charStates: CharState[]; stats: TypingStats }
  | { type: "NEXT_LINE"; lineIndex: number }
  | { type: "FINISH"; stats: TypingStats }
  | { type: "SET_ACTIVE_KEY"; key: string }

const initialState: TypingState = {
  lyrics: [],
  lineIndex: 0,
  input: "",
  charStates: [],
  stats: { wpm: 0, accuracy: 100, correctChars: 0, totalChars: 0 },
  finished: false,
  loading: false,
  error: "",
  startTime: null,
  activeKey: ""
}

function reducer(state: TypingState, action: TypingAction): TypingState {
  switch (action.type) {
    case "LOAD_START":
      return { ...initialState, loading: true }
    case "LOAD_SUCCESS":
      return { ...state, loading: false, lyrics: action.lyrics }
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error }
    case "INPUT_CHANGE":
      return {
        ...state,
        input: action.input,
        charStates: action.charStates,
        stats: action.stats,
        startTime: state.startTime ?? (action.input.length > 0 ? Date.now() : null)
      }
    case "NEXT_LINE":
      return { ...state, lineIndex: action.lineIndex, input: "", charStates: [] }
    case "FINISH":
      return { ...state, finished: true, stats: action.stats }
    case "SET_ACTIVE_KEY":
      return { ...state, activeKey: action.key }
  }
}

interface UseTypingReturn {
  lyrics: string[]
  lineIndex: number
  input: string
  charStates: CharState[]
  stats: TypingStats
  finished: boolean
  loading: boolean
  error: string
  activeKey: string
  currentLine: string
  inputRef: React.RefObject<HTMLInputElement | null>
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  setActiveKey: (key: string) => void
}

export function useTyping(song: SongResult | null): UseTypingReturn {
  const [state, dispatch] = useReducer(reducer, initialState)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const totalCorrectRef = useRef(0)
  const totalTypedRef = useRef(0)

  useEffect(() => {
    if (!song) return
    let cancelled = false

    totalCorrectRef.current = 0
    totalTypedRef.current = 0
    dispatch({ type: "LOAD_START" })

    window.api.lyrics
      .getLyrics(song.artist, song.title)
      .then((lines) => {
        if (cancelled) return
        if (lines.length === 0) {
          dispatch({ type: "LOAD_ERROR", error: "가사를 불러올 수 없습니다." })
        } else {
          dispatch({ type: "LOAD_SUCCESS", lyrics: lines })
        }
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "LOAD_ERROR", error: "가사 로딩 실패" })
      })

    return () => {
      cancelled = true
    }
  }, [song])

  useEffect(() => {
    if (!state.loading) inputRef.current?.focus()
  }, [state.loading, state.lineIndex])

  const currentLine = state.lyrics[state.lineIndex] ?? ""

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (val.length > currentLine.length) return
      const charStates: CharState[] = val.split("").map((ch, i) => {
        if (i >= currentLine.length) return "wrong"
        return ch === currentLine[i] ? "correct" : "wrong"
      })

      const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 / 60 : 0
      const correct = charStates.filter((s) => s === "correct").length
      const wpm = elapsed > 0 ? Math.round(correct / 5 / elapsed) : 0
      const accuracy = val.length > 0 ? Math.round((correct / val.length) * 100) : 100

      dispatch({
        type: "INPUT_CHANGE",
        input: val,
        charStates,
        stats: { ...state.stats, wpm, accuracy }
      })
    },
    [currentLine, state.startTime, state.stats]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_ACTIVE_KEY", key: e.key })
      if (e.key !== "Enter") return

      const correct = state.charStates.filter((s) => s === "correct").length
      totalCorrectRef.current += correct
      totalTypedRef.current += state.input.length

      const next = state.lineIndex + 1
      if (next >= state.lyrics.length) {
        const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 / 60 : 1
        const totalWpm = Math.round(totalCorrectRef.current / 5 / elapsed)
        const totalAcc =
          totalTypedRef.current > 0
            ? Math.round((totalCorrectRef.current / totalTypedRef.current) * 100)
            : 100
        dispatch({
          type: "FINISH",
          stats: {
            wpm: totalWpm,
            accuracy: totalAcc,
            correctChars: totalCorrectRef.current,
            totalChars: totalTypedRef.current
          }
        })
      } else {
        dispatch({ type: "NEXT_LINE", lineIndex: next })
      }
    },
    [state.charStates, state.input, state.lineIndex, state.lyrics.length, state.startTime]
  )

  return {
    ...state,
    currentLine,
    inputRef,
    handleInput,
    handleKeyDown,
    setActiveKey: (key) => dispatch({ type: "SET_ACTIVE_KEY", key })
  }
}
