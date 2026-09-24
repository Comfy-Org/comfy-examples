import { useState } from "react";

export type Picture = { id: string; name: string; type: string; url: string; index: number };

export function BundleGrid({
  pictures,
  onMakeAnother,
}: {
  pictures: Picture[];
  onMakeAnother: () => void;
}) {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [focused, setFocused] = useState<Picture | null>(null);

  function toggleFavorite(id: string) {
    setFavorites((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="results-heading">
        <div><p className="eyebrow">YOUR NEW LINEUP</p><h2>Pick your favorite.</h2></div>
        <span className="result-count">{pictures.length} portraits</span>
      </div>
      <div className="portrait-grid">
        {pictures.map((picture, index) => (
          <article className="portrait-card" key={picture.id}>
            <button className="portrait-open" onClick={() => setFocused(picture)} type="button" aria-label={`View portrait ${index + 1} larger`}>
              <img src={picture.url} alt={`Generated profile picture ${index + 1}`} />
              <span className="zoom-mark">↗</span>
            </button>
            <div className="portrait-tools">
              <button type="button" className={favorites.has(picture.id) ? "favorite is-favorite" : "favorite"} onClick={() => toggleFavorite(picture.id)} aria-label={favorites.has(picture.id) ? "Remove from favorites" : "Add to favorites"}>
                {favorites.has(picture.id) ? "♥" : "♡"}
              </button>
              <span>TAKE {String(index + 1).padStart(2, "0")}</span>
              <a href={picture.url} download={`forma-profile-${index + 1}.png`} aria-label={`Download portrait ${index + 1}`}>↓</a>
            </div>
            <button className="another-link" type="button" onClick={onMakeAnother}>Make another like this <span>↗</span></button>
          </article>
        ))}
      </div>
      {focused && (
        <div className="lightbox" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFocused(null); }}>
          <div className="lightbox-card" role="dialog" aria-modal="true" aria-label="Profile picture preview">
            <button className="lightbox-close" type="button" onClick={() => setFocused(null)} aria-label="Close preview">×</button>
            <img src={focused.url} alt="Large generated profile picture" />
            <a href={focused.url} download="forma-profile-picture.png">Download this portrait <span>↓</span></a>
          </div>
        </div>
      )}
    </>
  );
}
