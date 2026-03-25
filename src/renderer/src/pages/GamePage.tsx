import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGameLoop } from "../hooks/useGameLoop"
import { useAuth } from "../context/AuthContext"
import { insertScore } from "../lib/supabase"
import GameIdleScreen from "../components/GameIdleScreen"
import GameOverScreen from "../components/GameOverScreen"

export default function GamePage(): React.JSX.Element {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const handleGameOver = useCallback(
    async (score: number, round: number, totalTime: number) => {
      if (!user) return
      await insertScore(
        user.id,
        user.user_metadata?.full_name ?? user.email ?? "익명",
        user.user_metadata?.avatar_url ?? null,
        score,
        round,
        totalTime
      )
    },
    [user]
  )

  const {
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
  } = useGameLoop({ onGameOver: handleGameOver })

  if (phase === "idle") {
    return <GameIdleScreen user={!!user} onStart={startGame} />
  }

  if (phase === "gameover") {
    return <GameOverScreen score={score} round={round} user={!!user} onRestart={startGame} />
  }

  return (
    <div className="game-container" ref={containerRef}>
      <button className="game-exit-btn" onClick={() => setShowExitConfirm(true)}>
        ← 나가기
      </button>

      {showExitConfirm && (
        <div className="exit-confirm-overlay">
          <div className="exit-confirm-box">
            <p className="exit-confirm-title">게임을 종료하시겠습니까?</p>
            <div className="exit-confirm-btns">
              <button
                className="game-btn"
                onClick={() => {
                  setShowExitConfirm(false)
                  navigate("/")
                }}
              >
                저장하지 않고 나가기
              </button>
              <button className="back-btn" onClick={() => setShowExitConfirm(false)}>
                계속하기
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "roundbreak" && (
        <div className="round-break-overlay">
          <p className="round-break-label">{round}라운드</p>
          <p className="round-break-countdown">{timeLeft}</p>
        </div>
      )}
      {effectMsg && <div className="effect-msg">{effectMsg}</div>}

      <div className="game-hud">
        <div className="hud-item">
          <span className="hud-label">ROUND</span>
          <span className="hud-val">{round}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">ROUND TIME</span>
          <span className="hud-val">{timeLeft}s</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">TOTAL TIME</span>
          <span className="hud-val">{totalTime}s</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">SCORE</span>
          <span className="hud-val">{score}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">LIVES</span>
          <span className="hud-val hud-lives">
            {"♥".repeat(lives)}
            {"♡".repeat(3 - lives)}
          </span>
        </div>
      </div>

      {words.map((word) => {
        const isTargeted = targeted?.id === word.id
        const typedLen = isTargeted ? input.length : 0
        const isDanger = word.y > window.innerHeight * 0.65
        const isEnglish = /^[A-Za-z\s]+$/.test(word.text)

        return (
          <div
            key={word.id}
            className={`falling-word ${isTargeted ? "fw-targeted" : ""} ${isDanger ? "fw-danger" : ""} ${isEnglish ? "fw-korean" : ""}`}
            style={{ left: `${word.x}%`, top: `${word.y}px` }}
          >
            {isTargeted ? (
              <>
                <span className="fw-typed">{word.text.slice(0, typedLen)}</span>
                <span>{word.text.slice(typedLen)}</span>
              </>
            ) : (
              word.text
            )}
          </div>
        )
      })}

      <div className="game-input-wrap">
        <input
          ref={inputRef}
          className="game-input"
          value={input}
          onChange={handleInput}
          placeholder="입력하세요"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
    </div>
  )
}
