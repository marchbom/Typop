import { useNavigate } from "react-router-dom"

interface GameIdleScreenProps {
  user: boolean
  onStart: () => void
}

export default function GameIdleScreen({ user, onStart }: GameIdleScreenProps): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="page-screen">
      <button className="game-exit-btn" onClick={() => navigate("/")}>
        ← 뒤로
      </button>
      <h1 className="game-title">Typop Game</h1>
      <p className="game-desc">쏟아지는 가수이름. 떨어지기 전에 받아쳐요</p>
      <p className="game-desc-sub">영어로 된 아티스트에는 숨겨진 효과가 있어요 👀</p>
      {!user && (
        <p className="game-desc-sub" style={{ color: "#f4845f" }}>
          로그인을 하면 나와 친구의 랭킹을 볼 수 있어요.
        </p>
      )}
      <button className="game-btn" onClick={onStart}>
        시작
      </button>
    </div>
  )
}
