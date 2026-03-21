import { useNavigate } from "react-router-dom"
import { SongResult } from "../types"
import { useSearch } from "../hooks/useSearch"

interface SearchViewProps {
  onSelect: (song: SongResult) => void
}

export default function SearchView({ onSelect }: SearchViewProps): React.JSX.Element {
  const navigate = useNavigate()
  const { query, results, loading, error, setQuery, handleSearch } = useSearch()

  return (
    <div className="page-screen">
      <button className="game-exit-btn" onClick={() => navigate("/")}>
        ← 뒤로
      </button>
      <h1 className="game-title">Lyrics Typing</h1>
      <p className="game-desc">어떤 노래로 연습할까요?</p>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="text"
          placeholder="노래 제목 또는 가수 이름을 입력하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="search-btn" type="submit" disabled={loading}>
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>
      {error && <p className="error-msg">{error}</p>}
      <ul className="results-list">
        {results.map((song) => (
          <li key={song.id} className="result-item" onClick={() => onSelect(song)}>
            <img
              className="result-thumbnail"
              src={song.thumbnail}
              alt={song.title}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
            <div className="result-info">
              <span className="result-title">{song.title}</span>
              <span className="result-artist">{song.artist}</span>
            </div>
            <span className="result-arrow">▶</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
