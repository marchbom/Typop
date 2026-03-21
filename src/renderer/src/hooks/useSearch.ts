import { useState } from "react"
import { SongResult } from "../types"

interface UseSearchReturn {
  query: string
  results: SongResult[]
  loading: boolean
  error: string
  setQuery: (query: string) => void
  handleSearch: (e: React.SubmitEvent) => Promise<void>
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SongResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.SubmitEvent): Promise<void> => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError("")
    try {
      const hits = await window.api.lyrics.search(query)
      setResults(hits)
    } catch {
      setError("검색 실패")
    } finally {
      setLoading(false)
    }
  }

  return { query, results, loading, error, setQuery, handleSearch }
}
