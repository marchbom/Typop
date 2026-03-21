import { CharState } from "../types"

interface CurrentLineProps {
  currentLine: string
  charStates: CharState[]
  input: string
}

export default function CurrentLine({
  currentLine,
  charStates,
  input
}: CurrentLineProps): React.JSX.Element {
  return (
    <div className="current-line-wrap">
      <div className="current-line">
        {currentLine.split("").map((ch, i) => {
          const state = charStates[i]
          return (
            <span
              key={i}
              className={
                state === "correct"
                  ? "char-correct"
                  : state === "wrong"
                    ? "char-wrong"
                    : i === input.length
                      ? "char-cursor"
                      : "char-pending"
              }
            >
              {ch}
            </span>
          )
        })}
        {input.length > currentLine.length && (
          <span className="char-wrong">
            {input
              .slice(currentLine.length)
              .split("")
              .map((ch, i) => (
                <span key={i}>{ch}</span>
              ))}
          </span>
        )}
      </div>
    </div>
  )
}
