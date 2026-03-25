import { useState, useRef, useCallback, useEffect } from "react"
import { CharState, SpeedText } from "../types"

export type SpeedGamePhase = "ready" | "playing" | "finished"

export interface SpeedTypingGameState {
  phase: SpeedGamePhase
  timeLeft: number
  input: string
  charStates: CharState[]
  completed: number
  combo: number
  maxCombo: number
  tpm: number
  accuracy: number
  effectMsg: string
  inputRef: React.RefObject<HTMLInputElement | null>
  currentText: SpeedText | null
  startGame: () => void
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

// 중성(vowel) 타수: 복합 모음은 2타
const JUNG_STROKES = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 1, 2, 1]
// 종성(final consonant) 타수: 0=없음, 복합 자음은 2타
const JONG_STROKES = [0, 1, 1, 2, 1, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1]

function getCharStrokes(ch: string): number {
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const offset = code - 0xac00
    const jong = offset % 28
    const jung = Math.floor(offset / 28) % 21
    return 1 + JUNG_STROKES[jung] + JONG_STROKES[jong]
  }
  return 1
}

function getTotalStrokes(text: string): number {
  return [...text].reduce((acc, ch) => acc + getCharStrokes(ch), 0)
}

export function useSpeedTypingGame(texts: SpeedText[], duration: number): SpeedTypingGameState {
  const [phase, setPhase] = useState<SpeedGamePhase>("ready")
  const [timeLeft, setTimeLeft] = useState(duration)
  const [input, setInput] = useState("")
  const [charStates, setCharStates] = useState<CharState[]>([])
  const [completed, setCompleted] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [tpm, setTpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [effectMsg, setEffectMsg] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputValueRef = useRef("")
  const shuffledTextsRef = useRef<SpeedText[]>([])
  const timeLeftRef = useRef(duration)
  const currentIndexRef = useRef(0)
  const correctStrokesRef = useRef(0)
  const correctCharsRef = useRef(0)
  const totalCharsRef = useRef(0)
  const completedRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const phaseRef = useRef<SpeedGamePhase>("ready")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const effectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showEffect = useCallback((msg: string) => {
    setEffectMsg(msg)
    if (effectTimerRef.current) clearTimeout(effectTimerRef.current)
    effectTimerRef.current = setTimeout(() => setEffectMsg(""), 1200)
  }, [])

  const updateStats = useCallback(() => {
    const elapsed = (duration - timeLeftRef.current) / 60
    const t = elapsed > 0 ? Math.round(correctStrokesRef.current / elapsed) : 0
    const a =
      totalCharsRef.current > 0
        ? Math.round((correctCharsRef.current / totalCharsRef.current) * 100)
        : 100
    setTpm(t)
    setAccuracy(a)
  }, [duration])

  const startGame = useCallback(() => {
    shuffledTextsRef.current = [...texts].sort(() => Math.random() - 0.5)
    phaseRef.current = "playing"
    setPhase("playing")
    timeLeftRef.current = duration
    setTimeLeft(duration)
    inputValueRef.current = ""
    setInput("")
    setCharStates([])
    setCompleted(0)
    setCombo(0)
    setMaxCombo(0)
    setTpm(0)
    setAccuracy(100)
    setEffectMsg("")
    correctStrokesRef.current = 0
    correctCharsRef.current = 0
    totalCharsRef.current = 0
    completedRef.current = 0
    comboRef.current = 0
    maxComboRef.current = 0
    currentIndexRef.current = 0
    setCurrentIndex(0)

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      timeLeftRef.current -= 1
      setTimeLeft(timeLeftRef.current)

      if (timeLeftRef.current <= 0) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        phaseRef.current = "finished"
        setPhase("finished")
        setMaxCombo(maxComboRef.current)
        const elapsed = duration / 60
        const t = elapsed > 0 ? Math.round(correctStrokesRef.current / elapsed) : 0
        const a =
          totalCharsRef.current > 0
            ? Math.round((correctCharsRef.current / totalCharsRef.current) * 100)
            : 100
        setTpm(t)
        setAccuracy(a)
      }
    }, 1000)

    setTimeout(() => inputRef.current?.focus(), 50)
  }, [duration])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (phaseRef.current !== "playing") return
      const val = e.target.value
      const text = shuffledTextsRef.current[currentIndexRef.current % shuffledTextsRef.current.length]?.text ?? ""
      if (val.length > text.length) return

      inputValueRef.current = val

      const newCharStates: CharState[] = val.split("").map((ch, i) => {
        if (i >= text.length) return "wrong"
        return ch === text[i] ? "correct" : "wrong"
      })

      setInput(val)
      setCharStates(newCharStates)
    },
    [texts]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return
      if (e.nativeEvent.isComposing) return
      if (phaseRef.current !== "playing") return

      const text = shuffledTextsRef.current[currentIndexRef.current % shuffledTextsRef.current.length]?.text ?? ""
      const val = inputValueRef.current

      const charStatesNow: CharState[] = val.split("").map((ch, i) => {
        if (i >= text.length) return "wrong"
        return ch === text[i] ? "correct" : "wrong"
      })

      const allCorrect = val.length === text.length && charStatesNow.every((s) => s === "correct")

      totalCharsRef.current += val.length

      if (allCorrect) {
        correctStrokesRef.current += getTotalStrokes(text)
        correctCharsRef.current += text.length
        completedRef.current += 1
        comboRef.current += 1
        if (comboRef.current > maxComboRef.current) {
          maxComboRef.current = comboRef.current
        }
        setCompleted(completedRef.current)
        setCombo(comboRef.current)

        if (comboRef.current >= 3) {
          showEffect(`🔥 ${comboRef.current} 콤보!`)
        } else {
          showEffect("✓ 정답!")
        }
      } else {
        const correctCount = charStatesNow.filter((s) => s === "correct").length
        correctCharsRef.current += correctCount
        comboRef.current = 0
        setCombo(0)
        showEffect("→ 스킵")
      }

      const nextIndex = (currentIndexRef.current + 1) % shuffledTextsRef.current.length
      currentIndexRef.current = nextIndex
      setCurrentIndex(nextIndex)
      inputValueRef.current = ""
      setInput("")
      setCharStates([])
      updateStats()
    },
    [texts, showEffect, updateStats]
  )

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (effectTimerRef.current) clearTimeout(effectTimerRef.current)
    }
  }, [])

  return {
    phase,
    timeLeft,
    input,
    charStates,
    completed,
    combo,
    maxCombo,
    tpm,
    accuracy,
    effectMsg,
    inputRef,
    currentText:
      shuffledTextsRef.current.length > 0
        ? shuffledTextsRef.current[currentIndex % shuffledTextsRef.current.length]
        : null,
    startGame,
    handleInput,
    handleKeyDown
  }
}
