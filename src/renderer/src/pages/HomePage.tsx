import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function HomePage(): React.JSX.Element {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle, signOut } = useAuth()

  return (
    <div className="home-page home-hub">
      <div className="home-header">
        {loading ? null : user ? (
          <div className="user-info">
            <img
              className="user-avatar"
              src={user.user_metadata?.avatar_url}
              referrerPolicy="no-referrer"
              alt=""
            />
            <span className="user-name">{user.user_metadata?.full_name ?? user.email}</span>
            <button className="auth-btn" onClick={signOut}>
              로그아웃
            </button>
          </div>
        ) : (
          <button className="auth-btn auth-btn-login" onClick={signInWithGoogle}>
            Google로 로그인
          </button>
        )}
      </div>

      <h1 className="app-title">Typop</h1>
      <p className="app-subtitle">연습 모드를 선택하세요</p>
      <div className="hub-buttons">
        <button className="hub-btn" onClick={() => navigate("/typing")}>
          <span className="hub-btn-title">가사 타이핑</span>
          <span className="hub-btn-desc">노래 가사를 따라 타이핑</span>
        </button>
        <button className="hub-btn" onClick={() => navigate("/game")}>
          <span className="hub-btn-title">산성비</span>
          <span className="hub-btn-desc">떨어지는 가수 이름을 없애라</span>
        </button>
        <button className="hub-btn" onClick={() => navigate("/ranking")}>
          <span className="hub-btn-title">랭킹</span>
          <span className="hub-btn-desc">전체 유저 점수 순위</span>
        </button>
      </div>
    </div>
  )
}
