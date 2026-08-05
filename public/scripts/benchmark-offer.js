/**
 * Benchmark offer page initialiser.
 * External file so it bypasses the strict hash-based CSP.
 */
function initBenchmarkOffer() {
  const params = new URLSearchParams(window.location.search);
  const dataParam = params.get("d");

  // Guard: only run on the benchmark-offer page
  if (!document.getElementById("displayModel")) return;

  var state = {};
  if (dataParam) {
    try {
      state = JSON.parse(decodeURIComponent(atob(dataParam)));
    } catch (e) {
      console.error("Failed to parse data");
    }
  }

  var model = state.model || params.get("model") || "MiniMax-M3 (MoE)";
  var paramsB = state.params || params.get("params") || "428";
  var precision = state.precision || params.get("precision") || "FP32";
  var inTok = parseInt(state.inTok || params.get("inTok")) || 7000;
  var outTok = parseInt(state.outTok || params.get("outTok")) || 1000;
  var users = parseInt(state.users || params.get("users")) || 10;
  var rps = parseFloat(state.rps || params.get("rps")) || 1.0;
  var ttft = parseFloat(state.ttft || params.get("ttft")) || 2.0;
  var ttlt = parseFloat(state.ttlt || params.get("ttlt")) || 30.0;
  var mode = state.mode || params.get("mode") || "Production Inference";

  var bytesPerParam = 4;
  if (
    precision.toUpperCase() === "FP16" ||
    precision.toUpperCase() === "BF16"
  )
    bytesPerParam = 2;
  else if (
    precision.toUpperCase().includes("INT8") ||
    precision.toUpperCase() === "FP8"
  )
    bytesPerParam = 1;
  else if (precision.toUpperCase() === "INT4") bytesPerParam = 0.5;

  // MoE models only activate a fraction of parameters per forward pass (~13%).
  // Detect MoE from the model name to avoid wildly inflated VRAM estimates.
  var isMoE = /moe|mixture.of.expert|mixtral|deepseek.?moe|minimax/i.test(model);
  var activeRatio = isMoE ? 0.13 : 1.0;
  var totalParams = parseFloat(paramsB);

  // Full model weights must be resident in VRAM regardless of MoE routing.
  var weightGB = (totalParams * bytesPerParam) / 1.024;
  var totalTokens = inTok + outTok;
  // KV cache scales with active parameters for MoE, not total parameter count.
  var kvGB = (totalTokens / 1000) * (totalParams * activeRatio) * 0.15;
  var totalVramGB = (weightGB + kvGB + 0.5).toFixed(1);

  var formatNum = function (num) { return num.toLocaleString(); };
  var inTokDisplay = formatNum(inTok);
  var outTokDisplay = formatNum(outTok);

  var el = function (id) { return document.getElementById(id); };

  var displayModel = el("displayModel");
  if (displayModel) displayModel.textContent = model;

  var subheadline = el("subheadline");
  if (subheadline)
    subheadline.innerHTML =
      'You need <strong class="text-brand-forest">' + inTokDisplay + '</strong> input tokens → <strong class="text-brand-forest">' + outTokDisplay + '</strong> output tokens, serving <strong class="text-brand-forest">' + users + '</strong> concurrent users at <strong class="text-brand-forest">' + rps + "</strong> RPS.";

  var badgeModel = el("badgeModel");
  if (badgeModel) badgeModel.textContent = model;
  var badgeParams = el("badgeParams");
  if (badgeParams) badgeParams.textContent = paramsB + "B";
  var badgePrecision = el("badgePrecision");
  if (badgePrecision) badgePrecision.textContent = precision;
  var badgeInTok = el("badgeInTok");
  if (badgeInTok) badgeInTok.textContent = inTokDisplay;
  var badgeOutTok = el("badgeOutTok");
  if (badgeOutTok) badgeOutTok.textContent = outTokDisplay;
  var badgeUsers = el("badgeUsers");
  if (badgeUsers) badgeUsers.textContent = users;
  var badgeMode = el("badgeMode");
  if (badgeMode)
    badgeMode.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
  var badgeVram = el("badgeVram");
  if (badgeVram) badgeVram.textContent = "~" + totalVramGB + " GB";

  var moeNoteEl = el("moeNote");
  if (moeNoteEl) moeNoteEl.style.display = isMoE ? "block" : "none";

  var offerModel = el("offerModel");
  if (offerModel) offerModel.textContent = model;
  var offerUsers = el("offerUsers");
  if (offerUsers) offerUsers.textContent = users;
  var offerInTok = el("offerInTok");
  if (offerInTok) offerInTok.textContent = inTokDisplay;
  var offerOutTok = el("offerOutTok");
  if (offerOutTok) offerOutTok.textContent = outTokDisplay;

  var slotCount = el("slotCount");
  if (slotCount) slotCount.textContent = "4";
  var slotCount2 = el("slotCount2");
  if (slotCount2) slotCount2.textContent = "4";
  var psSlots = el("psSlots");
  if (psSlots) psSlots.textContent = "4 slots";

  var slotUpdated = el("slotUpdated");
  if (slotUpdated) {
    var now = new Date();
    var label = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    slotUpdated.textContent = "Cycle updated: " + label;
  }

  var bodyText = "Task: Server Certainty Blueprint for " + model + ".\n";
  bodyText += "- Model: " + model + "\n";
  bodyText += "- Params: " + paramsB + "B\n";
  bodyText += "- Precision: " + precision + "\n";
  bodyText += "- Input Tokens: " + inTok + "\n";
  bodyText += "- Output Tokens: " + outTok + "\n";
  bodyText += "- Peak Concurrent Users: " + users + "\n";
  bodyText += "- Average RPS: " + rps + "\n";
  bodyText += "- Max TTFT: " + ttft + "s\n";
  bodyText += "- Max TTLT: " + ttlt + "s\n";
  bodyText += "- Mode: " + mode + "\n";
  bodyText += "- Est. VRAM: ~" + totalVramGB + " GB\n";

  var ctaBtn = el("contactCtaBtn");
  if (ctaBtn) {
    // Clone to drop any previously attached listeners (View Transitions re-runs)
    var fresh = ctaBtn.cloneNode(true);
    ctaBtn.parentNode.replaceChild(fresh, ctaBtn);
    fresh.addEventListener("click", function (e) {
      e.preventDefault();
      sessionStorage.setItem("contactSubject", "Server Certainty Blueprint for " + model);
      sessionStorage.setItem("contactBody", bodyText);
      window.location.href = "/contact";
    });
  }
}

// astro:page-load fires on window "load" for initial visits AND after View Transitions swaps
document.addEventListener("astro:page-load", initBenchmarkOffer);
