const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"]
]

interface KeyboardProps {
  activeKey: string
}

export default function Keyboard({ activeKey }: KeyboardProps) {
  const active = activeKey.toUpperCase()

  return (
    <div className="keyboard">
      {ROWS.map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map((key) => (
            <div key={key} className={`key ${active === key ? "key-active" : ""}`}>
              {key}
            </div>
          ))}
          {i === 2 && (
            <div className={`key key-wide ${activeKey === "Backspace" ? "key-active" : ""}`}>
              ⌫
            </div>
          )}
        </div>
      ))}
      <div className="keyboard-row">
        <div className={`key key-space ${activeKey === " " ? "key-active" : ""}`} />
      </div>
    </div>
  )
}
