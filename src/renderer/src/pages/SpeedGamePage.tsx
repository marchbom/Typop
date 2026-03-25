import { useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router"
import { useSpeedTypingGame } from "../hooks/useSpeedTypingGame"
import { useAuth } from "../context/AuthContext"
import { insertSpeedScore } from "../lib/supabase"
import { SpeedText } from "../types"

interface LocationState {
  texts: SpeedText[]
  duration: number
}

export default function SpeedGamePage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const { user } = useAuth()
  const savedRef = useRef(false)

  useEffect(() => {
    if (!state) navigate("/speed")
  }, [state, navigate])

  const texts = state?.texts ?? []
  const duration = state?.duration ?? 60

  const {
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
    currentText,
    startGame,
    handleInput,
    handleKeyDown
  } = useSpeedTypingGame(texts, duration)

  useEffect(() => {
    if (phase === "finished" && !savedRef.current && user) {
      savedRef.current = true
      const avatar = user.user_metadata?.avatar_url ?? null
      const name = user.user_metadata?.full_name ?? user.email ?? "익명"
      insertSpeedScore(user.id, name, avatar, 0, tpm, accuracy, duration, completed).catch(
        () => {}
      )
    }
  }, [phase, user, tpm, accuracy, duration, completed])

  if (!state) return <></>

  const handleRestart = (): void => {
    savedRef.current = false
    startGame()
  }

  return (
    <div className="speed-game-page">
      <button className="game-exit-btn" onClick={() => navigate("/speed")}>
        ← 뒤로
      </button>

      {phase === "ready" && (
        <div className="page-screen">
          <p className="game-desc">{duration}초 동안 최대한 많은 문장을 완성하세요</p>
          <p className="game-desc-sub">정확히 입력 후 Enter로 제출</p>
          <button className="game-btn" onClick={startGame}>
            시작
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="speed-game-body">
          <div className="speed-hud">
            <div className="hud-item">
              <span className="hud-label">남은시간</span>
              <span className={`speed-timer${timeLeft <= 30 ? " speed-timer--danger" : ""}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="hud-item">
              <span className="hud-label">완료</span>
              <span className="hud-val">{completed}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">콤보</span>
              <span className="speed-combo">{combo}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">타/분</span>
              <span className="hud-val">{tpm}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">정확도</span>
              <span className="hud-val">{accuracy}%</span>
            </div>
          </div>

          <div className="speed-effect-msg">{effectMsg}</div>

          <div className="speed-game-text">
            {(currentText?.text ?? "").split("").map((ch, i) => {
              const s = i < charStates.length ? charStates[i] : "pending"
              const isCursor = i === input.length
              return (
                <span key={i} className={`char-${s}${isCursor ? " char-cursor" : ""}`}>
                  {ch}
                </span>
              )
            })}
          </div>

          <p className="speed-game-meaning">{currentText?.meaning ?? "\u00A0"}</p>

          <input
            ref={inputRef}
            className="speed-game-input"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="정확히 입력 후 Enter"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
      )}

      {phase === "finished" && (
        <div className="speed-result">
          <p className="speed-result-title">시간 종료!</p>
          <div className="go-stats">
            <div className="go-stat">
              <span className="go-val">{completed}</span>
              <span className="go-label">완료 문장</span>
            </div>
            <div className="go-stat">
              <span className="go-val">{tpm}</span>
              <span className="go-label">타수/분</span>
            </div>
            <div className="go-stat">
              <span className="go-val">{accuracy}%</span>
              <span className="go-label">정확도</span>
            </div>
            <div className="go-stat">
              <span className="go-val">{maxCombo}</span>
              <span className="go-label">최대 콤보</span>
            </div>
          </div>
          {!user && <p className="speed-game-meaning">로그인하면 점수가 랭킹에 저장됩니다</p>}
          <div className="exit-confirm-btns">
            <button className="game-btn" onClick={handleRestart}>
              다시하기
            </button>
            <button className="back-btn" onClick={() => navigate("/speed/ranking")}>
              랭킹 보기
            </button>
            <button className="back-btn" onClick={() => navigate("/")}>
              홈으로
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
