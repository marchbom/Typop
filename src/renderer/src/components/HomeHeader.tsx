import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import GoogleIcon from "./GoogleIcon"

export default function HomeHeader(): React.JSX.Element {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle, signOut } = useAuth()

  return (
    <div className="home-header">
      <button className="auth-btn auth-btn-login" onClick={() => navigate("/ranking")}>
        🏆 랭킹 확인
      </button>
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
          <GoogleIcon />
          Google 로그인
        </button>
      )}
    </div>
  )
}
