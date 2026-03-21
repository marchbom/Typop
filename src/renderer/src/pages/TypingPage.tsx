import { useState, useEffect, useRef, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { SongResult, TypingStats } from "../types"
import Keyboard from "../components/Keyboard"

interface LocationState {
  song: SongResult
}

type CharState = "pending" | "correct" | "wrong"

function SearchView({ onSelect }: { onSelect: (song: SongResult) => void }): React.JSX.Element {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SongResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.SubmitEvent): Promise<void> => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError("")
    try {
      const hits = await window.api.lyrics.search(query)
      setResults(hits)
    } catch {
      setError("검색 실패")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-screen">
      <button className="game-exit-btn" onClick={() => navigate("/")}>
        ← 뒤로
      </button>
      <h1 className="game-title">Lyrics Typing</h1>
      <p className="game-desc">어떤 노래로 연습할까요?</p>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="text"
          placeholder="노래 제목 또는 가수 이름을 입력하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="search-btn" type="submit" disabled={loading}>
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>
      {error && <p className="error-msg">{error}</p>}
      <ul className="results-list">
        {results.map((song) => (
          <li key={song.id} className="result-item" onClick={() => onSelect(song)}>
            <img
              className="result-thumbnail"
              src={song.thumbnail}
              alt={song.title}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
            <div className="result-info">
              <span className="result-title">{song.title}</span>
              <span className="result-artist">{song.artist}</span>
            </div>
            <span className="result-arrow">▶</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function TypingPage(): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const { song: initialSong } = (location.state as LocationState) || {}

  const [selectedSong, setSelectedSong] = useState<SongResult | null>(initialSong ?? null)
  const [lyrics, setLyrics] = useState<string[]>([])
  const [lineIndex, setLineIndex] = useState(0)
  const [input, setInput] = useState("")
  const [charStates, setCharStates] = useState<CharState[]>([])
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    totalChars: 0
  })
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [startTime, setStartTime] = useState<number | null>(null)
  const [activeKey, setActiveKey] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)
  const totalCorrectRef = useRef(0)
  const totalTypedRef = useRef(0)

  const song = selectedSong

  useEffect(() => {
    if (!song) return
    setLoading(true)
    setError("")
    setLyrics([])
    setLineIndex(0)
    setInput("")
    setCharStates([])
    setFinished(false)
    totalCorrectRef.current = 0
    totalTypedRef.current = 0
    window.api.lyrics
      .getLyrics(song.artist, song.title)
      .then((lines) => {
        if (lines.length === 0) {
          setError("가사를 불러올 수 없습니다.")
        } else {
          setLyrics(lines)
        }
      })
      .catch(() => setError("가사 로딩 실패"))
      .finally(() => setLoading(false))
  }, [song])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading, lineIndex])

  const currentLine = lyrics[lineIndex] ?? ""

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value

      if (!startTime && val.length > 0) setStartTime(Date.now())

      // 현재 줄 대비 각 글자 상태 계산
      const states: CharState[] = val.split("").map((ch, i) => {
        if (i >= currentLine.length) return "wrong"
        return ch === currentLine[i] ? "correct" : "wrong"
      })
      setCharStates(states)
      setInput(val)

      // 실시간 WPM / 정확도
      if (startTime) {
        const elapsed = (Date.now() - startTime) / 1000 / 60
        const correct = states.filter((s) => s === "correct").length
        const wpm = elapsed > 0 ? Math.round(correct / 5 / elapsed) : 0
        const accuracy = val.length > 0 ? Math.round((correct / val.length) * 100) : 100
        setStats((prev) => ({ ...prev, wpm, accuracy }))
      }
    },
    [currentLine, startTime]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      setActiveKey(e.key)
      if (e.key !== "Enter") return

      const correct = charStates.filter((s) => s === "correct").length
      totalCorrectRef.current += correct
      totalTypedRef.current += input.length

      const next = lineIndex + 1
      if (next >= lyrics.length) {
        const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 1
        const totalWpm = Math.round(totalCorrectRef.current / 5 / elapsed)
        const totalAcc =
          totalTypedRef.current > 0
            ? Math.round((totalCorrectRef.current / totalTypedRef.current) * 100)
            : 100
        setStats({
          wpm: totalWpm,
          accuracy: totalAcc,
          correctChars: totalCorrectRef.current,
          totalChars: totalTypedRef.current
        })
        setFinished(true)
      } else {
        setLineIndex(next)
        setInput("")
        setCharStates([])
      }
    },
    [charStates, input, lineIndex, lyrics.length, startTime]
  )

  if (!song) return <SearchView onSelect={setSelectedSong} />

  if (loading) {
    return (
      <div className="page-screen">
        <p className="loading-msg">가사 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-screen">
        <p className="error-msg">{error}</p>
        <button className="game-exit-btn" onClick={() => navigate("/")}>
          ← 홈으로
        </button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="page-screen">
        <div className="result-card">
          <h2>완료! 🎉</h2>
          <p className="song-meta">
            {song.title} — {song.artist}
          </p>
          <div className="stat-grid">
            <div className="stat-box">
              <span className="stat-value">{stats.wpm}</span>
              <span className="stat-label">WPM</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{stats.accuracy}%</span>
              <span className="stat-label">정확도</span>
            </div>
          </div>
          <button className="game-exit-btn" onClick={() => navigate("/")}>
            ← 홈으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="typing-page">
      <button className="game-exit-btn" onClick={() => navigate("/")}>
        ← 뒤로
      </button>
      {/* 상단 정보 */}
      <header className="typing-header">
        <div className="song-meta">
          <strong>{song.title}</strong> — {song.artist}
        </div>
        <div className="live-stats">
          <span>{stats.wpm} WPM</span>
          <span>{stats.accuracy}% 정확도</span>
        </div>
      </header>

      {/* 진행률 */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(lineIndex / lyrics.length) * 100}%` }} />
      </div>

      {/* 이전 줄 미리보기 */}
      {lineIndex > 0 && <p className="prev-line">{lyrics[lineIndex - 1]}</p>}

      {/* 현재 줄 */}
      <div className="current-line-wrap">
        <div className="current-line">
          {currentLine.split("").map((ch, i) => {
            const state = charStates[i]
            return (
              <span
                key={i}
                className={
                  state === "correct"
                    ? "char-correct"
                    : state === "wrong"
                      ? "char-wrong"
                      : i === input.length
                        ? "char-cursor"
                        : "char-pending"
                }
              >
                {ch}
              </span>
            )
          })}
          {/* 커서가 줄 끝을 넘은 경우 */}
          {input.length > currentLine.length && (
            <span className="char-wrong">
              {input
                .slice(currentLine.length)
                .split("")
                .map((ch, i) => (
                  <span key={i}>{ch}</span>
                ))}
            </span>
          )}
        </div>
      </div>

      {/* 다음 줄 미리보기 */}
      {lineIndex + 1 < lyrics.length && <p className="next-line">{lyrics[lineIndex + 1]}</p>}

      {/* 입력창 */}
      <input
        ref={inputRef}
        className="typing-input"
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={() => setActiveKey("")}
        placeholder="여기에 입력하세요 (Enter로 다음 줄)"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
      />

      <p className="line-counter">
        {lineIndex + 1} / {lyrics.length}
      </p>

      <Keyboard activeKey={activeKey} />
    </div>
  )
}
