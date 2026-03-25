import { Routes, Route } from "react-router"
import { AuthProvider } from "./context/AuthContext"
import HomePage from "./pages/HomePage"
import TypingPage from "./pages/TypingPage"
import GamePage from "./pages/GamePage"
import RankingPage from "./pages/RankingPage"
import SpeedSelectPage from "./pages/SpeedSelectPage"
import SpeedGamePage from "./pages/SpeedGamePage"
import SpeedRankingPage from "./pages/SpeedRankingPage"

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/typing" element={<TypingPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/speed" element={<SpeedSelectPage />} />
        <Route path="/speed/game" element={<SpeedGamePage />} />
        <Route path="/speed/ranking" element={<SpeedRankingPage />} />
      </Routes>
    </AuthProvider>
  )
}
