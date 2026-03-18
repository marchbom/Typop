import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import HomePage from "./pages/HomePage"
import TypingPage from "./pages/TypingPage"
import GamePage from "./pages/GamePage"
import RankingPage from "./pages/RankingPage"

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/typing" element={<TypingPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/ranking" element={<RankingPage />} />
      </Routes>
    </AuthProvider>
  )
}
