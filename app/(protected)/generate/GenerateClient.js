//app/(protected)/generate/GenerateClient.js
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  grammarGeneratorSchema,
  readingGeneratorSchema,
  socialStudiesGeneratorSchema,
  staarReadingGenerateRequestSchema
} from "@/libs/zodSchemas";
import toast from "react-hot-toast";
import leoProfanity from "leo-profanity";
import {
  GRADE_LEVELS,
  CONCEPTS,
  TOPIC_SUGGESTIONS,
} from "@/libs/constants/worksheetOptions";
//import DOMPurify from "isomorphic-dompurify";

// ✅ Use client-safe DOMPurify
import DOMPurify from "dompurify"; // This works client-side

// Load the dictionary once
leoProfanity.loadDictionary();

function sanitizeInput(text) {
  if (!text) return "";
  let clean = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  clean = leoProfanity.clean(clean);
  return clean.trim();
}

const generatorSchemas = {
  reading: readingGeneratorSchema,
  grammar: grammarGeneratorSchema,
  socialStudies: socialStudiesGeneratorSchema,
  staarReading: staarReadingGenerateRequestSchema
};

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GenerateClient({ user }) {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [concept, setConcept] = useState("");
  const [count, setCount] = useState(1);
  const [type, setType] = useState("grammar");
  const [genre, setGenre] = useState("nonfiction");
  const [toastMessage, setToastMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [fileName, setFileName] = useState(null);
  const [cooldown, setCooldown] = useState(false); // 👈 prevents spamming
  const [selectedConcept, setSelectedConcept] = useState("");
  const [customConcept, setCustomConcept] = useState("");
  const [gradeLevel, setGradeLevel] = useState("4");
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

const concepts = CONCEPTS[type] || [];
const topicSuggestions = TOPIC_SUGGESTIONS[type] || [];
//const showConceptField = !["socialStudies", "staarReading"].includes(type);
//const showConceptField = type === "grammar" || type === "reading"; 
const showConceptField = type !== "socialStudies" && type !== "staarReading";

const isStaar = type === "staarReading";

  const showCustomConcept = selectedConcept === "Custom...";

  // What gets sent to API
  const getFinalConcept = () => {
    if (showCustomConcept) return customConcept;
    return selectedConcept;
  };

  const isShortPractice = type === "grammar" || type === "socialStudies";

  function normalizeQuestions(questions, mcCount = 4, oeCount = 1) {
    const mc = questions
      .filter((q) => q.type === "multiple-choice")
      .slice(0, mcCount);
    const oe = questions.find((q) => q.type === "open-ended");
    return oe ? [...mc, oe] : mc;
  }

  function normalizeWorksheet(worksheet) {
    const isGrammar = type === "grammar";

    return {
      ...worksheet,

      // Guided Practice → 4 MC + 1 OE
      guided_practice: {
        ...worksheet.guided_practice,
        questions: normalizeQuestions(
          worksheet.guided_practice?.questions || [],
          4,
          1
        ),
      },

      // Independent Practice → 10 MC + 1 OE
      independent_practice: {
        ...worksheet.independent_practice,
        questions: normalizeQuestions(
          worksheet.independent_practice?.questions || [],
          isShortPractice ? 4 : 9,
          1
        ),
      },

      ...(isGrammar &&
        worksheet.independent_practice_2 && {
          independent_practice_2: {
            ...worksheet.independent_practice_2,
            questions: normalizeQuestions(
              worksheet.independent_practice_2?.questions,
              4,
              1
            ), // 4 MC + 1 OE
          },
        }),
    };
  }

  const controllerRef = useRef(null);

  const handleGenerate = async () => {
    if (!user) {
      alert("Please sign in to generate worksheets.");
      return;
    }
    // Prevent spamming: if currently in cooldown, ignore
    if (cooldown) {
      toast.info("Please wait a moment before generating again.");
      return;
    }

    // Apply cooldown for 3 seconds after each click
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);

    // Cancel any previous request before starting a new one
    if (controllerRef.current) controllerRef.current.abort();

    // Create a fresh controller for this run
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    // ✅ Build the input using the helper function
    const finalConcept = showConceptField ? getFinalConcept() : "";

    console.log("Sending to API:", {
      topic,
      concept: finalConcept,
      gradeLevel,
      count,
      type,
      genre
    });
    //   const input = {
    //   topic,
    //   gradeLevel,
    //   count: isStaar ? 1 : (count || 1),
    //   ...(showConceptField ? { concept: finalConcept } : {}),
    //   type,
    // };


    // ✅ pick correct schema
const schema = generatorSchemas[type];

// ✅ sanitize first (you already do this)
const cleanTopic = sanitizeInput(topic);
const cleanConcept = sanitizeInput(finalConcept);

// ✅ build the exact object that matches each schema
const input =
  type === "staarReading"
    ? {
        topic: cleanTopic.slice(0, 200),
        gradeLevel,
        count: 1,
        type: "staarReading",
        genre,
      }
    : {
        topic: cleanTopic.slice(0, 200),
        concept: cleanConcept.slice(0, 200),
        gradeLevel,
        count: count || 1,
      };

// ✅ validate
if (schema) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    console.error("❌ Zod validation failed:", parsed.error.format());
    toast.error("Please check your inputs for this subject.");
    setLoading(false);
    return;
  }
}


    // const cleanTopic = sanitizeInput(topic);
    // const cleanConcept = sanitizeInput(finalConcept);

    //setResult(null);
    try {
      const res = await fetch("/api/generate-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      body: JSON.stringify(
      type === "staarReading" ? input : { ...input, type } // keep type for server routing
      ),
        signal: controller.signal,
      });

      if (res.status === 401) {
        // signOut({ callbackUrl: "/" });
        router.push("/");
      }

      if (!res.ok) {
        // Try to parse error response as JSON to get server error message
        let errorMessage = "Failed to generate worksheet";
        try {
          const errorData = await res.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // parsing failed, keep generic error message
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const key = data.json[0].key;
      //const worksheetJson = data.json[0];
      let worksheetJson = data.worksheets?.[0];
      if (key) {
        setFileName(key);
      }
      // ✅ Normalize the question structure
      if (type !== "staarReading") {
        worksheetJson = normalizeWorksheet(worksheetJson, type);
      }
      //setResult(worksheetJson);

      // Save temp data to sessionStorage
      sessionStorage.setItem("worksheetDraft", JSON.stringify(worksheetJson));
      sessionStorage.setItem("worksheetFileName", key); // <== NEW LINE
      sessionStorage.setItem("pdfType", type); // <== NEW LINE
      console.log("Navigating to:", `/Worksheet-Editor/${key}`);
      const editorPath =
        type === "staarReading" ? `/Staar-Editor/${key}` : `/Worksheet-Editor/${key}`;

      router.push(`${editorPath}?canDownload=${data.canDownload}`);

      //router.push(`/Worksheet-Editor/${key}?canDownload=${data.canDownload}`);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Generation request aborted by user.");
        return;
      }
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      setLoading(false);
      const errorMessage = err.message || "Failed to generate worksheet.";
      setTimeout(() => {
        if (errorMessage.includes("monthly generation limit")) {
          toast.error(
            "🚫 You’ve reached your monthly generation limit. Upgrade your plan to continue."
          );
          // setToastMessage(
          //   "🚫 You’ve reached your monthly generation limit. Upgrade your plan to continue."
          // );
        } else if (newRetryCount >= 3) {
          toast.error("Too many failed attempts. Please try again later.");
          //setToastMessage("Too many failed attempts. Please try again later.");
        } else {
          toast.error(errorMessage);
          //setToastMessage(errorMessage);
        }
        router.push("/dashboard");
      }, 4000);
      setTimeout(() => {
        if (newRetryCount >= 3) {
          toast.error("Too many failed attempts. Please try again later.");
          // setToastMessage("Too many failed attempts. Please try again later.");
        } else {
          toast.error(
            err.message ||
              "Failed to generate worksheet content. Please try again or refine your search."
          );
          // setToastMessage(
          //   err.message || "Failed to generate worksheet. Please try again."
          // );
        }
        router.push("/dashboard");
      }, 4000);

      // Optional: auto-clear toast after 4 seconds
      //setTimeout(() => setToastMessage(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (type === "staarReading") {
    // Force 3–5
    if (!["3", "4", "5"].includes(String(gradeLevel))) {
      setGradeLevel("4");
    }
    setCount(1); // STAAR is always 1 set (8 MC + 1 SCR)
  }
}, [type]);


  // Cleanup if user navigates away (abort ongoing fetch)
  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);
  const isValid =
    topic.trim() &&
    (!showConceptField ||
      (selectedConcept && (!showCustomConcept || customConcept.trim())));

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
        Worksheet Generator
      </h1>

      <p className="text-sm text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md p-3 mb-6 text-center">
        ⚠️ Download your worksheet immediately after generation - it won't be
        saved!
      </p>

      <div className="bg-white shadow-md rounded-lg p-6 space-y-5">
        {/* Subject Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setTopic("");
              setSelectedConcept("");
              setCustomConcept("");
            }}
            className="w-full p-3 text-gray-700 rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="grammar">Grammar</option>
            <option value="reading">Reading Comprehension</option>
            <option value="socialStudies">Social Studies</option>
            <option value="staarReading">STAAR Reading</option>
          </select>
        </div>
        {type === "staarReading" && (
  <div className="mt-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Genre
    </label>

    <select
      value={genre}
      onChange={(e) => setGenre(e.target.value)}
      className="w-full border border-gray-300 rounded-md p-2 text-sm"
    >
      <option value="nonfiction">Nonfiction</option>
      <option value="fiction">Fiction</option>
      {/* Later you can add: */}
      {/* <option value="drama">Drama</option> */}
    </select>
  </div>
)}


        {/* Topic (Content/Theme) - Suggestions First */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic / Content Theme
          </label>

          {/* Topic Suggestions - Always visible */}
          <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">💡 Quick select:</p>
            <div className="flex flex-wrap gap-2">
              {topicSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setTopic(suggestion)}
                  className={`px-3 py-1.5 text-xs rounded-full transition ${
                    topic === suggestion
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white border border-gray-300 hover:bg-purple-50 hover:border-purple-300"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Topic Input */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Or enter your own:
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                type === "grammar"
                  ? "e.g., The Solar System, Butterflies, Recycling"
                  : type === "reading"
                    ? "e.g., Famous Inventors, Natural Disasters, Sports"
                    : type === "staarReading"
                    ? "e.g., Animal Adaptations, Space Ecploration, Texas Landmarks"
                    : "e.g., Ancient Greece, World War I"
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Concept (Skill) - Only for Grammar/Reading */}
        {showConceptField && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === "grammar" ? "Grammar Skill" : "Reading Skill"}
              </label>
              <select
                value={selectedConcept}
                onChange={(e) => {
                  setSelectedConcept(e.target.value);
                  if (e.target.value !== "Custom...") {
                    setCustomConcept("");
                  }
                }}
                className="w-full p-3 text-gray-700 rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">-- Select skill --</option>
                {concepts.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Concept Input */}
            {showCustomConcept && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your custom skill
                </label>
                <input
                  type="text"
                  value={customConcept}
                  onChange={(e) => setCustomConcept(e.target.value)}
                  placeholder={`e.g., ${type === "grammar" ? "Commas in Complex Sentences" : "Point of View"}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            )}
          </>
        )}

        {/* Grade Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade Level
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="w-full p-3 text-gray-700 rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            {GRADE_LEVELS.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
        </div>

        {/* Example Preview */}
        {/* {topic && selectedConcept && selectedConcept !== "Custom..." && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
            <p className="text-xs text-purple-700 font-medium mb-1">
              📝 You'll get:
            </p>
            <p className="text-sm text-gray-700">
              {type === "grammar"
                ? `A grammar worksheet about "${topic}" focusing on ${selectedConcept}`
                : type === "reading"
                  ? `A reading comprehension worksheet about "${topic}" focusing on ${selectedConcept}`
                  : `A social studies worksheet about "${topic}"`}
            </p>
          </div>
        )} */}
        {topic &&  (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
             <p className="text-xs text-purple-700 font-medium mb-1">
              📝 You'll get:
            </p>
            <p className="text-sm text-gray-700">
              {type === "staarReading"
                ? `A STAAR-style reading passage + 8 questions + 1 SCR about "${topic}"`
                : type === "grammar"
                ? `A grammar worksheet about "${topic}" focusing on ${selectedConcept}`
                : type === "reading"
                ? `A reading comprehension worksheet about "${topic}" focusing on ${selectedConcept}`
                : `A social studies worksheet about "${topic}"`}
            </p>
          </div>
        )}


        {/* Generate Button */}
        {/* Generate/Cancel Buttons */}
        <div className="flex justify-end gap-3 items-center mt-4">
          {!loading && (
            <button
              onClick={handleGenerate}
              disabled={retryCount >= 3 || cooldown || !isValid}
              className={`bg-purple-600 text-white px-6 py-2 rounded transition flex items-center gap-2 ${
                retryCount >= 3 || cooldown || !isValid
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-purple-700"
              }`}
            >
              {cooldown ? "Please wait..." : "Generate Worksheet"}
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-3">
              <button
                disabled
                className="bg-purple-600 text-white px-6 py-2 rounded flex items-center gap-2 opacity-80 cursor-wait"
              >
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Generating...
              </button>
              <button
                onClick={() => {
                  controllerRef.current?.abort();
                  setLoading(false);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 text-center">
          💡 Tip: Choose a topic your students are studying, then select the
          skill to practice
        </p>
      </div>
    </main>
  );
}

// useEffect(() => {
//   supabase.auth.getSession().then(({ data }) => {
//     if (!data.session) {
//       router.replace("/signin");
//       // supabase.auth.signInWithOAuth({ provider: "google" });
//     } else {
//       setSession(data.session);
//     }
//     setCheckingSession(false); // ✅ done checking
//   });
//   const { data: listener } = supabase.auth.onAuthStateChange(
//     (event, session) => {
//       if (event === "SIGNED_OUT" || !session) {
//         router.replace("/signin");
//       }
//     }
//   );

//   return () => listener?.subscription.unsubscribe();
// }, [router]);

{
  /* <div>
          <label className="block  text-sm font-medium text-gray-700 mb-1">
            How many worksheets?
          </label>
          <input
            type="number"
            className="w-full text-gray-700 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div> */
}

// useEffect(() => {
//   const nav = performance.getEntriesByType("navigation")[0];
//   if (nav?.type === "back_forward") {
//     router.replace("/generate"); // triggers server check
//   }
// }, []);
// useEffect(() => {
//   let mounted = true;

//   const checkSession = async () => {
//     const { data } = await supabase.auth.getSession();

//     if (!data?.session) {
//       router.replace("/signin");
//       return;
//     }

//     if (mounted) setSession(data.session);
//   };

//   checkSession();

//   const { data: listener } = supabase.auth.onAuthStateChange(
//     (event, session) => {
//       if (event === "SIGNED_OUT" || !session) {
//         router.replace("/signin");
//       }
//     }
//   );

//   return () => {
//     mounted = false;
//     listener?.subscription.unsubscribe();
//   };
// }, [router]);
