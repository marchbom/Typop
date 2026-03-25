import { useState, useEffect, useRef, useCallback } from "react"
import { ARTISTS } from "../game/artists"
import { ROUND_DURATION, getRoundConfig, Phase, FallingWord } from "../game/gameConfig"

const ENGLISH_REGEX = /^[A-Za-z\s]+$/

export interface GameState {
  phase: Phase
  words: FallingWord[]
  input: string
  score: number
  lives: number
  round: number
  totalTime: number
  timeLeft: number
  effectMsg: string
  targeted: FallingWord | undefined
  containerRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  startGame: () => void
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export interface GameLoopOptions {
  onGameOver?: (score: number, round: number, totalTime: number) => void
}

export function useGameLoop({ onGameOver }: GameLoopOptions = {}): GameState {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const rafRef = useRef(0)

  // mutable game state in refs (no re-render needed)
  const wordsRef = useRef<FallingWord[]>([])
  const livesRef = useRef(3)
  const roundRef = useRef(1)
  const scoreRef = useRef(0)
  const spawnTimerRef = useRef(0)
  const roundTimerRef = useRef(0)
  const totalTimeRef = useRef(0)
  const lastTsRef = useRef(0)
  const nextIdRef = useRef(0)
  const phaseRef = useRef<Phase>("idle")
  const wordsFrozenRef = useRef(false)
  // 셔플 덱: 모든 아티스트를 한 번씩 소진한 뒤 다시 섞어서 균등하게 등장
  const deckRef = useRef<string[]>([])
  // 최신 onGameOver 참조 유지 (loop 클로저 캡처 문제 방지)
  const onGameOverRef = useRef(onGameOver)
  onGameOverRef.current = onGameOver

  // render state
  const [phase, setPhase] = useState<Phase>("idle")
  const [words, setWords] = useState<FallingWord[]>([])
  const [input, setInput] = useState("")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [round, setRound] = useState(1)
  const [totalTime, setTotalTime] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION)
  const [effectMsg, setEffectMsg] = useState("")

  const spawnWord = (): void => {
    const onScreen = new Set(wordsRef.current.map((w) => w.text))

    // 덱이 비면 전체 아티스트를 셔플해서 다시 채움
    if (deckRef.current.length === 0) {
      deckRef.current = [...ARTISTS].sort(() => Math.random() - 0.5)
    }
    // 화면에 이미 있는 단어는 건너뜀
    const idx = deckRef.current.findIndex((a) => !onScreen.has(a))
    const text = idx !== -1 ? deckRef.current.splice(idx, 1)[0] : deckRef.current.pop()!
    const { speed } = getRoundConfig(roundRef.current)

    // x 위치 겹침 방지: y가 가까운 단어(위쪽 30% 이내)와 최소 25% 이상 거리를 확보.
    // 최대 10번 재시도하고, 그래도 겹치면 마지막 값 그대로 사용.
    const MIN_DIST = 25
    const height = containerRef.current?.clientHeight ?? 600
    let x = 8 + Math.random() * 74
    for (let attempt = 0; attempt < 10; attempt++) {
      const overlaps = wordsRef.current.some(
        (w) => w.y < height * 0.3 && Math.abs(w.x - x) < MIN_DIST
      )
      if (!overlaps) break
      x = 8 + Math.random() * 74
    }

    wordsRef.current.push({
      id: nextIdRef.current++,
      text,
      x,
      y: -40,
      speed: speed * (0.8 + Math.random() * 0.4)
    })
  }

  const loop = useCallback((ts: number) => {
    if (phaseRef.current !== "playing") return

    const dt = lastTsRef.current ? (ts - lastTsRef.current) / 1000 : 0
    lastTsRef.current = ts

    const height = containerRef.current?.clientHeight ?? 600
    let lostLife = false

    wordsRef.current = wordsRef.current
      .map((w) => ({ ...w, y: wordsFrozenRef.current ? w.y : w.y + w.speed * dt }))
      .filter((w) => {
        if (w.y > height - 80) {
          livesRef.current--
          lostLife = true
          return false
        }
        return true
      })

    if (livesRef.current <= 0) {
      phaseRef.current = "gameover"
      setScore(scoreRef.current)
      setPhase("gameover")
      onGameOverRef.current?.(scoreRef.current, roundRef.current, Math.floor(totalTimeRef.current))
      return
    }

    spawnTimerRef.current += dt
    const { spawnInterval, maxWords } = getRoundConfig(roundRef.current)
    if (spawnTimerRef.current >= spawnInterval && wordsRef.current.length < maxWords) {
      spawnTimerRef.current = 0
      spawnWord()
    }

    roundTimerRef.current += dt
    totalTimeRef.current += dt

    if (roundTimerRef.current >= ROUND_DURATION) {
      roundTimerRef.current = 0
      roundRef.current++
      phaseRef.current = "roundbreak"
      setRound(roundRef.current)
      setWords([...wordsRef.current])
      setPhase("roundbreak")
      let countdown = 3
      setTimeLeft(countdown)
      const tick = setInterval(() => {
        countdown--
        setTimeLeft(countdown)
        if (countdown <= 0) {
          clearInterval(tick)
          phaseRef.current = "playing"
          lastTsRef.current = 0
          setPhase("playing")
          rafRef.current = requestAnimationFrame(loop)
        }
      }, 1000)
      return
    }

    setWords([...wordsRef.current])
    setTimeLeft(Math.ceil(Math.max(0, ROUND_DURATION - roundTimerRef.current)))
    setTotalTime(Math.floor(totalTimeRef.current))
    if (lostLife) setLives(livesRef.current)

    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const triggerSpecialEffect = (): void => {
    const isFreeze = Math.random() < 0.5
    if (isFreeze) {
      wordsFrozenRef.current = true
      setEffectMsg("❄️ 일시정지!")
      setTimeout(() => {
        wordsFrozenRef.current = false
        setEffectMsg("")
      }, 5000)
    } else {
      roundTimerRef.current = Math.max(0, roundTimerRef.current - 5)
      setEffectMsg("⏱ +5초!")
      setTimeout(() => setEffectMsg(""), 2000)
    }
  }

  const startGame = (): void => {
    wordsRef.current = []
    livesRef.current = 3
    roundRef.current = 1
    scoreRef.current = 0
    spawnTimerRef.current = Infinity // 게임 시작 시 첫 단어 즉시 스폰
    deckRef.current = []
    roundTimerRef.current = 0
    totalTimeRef.current = 0
    lastTsRef.current = 0
    nextIdRef.current = 0
    phaseRef.current = "playing"
    wordsFrozenRef.current = false

    setWords([])
    setLives(3)
    setRound(1)
    setScore(0)
    setTimeLeft(ROUND_DURATION)
    setTotalTime(0)
    setInput("")
    setEffectMsg("")
    setPhase("playing")

    rafRef.current = requestAnimationFrame(loop)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value
    setInput(val)

    const matched = wordsRef.current.find((w) => w.text.toLowerCase() === val.toLowerCase())
    if (matched) {
      wordsRef.current = wordsRef.current.filter((w) => w.id !== matched.id)
      scoreRef.current++
      setScore(scoreRef.current)
      setInput("")
      if (ENGLISH_REGEX.test(matched.text)) {
        triggerSpecialEffect()
      }
    }
  }

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const targeted =
    input.length > 0
      ? [...words]
          .filter((w) => w.text.toLowerCase().startsWith(input.toLowerCase()))
          .sort((a, b) => b.y - a.y)[0]
      : undefined

  return {
    phase,
    words,
    input,
    score,
    lives,
    round,
    totalTime,
    timeLeft,
    effectMsg,
    targeted,
    containerRef,
    inputRef,
    startGame,
    handleInput
  }
}
