import React from "react";

export default function IntroActivityEditor({ introActivity, onChange }) {
  if (!introActivity || !introActivity.type) return null;

  const handleChange = (key, value) => {
    onChange(key, value);
  };

  const handleListChange = (key, index, value) => {
    const updated = [...(introActivity[key] || [])];
    updated[index] = value;
    handleChange(key, updated);
  };

  const handleNestedListChange = (key, index, field, value) => {
    const updated = [...(introActivity[key] || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleChange(key, updated);
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-3">
        🧠 Practice Activity 1
      </h3>

      {/* Instructions */}
      <label className="block font-medium text-gray-700 mb-1">
        Instructions
      </label>
      <textarea
        rows={2}
        className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-4"
        value={introActivity.instructions || ""}
        onChange={(e) => handleChange("instructions", e.target.value)}
      />

      {/* Type-specific fields */}
      {introActivity.type === "fill-in-the-blank" && (
        <>
          <label className="block font-medium text-gray-700 mb-1">
            Word Bank (comma-separated)
          </label>
          <input
            type="text"
            className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-4"
            value={introActivity.word_bank?.join(", ") || ""}
            onChange={(e) =>
              handleChange(
                "word_bank",
                e.target.value.split(",").map((word) => word.trim())
              )
            }
          />

          <label className="block font-medium text-gray-700 mb-1">
            Sentences
          </label>
          {(introActivity.sentences || []).map((sentence, i) => (
            <input
              key={i}
              type="text"
              className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-2"
              value={sentence}
              onChange={(e) => handleListChange("sentences", i, e.target.value)}
            />
          ))}
        </>
      )}

      {introActivity.type === "cloze-paragraph" && (
        <>
          <label className="block font-medium text-gray-700 mb-1">
            Paragraph
          </label>
          <textarea
            rows={5}
            className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-4"
            value={introActivity.paragraph || ""}
            onChange={(e) => handleChange("paragraph", e.target.value)}
          />
        </>
      )}

      {introActivity.type === "vocabulary_matching" && (
        <>
          <label className="block font-medium text-gray-700 mb-2">
            Vocabulary Terms & Definitions
          </label>
          {(introActivity.terms || []).map((pair, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                type="text"
                placeholder="Term"
                className="w-1/3 border border-gray-700 text-gray-700 rounded p-2"
                value={pair.term}
                onChange={(e) =>
                  handleNestedListChange(
                    "vocabulary_matching",
                    i,
                    "term",
                    e.target.value
                  )
                }
              />
              <input
                type="text"
                placeholder="Definition"
                className="w-2/3 border border-gray-700 text-gray-700 rounded p-2"
                value={pair.definition}
                onChange={(e) =>
                  handleNestedListChange(
                    "vocabulary_matching",
                    i,
                    "definition",
                    e.target.value
                  )
                }
              />
            </div>
          ))}
        </>
      )}

      {introActivity.type === "timeline_ordering" && (
        <>
          <label className="block font-medium text-gray-700 mb-1">
            Timeline Events
          </label>
          {(introActivity.events || []).map((event, i) => (
            <input
              key={i}
              type="text"
              className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-2"
              value={event}
              onChange={(e) =>
                handleListChange("timeline_ordering", i, e.target.value)
              }
            />
          ))}
        </>
      )}

      {introActivity.type === "question" && (
        <>
          <label className="block font-medium text-gray-700 mb-1">
            Reflection Question
          </label>
          <input
            type="text"
            className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-4"
            value={introActivity.question || ""}
            onChange={(e) => handleChange("question", e.target.value)}
          />
        </>
      )}
    </div>
  );
}
