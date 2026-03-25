import { useNavigate } from "react-router"

interface GameOverScreenProps {
  score: number
  round: number
  user: boolean
  onRestart: () => void
}

export default function GameOverScreen({
  score,
  round,
  user,
  onRestart
}: GameOverScreenProps): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="page-screen">
      <p className="go-title">GAME OVER</p>
      {user && <p className="game-desc-sub">내 점수가 등록되었어요</p>}
      <div className="go-stats">
        <div className="go-stat">
          <span className="go-val">{score}</span>
          <span className="go-label">SCORE</span>
        </div>
        <div className="go-stat">
          <span className="go-val">{round}</span>
          <span className="go-label">ROUND</span>
        </div>
      </div>
      <div className="exit-confirm-btns">
        <button className="game-btn" onClick={onRestart}>
          다시하기
        </button>
        <button className="back-btn" onClick={() => navigate("/")}>
          홈으로
        </button>
      </div>
    </div>
  )
}
