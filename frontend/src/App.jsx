import { useState } from "react";

function getYouTubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.slice(1);
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      return parsedUrl.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
}

function App() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [copied, setCopied] = useState(false);

  // =========================
  // LOAD ANALYSIS HISTORY
  // =========================
  const loadHistory = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/analyses"
      );

      if (!response.ok) {
        throw new Error("Could not load history.");
      }

      const data = await response.json();

      setHistory(data);
      setShowHistory(true);
      setError("");
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // =========================
  // DELETE ANALYSIS
  // =========================
  const deleteAnalysis = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this analysis?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/analyses/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not delete analysis."
        );
      }

      setHistory((currentHistory) =>
        currentHistory.filter((item) => item._id !== id)
      );

      setError("");
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // =========================
  // ANALYZE VIDEO
  // =========================
  const handleAnalyze = async () => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

    if (!url.trim()) {
      setError("Please enter a YouTube URL.");
      return;
    }

    if (!youtubeRegex.test(url.trim())) {
      setError("Please enter a valid YouTube URL.");
      return;
    }

    const id = getYouTubeVideoId(url.trim());

    if (!id) {
      setError("Could not identify the YouTube video.");
      return;
    }

    setVideoId(id);
    setLoading(true);
    setError("");
    setAnalysis(null);
    setTranscript("");
    setShowHistory(false);

    try {
      const response = await fetch(
        "http://localhost:5000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong."
        );
      }

      setAnalysis(data.analysis);
      setTranscript(data.transcript);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // COPY ANALYSIS
  // =========================
  const copyAnalysis = async () => {
  if (!analysis) return;

  const text = `
${analysis.title}

SUMMARY
${analysis.summary}

MAIN TOPICS
• ${analysis.mainTopics.join("\n• ")}

IMPORTANT POINTS
• ${analysis.importantPoints.join("\n• ")}

KEY TAKEAWAYS
• ${analysis.keyTakeaways.join("\n• ")}

CONCLUSION
${analysis.conclusion}
`;

  try {
    await navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  } catch (error) {
    console.error("Could not copy analysis:", error);
  }
};

  // =========================
  // CLOSE ANALYSIS
  // =========================
  const closeAnalysis = () => {
    setAnalysis(null);
    setTranscript("");
    setVideoId("");
    setUrl("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =========================
          HEADER
      ========================= */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <h1 className="text-2xl font-bold">
            🎬 YouTube AI Analyzer
          </h1>

          <div className="flex items-center gap-3">

            <button
              onClick={loadHistory}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
            >
              📚 History
            </button>

            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
  ✨ AI Powered
</span>

          </div>
        </div>
      </header>

      {/* =========================
          MAIN
      ========================= */}
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* =========================
            HERO
        ========================= */}
        <div className="text-center">

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight sm:text-5xl lg:text-6xl">
            Understand any YouTube video

            <span className="block text-blue-500">
              with AI
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Paste a YouTube video link and let AI summarize the
            transcript, identify important topics, and extract
            the key takeaways.
          </p>

        </div>

        {/* =========================
            URL INPUT
        ========================= */}
        <div className="mx-auto mt-12 w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition duration-300 hover:border-slate-700">

          <label className="mb-3 block text-sm font-medium text-slate-300">
            YouTube Video URL
          </label>

          <div className="flex w-full flex-col gap-3 sm:flex-row">

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition duration-200 placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
            />

            <button
  onClick={handleAnalyze}
  disabled={loading}
  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
>
  {loading ? "Analyzing..." : "✨ Analyze"}
</button>

          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

        </div>

        {/* =========================
            LOADING
        ========================= */}
        {loading && (
  <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">

    {/* Spinner */}
    <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>

    <h3 className="mt-6 text-2xl font-bold text-white">
      Analyzing your video
    </h3>

    <p className="mt-2 text-slate-400">
      Please wait while AI processes the video.
    </p>

    {/* Processing steps */}
    <div className="mx-auto mt-8 max-w-md space-y-4 text-left">

      <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 p-3">
        <span className="text-green-400">
          ✓
        </span>

        <span className="text-slate-300">
          Fetching YouTube transcript
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 p-3">
        <span className="animate-pulse text-blue-400">
          🤖
        </span>

        <span className="text-slate-300">
          Analyzing with Gemini AI
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 p-3">
        <span className="text-slate-500">
          ⏳
        </span>

        <span className="text-slate-500">
          Preparing your results
        </span>
      </div>

    </div>

  </div>
)}

        {/* =========================
            HISTORY
        ========================= */}
        {showHistory && !loading && (
          <section className="mx-auto mt-10 w-full max-w-4xl px-4">

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                📚 Analysis History
              </h3>

              <button
                onClick={() => setShowHistory(false)}
                className="w-fit rounded-lg border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                Close
              </button>

            </div>

            {history.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                No analysis history yet.
              </div>

            ) : (

              <div className="space-y-4">

                {history.map((item) => (

                  <div
                    key={item._id}
                    className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-2xl"
                  >

                    <h4 className="min-w-0 wrap-break-word text-xl font-bold leading-tight text-white transition duration-200 hover:text-blue-400">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-sm text-slate-500">
                      📅 Analyzed on{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>

                    <p className="mt-4 min-w-0 wrap-break-word leading-7 text-slate-400">
                      {item.summary}
                    </p>

                    {/* BUTTONS */}
                    <div className="mt-6 flex flex-wrap gap-3">

                      {/* VIEW ANALYSIS */}
                      <button
                        onClick={() => {
                          setAnalysis({
                            title: item.title,
                            summary: item.summary,
                            mainTopics: item.mainTopics,
                            importantPoints: item.importantPoints,
                            keyTakeaways: item.keyTakeaways,
                            conclusion: item.conclusion,
                          });

                          setTranscript(item.transcript);
                          setVideoId(item.videoId);
                          setUrl(item.youtubeUrl);
                          setShowHistory(false);
                          setError("");
                        }}
                        className="rounded-lg bg-blue-600 px-5 py-2 font-semibold transition duration-200 hover:bg-blue-500"
                      >
                        View Analysis
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => deleteAnalysis(item._id)}
                        className="rounded-lg border border-red-500/40 px-5 py-2 font-semibold text-red-400 transition duration-200 hover:text-red-300"
                      >
                        🗑️ Delete
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>
        )}

        {/* =========================
            YOUTUBE VIDEO PREVIEW
        ========================= */}
        {videoId && !loading && (
          <section className="mt-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl transition duration-300 hover:border-slate-700">

            <div className="aspect-video w-full">

              <iframe
      className="w-full aspect-video"
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />

            </div>

          </section>
        )}

        {/* =========================
            AI ANALYSIS
        ========================= */}
        {analysis && !loading && (
          <section className="mt-12 space-y-6">

            {/* CLOSE ANALYSIS */}
            <div className="flex justify-end">

              <button
                onClick={closeAnalysis}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:border-red-500/10 hover:bg-red-500/10 hover:text-red-400"
              >
                ✕ Close Analysis
              </button>

            </div>

            {/* =========================
                ANALYSIS HEADER
            ========================= */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl transition-duration-300 hover:border-slate-700">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                <div className="min-w-0">

                  <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-400">
                    🎬 Video Analysis
                  </p>

                  <h3 className="wrap-break-word text-3xl font-bold text-white">
                    {analysis.title}
                  </h3>

                  <p className="mt-3 wrap-break-word text-sm text-slate-500">
                    {url}
                  </p>

                </div>

                <button
  onClick={copyAnalysis}
  className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:border-blue-500/10 hover:bg-blue-500/10 hover:text-blue-400"
>
  {copied ? "✅ Copied!" : "📋 Copy"}
</button>

              </div>

            </div>

            {/* =========================
                SUMMARY
            ========================= */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 transition-durantion-300 hover:border-slate-700">

              <h3 className="mb-4 text-2xl font-bold">
                📋 Summary
              </h3>

              <p className="leading-7 text-slate-300">
                {analysis.summary}
              </p>

            </div>

            {/* =========================
                MAIN TOPICS
            ========================= */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

              <h3 className="mb-5 text-2xl font-bold">
                📚 Main Topics
              </h3>

              <ul className="space-y-3">

                {analysis.mainTopics.map((topic, index) => (

                  <li
                    key={index}
                    className="rounded-xl bg-slate-800/60 p-4 text-slate-300 transition duration-200 hover:bg-slate-800 hover:translate-x-1"
                  >

                    <span className="mr-3 text-blue-400">
                      {index + 1}.
                    </span>

                    {topic}

                  </li>

                ))}

              </ul>

            </div>

            {/* =========================
                IMPORTANT POINTS
            ========================= */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

              <h3 className="mb-5 text-2xl font-bold">
                ⭐ Important Points
              </h3>

              <ul className="space-y-3">

                {analysis.importantPoints.map((point, index) => (

                 <li
                  key={index}
                  className="flex gap-3 rounded-lg p-3 text-slate-300 transition duration-200 hover:bg-slate-800/50"
>

                    <span className="text-blue-400">
                      •
                    </span>

                    <span>
                      {point}
                    </span>

                  </li>

                ))}

              </ul>

            </div>

            {/* =========================
                KEY TAKEAWAYS
            ========================= */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8">

              <h3 className="mb-5 text-2xl font-bold">
                💡 Key Takeaways
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                {analysis.keyTakeaways.map((takeaway, index) => (

                  <div
                    key={index}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition duration-200 hover:border-blue-500/20 hover:bg-blue-500/5"
                  >

                    <div className="mb-2 text-sm font-semibold text-blue-400">
                      TAKEAWAY {index + 1}
                    </div>

                    <p className="leading-6 text-slate-300">
                      {takeaway}
                    </p>

                  </div>

                ))}

              </div>

            </div>

            {/* =========================
                CONCLUSION
            ========================= */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 transition duration-200 hover:border-slate-700">

              <h3 className="mb-4 text-2xl font-bold">
                🔚 Conclusion
              </h3>

              <p className="leading-7 text-slate-300">
                {analysis.conclusion}
              </p>

            </div>

            {/* =========================
                TRANSCRIPT
            ========================= */}
            {/* =========================
    TRANSCRIPT
========================= */}
<div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">

  <details>

    <summary className="cursor-pointer list-none p-6 font-semibold text-slate-300 transition duration-200 hover:text-blue-400">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          <span className="text-xl">📝</span>

          <span>
            View Transcript
          </span>
        </div>

        <span
  className="
    hidden sm:flex items-center gap-2
    rounded-xl
    border border-blue-500/30
    bg-blue-500/10
    px-4 py-2
    text-xs font-semibold
    text-blue-400
    shadow-sm shadow-blue-500/10
    transition-all duration-300
    group-hover:border-blue-400/50
    group-hover:bg-blue-500/20
    group-hover:text-blue-300
    group-hover:shadow-md
    group-hover:shadow-blue-500/20
    group-hover:-translate-y-0.5
  "
>
  <span className="text-sm">↗</span>
  Click to open
</span>

      </div>

    </summary>

    <div className="border-t border-slate-800">

      <div className="max-h-125 overflow-y-auto p-6">

        <p className="whitespace-pre-wrap text-base leading-8 text-slate-300">
          {transcript}
        </p>

      </div>

    </div>

  </details>

</div>

          </section>
        )}

      </main>

    </div>
  );
}

export default App;