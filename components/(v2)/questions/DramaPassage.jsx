//components/(v2)/questions/DramaPassage.js
"use client";

// Shared line parser — used by DramaPassage (full read-only render)
// and by HotText (per-token render with clickable targets)
export function renderDramaLine(line, i, { selected = false, isTitle = false, clickable = false } = {}) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const color = selected ? "#1e1b4b" : undefined;

  if ( isTitle|| trimmed.startsWith("Title:")) return (
    <p key={i} style={{ textAlign: "center", fontWeight: "800", fontSize: "17px", color: color ?? "#1e1b4b", margin: "0 0 4px 0" }}>
      {trimmed.replace("Title:", "").trim()}
    </p>
  );

  if (trimmed.startsWith("Characters:") || trimmed.startsWith("Characters")) return (
    <p key={i} style={{ textAlign: "center", fontSize: "13px", color: color ?? "#6b7280", fontStyle: "italic", margin: "0 0 12px 0" }}>
      {trimmed}
    </p>
  );

  if (/^SCENE\s+\d+/i.test(trimmed)) return (
    <p key={i} style={{ textAlign: "center", fontSize: "12px", fontWeight: "800", color: color ?? "#4b5563", letterSpacing: "0.12em", textTransform: "uppercase", margin: "12px 0 8px 0" }}>
      {trimmed}
    </p>
  );
if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || /^\d+\s+\[/.test(trimmed)) return (
        <p key={i} style={{ fontStyle: "italic", color: color ?? "#374151", fontSize: "15px", margin: "4px 0 4px 16px" }}>
      {trimmed}
    </p>
  );

  const dialogueMatch = trimmed.match(/^(\d+\s+)?([A-Z]{2,}(?:\s[A-Z]+)*):\s*(.*)/);
  if (dialogueMatch) {
    const [,, character, rest] = dialogueMatch;
    const stageMatch = rest.match(/^(\[.*?\])\s*(.*)/);
    const stageDir = stageMatch ? stageMatch[1] : null;
    const dialogue = stageMatch ? stageMatch[2] : rest;
    const lineNumber = dialogueMatch[1]?.trim() || null;

    // clickable mode — keep character name inline with dialogue, one unit
   if (clickable) return (
  <p key={i} style={{
    margin: "2px 0",
    fontSize: "15px",
    color: color ?? "#374151",
    lineHeight: "1.6",
    fontFamily: "'Inter', 'Nunito', sans-serif",
    display: "flex",
    flexWrap: "wrap",
    gap: "4px"
  }}>
    {lineNumber && (
      <span style={{ fontWeight: "600", color: "#374151" }}>
        ({lineNumber})
      </span>
    )}

    <span style={{
      fontWeight: "600",
      color: color ?? "#4c1d95",
      fontFamily: "'Nunito', sans-serif"
    }}>
      {character}:
    </span>

    {stageDir && (
      <span style={{
        fontStyle: "italic",
        color: "#374151"
      }}>
        {stageDir}
      </span>
    )}

    <span style={{ color: "#374151" }}>
      {dialogue}
    </span>
  </p>
);

return (
  <p key={i} style={{
    margin: "2px 0",
    fontSize: "15px",
    color: color ?? "#374151",
    lineHeight: "1.6",
    fontFamily: "'Inter', 'Nunito', sans-serif",
    display: "flex",
    flexWrap: "wrap",
    gap: "4px"
  }}>
    <span style={{
      fontWeight: "600",
      color: color ?? "#4c1d95",
      fontFamily: "'Nunito', sans-serif"
    }}>
      {character}:
    </span>

    {stageDir && (
      <span style={{
        fontStyle: "italic",
        color: "#374151"
      }}>
        {stageDir}
      </span>
    )}

    <span style={{ color: "#374151" }}>
      {dialogue}
    </span>
  </p>
);

  }

  return <p key={i} style={{ fontSize: "15px", color: color ?? "#374151", margin: "4px 0" }}>{trimmed}</p>;
}

// Renders a drama/play passage with proper formatting:
// - Title styled as heading
// - Character list styled as cast section  
// - Scene headers bold + centered
// - Stage directions in italics, muted color
// - Dialogue with character name bold + line text normal

export default function DramaPassage({ passage }) {
  if (!passage) return null;

  const lines = passage.split("\n").filter((l) => l.trim() !== "");
  let firstNonEmpty = true;

  return (
    <div style={{
      background: "#faf5ff",
      borderRadius: "12px",
      padding: "18px 20px",
      marginBottom: "24px",
      maxHeight: "300px",
      overflowY: "auto",
      fontFamily: "'Georgia', serif",
      border: "1px solid #e9d5ff",
      borderLeft: "4px solid #7c3aed",
    }}>
      {lines.map((line, i) => {
        const isTitle = firstNonEmpty;
        firstNonEmpty = false;
        return renderDramaLine(line, i, { isTitle });
      })}
    </div>
  );
}