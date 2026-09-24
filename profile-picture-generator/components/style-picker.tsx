import type { Style } from "../lib/styles";

export function StylePicker({
  styles,
  selected,
  previewUrl,
  onSelect,
  compact = false,
}: {
  styles: readonly Style[];
  selected: string;
  previewUrl: string | null;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`style-grid ${compact ? "is-compact" : ""}`} role="radiogroup" aria-label="Choose a portrait style">
      {styles.map((style) => (
        <button
          className={`style-card ${selected === style.id ? "is-selected" : ""}`}
          type="button"
          role="radio"
          aria-checked={selected === style.id}
          key={style.id}
          onClick={() => onSelect(style.id)}
        >
          <span className={`style-art art-${style.treatment}`} style={{ "--tone-a": style.colors[0], "--tone-b": style.colors[1] } as React.CSSProperties}>
            {previewUrl ? <img src={previewUrl} alt="" /> : <PortraitGlyph />}
            <i className="art-glow" />
          </span>
          <span className="style-card-copy"><strong>{style.name}</strong><small>{style.note}</small></span>
          <span className="style-check" aria-hidden="true">✓</span>
        </button>
      ))}
    </div>
  );
}

function PortraitGlyph() {
  return (
    <svg className="portrait-glyph" viewBox="0 0 120 132" aria-hidden="true">
      <path d="M21 132c2-27 15-43 39-43s37 16 39 43" fill="var(--shirt, #ece7df)" />
      <path d="M37 46c0-22 9-34 24-34s24 12 24 34v15c0 18-11 31-24 31S37 79 37 61z" fill="var(--skin, #c98d68)" />
      <path d="M35 49C31 19 43 5 63 7c20 2 28 18 22 43-4-14-13-23-28-24-4 11-12 18-22 23z" fill="var(--hair, #312a28)" />
      <path d="M49 58h2m18 0h2" stroke="var(--ink, #332b29)" strokeWidth="3" strokeLinecap="round" />
      <path d="M53 72c4 4 10 4 14 0" fill="none" stroke="var(--ink, #332b29)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
