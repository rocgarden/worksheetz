//app/generate/page.js
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  grammarGeneratorSchema,
  readingGeneratorSchema,
  socialStudiesGeneratorSchema,
} from "@/libs/zodSchemas";
import toast from "react-hot-toast";
import { Laila } from "next/font/google";
const generatorSchemas = {
  reading: readingGeneratorSchema,
  grammar: grammarGeneratorSchema,
  socialStudies: socialStudiesGeneratorSchema,
};

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GeneratePage() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [concept, setConcept] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("grammar");
  const [toastMessage, setToastMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [fileName, setFileName] = useState(null);
  const [session, setSession] = useState(null);
  const [cooldown, setCooldown] = useState(false); // 👈 prevents spamming

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        supabase.auth.signInWithOAuth({ provider: "google" });
      } else {
        setSession(data.session);
      }
    });
  }, []);

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
    if (!session) {
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
    console.log("Sending to API:", { topic, concept, gradeLevel, count, type });
    const input = {
      topic,
      concept,
      gradeLevel,
      count: count || 1, // use default if not set
    };

    const schema = generatorSchemas[type]; // pick correct schema
    if (schema) {
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        console.error("❌ Zod validation failed:", parsed.error.format());
        toast.error("Please check your inputs for this subject.");
        setLoading(false);
        return;
      }
    }

    //setResult(null);
    try {
      const res = await fetch("/api/generate-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          concept: concept || "",
          gradeLevel: gradeLevel,
          count: count,
          type: type,
        }),
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
      worksheetJson = normalizeWorksheet(worksheetJson, type);
      //setResult(worksheetJson);

      // Save temp data to sessionStorage
      sessionStorage.setItem("worksheetDraft", JSON.stringify(worksheetJson));
      sessionStorage.setItem("worksheetFileName", key); // <== NEW LINE
      sessionStorage.setItem("pdfType", type); // <== NEW LINE
      console.log("Navigating to:", `/Worksheet-Editor/${key}`);

      router.push(`/Worksheet-Editor/${key}?canDownload=${data.canDownload}`);
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
  // Cleanup if user navigates away (abort ongoing fetch)
  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  return (
    <main className="max-w-xl mx-auto px-4 py-38">
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50 whitespace-pre-line">
          {" "}
          {toastMessage}
        </div>
      )}
      <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
        Worksheet Generator
      </h1>
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <div>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 text-gray-700 rounded bg-white/10 border border-black/20"
          >
            <option value="grammar">Grammar</option>
            <option value="reading">Reading</option>
            <option value="socialStudies">Social Studies</option>
          </select>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic
          </label>
          <input
            type="text"
            className="w-full text-gray-700 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. Grammar"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        {type !== "socialStudies" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concept
            </label>
            <input
              type="text"
              className="w-full text-gray-700 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Nouns, Verbs"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade Level
          </label>
          <input
            type="number"
            className="w-full text-gray-700  px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          />
        </div>

        {/* <div>
          <label className="block  text-sm font-medium text-gray-700 mb-1">
            How many worksheets?
          </label>
          <input
            type="number"
            className="w-full text-gray-700 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div> */}

        <div className="flex justify-end gap-3 items-center mt-4">
          {!loading && (
            <button
              onClick={handleGenerate}
              disabled={retryCount >= 3 || cooldown}
              className={`bg-purple-600 text-white px-6 py-2 rounded transition flex items-center gap-2 ${
                retryCount >= 3 || cooldown
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
      </div>
    </main>
  );
}
