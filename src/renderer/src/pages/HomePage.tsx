import { useNavigate } from "react-router-dom"
import HomeHeader from "../components/HomeHeader"

export default function HomePage(): React.JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="home-page home-hub">
      <HomeHeader />

      <h1 className="app-title">Typop</h1>
      <p className="app-subtitle">타이핑으로 하는 게임 Typop ⌨️</p>
      <div className="hub-buttons">
        <button className="hub-btn" onClick={() => navigate("/game")}>
          <span className="hub-btn-title">아티스트 게임</span>
          <span className="hub-btn-desc">쏟아지는 아티스트 이름을 쳐내세요</span>
        </button>
        <button
          className="hub-btn"
          style={{ visibility: "hidden" }}
          onClick={() => navigate("/typing")}
        >
          <span className="hub-btn-title">타이핑 연습</span>
          <span className="hub-btn-desc">좋아하는 노래로 타자를 연습해요</span>
        </button>
      </div>
    </div>
  )
}
