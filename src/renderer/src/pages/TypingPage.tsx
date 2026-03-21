import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { SongResult } from "../types"
import Keyboard from "../components/Keyboard"
import CurrentLine from "../components/CurrentLine"
import TypingResult from "../components/TypingResult"
import SearchView from "./SearchView"
import { useTyping } from "../hooks/useTyping"

interface LocationState {
  song: SongResult
}

export default function TypingPage(): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const { song: initialSong } = (location.state as LocationState) || {}

  const [selectedSong, setSelectedSong] = useState<SongResult | null>(initialSong ?? null)

  const {
    lyrics,
    lineIndex,
    input,
    charStates,
    stats,
    finished,
    loading,
    error,
    activeKey,
    currentLine,
    inputRef,
    handleInput,
    handleKeyDown,
    setActiveKey
  } = useTyping(selectedSong)

  if (!selectedSong) return <SearchView onSelect={setSelectedSong} />

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

  if (finished) return <TypingResult song={selectedSong} stats={stats} />

  return (
    <div className="typing-page">
      <button className="game-exit-btn" onClick={() => navigate("/")}>
        ← 뒤로
      </button>
      <header className="typing-header">
        <div className="song-meta">
          <strong>{selectedSong.title}</strong> — {selectedSong.artist}
        </div>
        <div className="live-stats">
          <span>{stats.wpm} WPM</span>
          <span>{stats.accuracy}% 정확도</span>
        </div>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(lineIndex / lyrics.length) * 100}%` }} />
      </div>

      {lineIndex > 0 && <p className="prev-line">{lyrics[lineIndex - 1]}</p>}

      <CurrentLine currentLine={currentLine} charStates={charStates} input={input} />

      {lineIndex + 1 < lyrics.length && <p className="next-line">{lyrics[lineIndex + 1]}</p>}

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
