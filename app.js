let lang = localStorage.getItem("FarmFusionAILang") || "en";
let recognition = null;

const $ = s => document.querySelector(s);
const toast = $("#toast");

function t(en, ml) {
    return lang === "ml" ? ml : en;
}

function applyLang() {
    document.documentElement.lang = lang === "ml" ? "ml" : "en";

    document.querySelectorAll("[data-en]").forEach(e => {
        e.innerHTML = lang === "ml"
            ? e.dataset.ml
            : e.dataset.en;
    });

    localStorage.setItem("FarmFusionAILang", lang);
}

function toggleLang() {
    lang = lang === "en" ? "ml" : "en";
    applyLang();

    showToast(
        t(
            "Malayalam mode enabled",
            "മലയാളം മോഡ് സജീവമാക്കി"
        )
    );
}

function showToast(x) {

    if (!toast) return;

    toast.textContent = x;
    toast.classList.add("show");

    clearTimeout(window.tm);

    window.tm = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function toggleTheme() {
    document.body.classList.toggle("dark");

    showToast(
        t(
            "Dark mode enabled",
            "ഡാർക്ക് മോഡ് സജീവമാക്കി"
        )
    );
}

function showAlert() {
    showToast(
        t(
            "3 farm alerts: pepper humidity risk, irrigation reminder, scheme match",
            "3 കൃഷി മുന്നറിയിപ്പുകൾ: കുരുമുളക് ഈർപ്പം, ജലസേചന ഓർമ്മപ്പെടുത്തൽ, പദ്ധതി പൊരുത്തം"
        )
    );
}

function scanField() {
    showToast(
        t(
            "AI Vision scan complete: Pepper Block B needs inspection",
            "AI ദൃശ്യ സ്കാൻ പൂർത്തിയായി: കുരുമുളക് ബ്ലോക്ക് B പരിശോധിക്കണം"
        )
    );
}

function refreshMarket() {

    let p = +(Math.random() * 15 + 675).toFixed(0);

    $("#pepperPrice").innerHTML =
        "₹" + p + " <em>+5.1%</em>";

    showToast(
        t(
            "Market prices refreshed",
            "വിപണി വിലകൾ പുതുക്കി"
        )
    );
}


// =====================================================
// TEST SERVER
// =====================================================

async function testServer() {

    console.log("🔎 Testing FarmFusionAI server...");

    try {

        const response = await fetch("/test");

        console.log("Server status:", response.status);

        const data = await response.json();

        console.log("✅ Server response:", data);

    } catch (error) {

        console.error("❌ SERVER CONNECTION FAILED");
        console.error(error);

    }
}


// =====================================================
// VOICE
// =====================================================

function startVoice() {

    const modal = $("#voiceModal");

    modal.classList.add("open");

    $("#voiceStatus").textContent =
        t("Listening…", "കേൾക്കുന്നു…");

    $("#voiceResult").textContent =
        t(
            "Speak naturally in English or Malayalam.",
            "ഇംഗ്ലീഷിലോ മലയാളത്തിലോ സ്വാഭാവികമായി സംസാരിക്കൂ."
        );


    // Check browser support

    if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
    ) {

        $("#voiceStatus").textContent =
            "Voice recognition unavailable";

        $("#voiceResult").textContent =
            "Please open FarmFusionAI in Google Chrome.";

        console.error(
            "❌ SpeechRecognition is not supported in this browser."
        );

        return;
    }


    const R =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    recognition = new R();

    recognition.lang =
        lang === "ml"
            ? "ml-IN"
            : "en-IN";

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;


    recognition.onstart = () => {

        console.log("🎙 Voice recognition started");

        $("#voiceStatus").textContent =
            t(
                "Listening…",
                "കേൾക്കുന്നു…"
            );
    };


    recognition.onresult = async (event) => {

        const q =
            event.results[0][0].transcript;

        console.log("🎤 QUESTION RECEIVED:");
        console.log(q);


        $("#voiceStatus").textContent =
            "Thinking...";

        $("#voiceResult").textContent =
            "Sending question to FarmFusionAI...";


        try {

            console.log("📡 Sending /chat request...");


            const response = await fetch("/chat", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: q
                })

            });


            console.log(
                "📡 Server HTTP status:",
                response.status
            );


            const data =
                await response.json();


            console.log(
                "🤖 AI RESPONSE:",
                data.reply
            );


            $("#voiceStatus").textContent =
                "FarmFusionAI Recommendation";


            $("#voiceResult").innerHTML =
                formatAIResponse(data.reply);
            speakAnswer(data.reply);


        } catch (error) {

            console.error(
                "❌ FETCH ERROR:",
                error
            );


            $("#voiceStatus").textContent =
                "Connection Error";


            $("#voiceResult").textContent =
                "Could not connect to FarmFusionAI server.";

        }

    };


    recognition.onerror = (event) => {

        console.error(
            "❌ VOICE ERROR:",
            event.error
        );

        $("#voiceResult").textContent =
            "Voice error: " + event.error;
    };


    recognition.onend = () => {

        console.log("🎙 Voice recognition ended");

    };


    try {

        recognition.start();

    } catch (error) {

        console.error(
            "❌ Could not start microphone:",
            error
        );

    }
}


// =====================================================
// FORMAT GEMINI RESPONSE
// =====================================================
function speakAnswer(text) {

  if (!("speechSynthesis" in window)) {
      console.log("❌ Voice output not supported");
      return;
  }

  // Purani speech stop karo
  window.speechSynthesis.cancel();

  // Markdown hatao
  const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/\*/g, "")
      .replace(/•/g, "")
      .replace(/\n/g, ". ");

  const speech = new SpeechSynthesisUtterance(cleanText);

  speech.lang = lang === "ml" ? "ml-IN" : "en-IN";
  speech.rate = 0.95;
  speech.pitch = 1;
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
}

function formatAIResponse(text) {

    if (!text) {
        return "No answer received.";
    }

    return text

        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        )

        .replace(
            /^### (.*)$/gm,
            "<h3>$1</h3>"
        )

        .replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        )

        .replace(
            /^\* (.*)$/gm,
            "• $1"
        )

        .replace(
            /\n/g,
            "<br>"
        );
}


// =====================================================
// STOP VOICE
// =====================================================

function stopVoice() {

    try {

        recognition?.stop();

    } catch (e) {}

    $("#voiceModal").classList.remove("open");
}


// =====================================================
// START
// =====================================================

applyLang();

testServer();
// =====================================================
// DYNAMIC CURRENT DATE
// =====================================================

function updateCurrentDate() {

  const dateElement = document.getElementById("currentDate");

  if (!dateElement) return;

  const now = new Date();

  const options = {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric"
  };

  const dateText = now
      .toLocaleDateString("en-IN", options)
      .toUpperCase();

  dateElement.textContent =
      dateText + " · KOTTAYAM, KERALA";
}

updateCurrentDate();
