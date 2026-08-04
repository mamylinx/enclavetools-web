/**
 * Privacy offer page initialiser.
 * External file so it bypasses the strict hash-based CSP.
 */
function initPrivacyCalculator() {
  var params = new URLSearchParams(window.location.search);
  var initialTool = params.get("tool") || params.get("name") || "";
  var initialEnv = params.get("env") || "Docker Container";
  var initialTarget = params.get("target") || params.get("sensitivity") || "Zero External Telemetry";

  // Guard: only run on the privacy-offer page
  if (!document.getElementById("cfgToolInput") && !document.getElementById("displayTool")) return;

  if (initialTarget.includes("HIPAA") || initialTarget.includes("GDPR") || initialTarget.includes("Enterprise")) {
    initialTarget = "Zero External Telemetry";
  }

  var el = function (id) { return document.getElementById(id); };
  var toolInput = el("cfgToolInput");
  var envSelect = el("cfgEnvSelect");
  var targetSelect = el("cfgTargetSelect");
  var presetChips = document.querySelectorAll(".preset-chip");

  if (initialTool && toolInput) {
    toolInput.value = initialTool;
  }
  if (initialEnv && envSelect) {
    envSelect.value = initialEnv;
  }
  if (initialTarget && targetSelect) {
    targetSelect.value = initialTarget;
  }

  function updatePage() {
    var tInput = el("cfgToolInput");
    var eSelect = el("cfgEnvSelect");
    var tgSelect = el("cfgTargetSelect");

    var currentTool = tInput && tInput.value.trim() ? tInput.value.trim() : "Your AI Stack";
    var currentEnv = eSelect ? eSelect.value : "Docker Container";
    var currentTarget = tgSelect ? tgSelect.value : "Zero External Telemetry";

    var displayTool = el("displayTool");
    if (displayTool) displayTool.textContent = currentTool;

    var displayToolSub = el("displayToolSub");
    if (displayToolSub) displayToolSub.textContent = currentTool;

    var displayEnv = el("displayEnv");
    if (displayEnv) displayEnv.textContent = currentEnv;

    var displayTarget = el("displayTarget");
    if (displayTarget) displayTarget.textContent = currentTarget;

    var badgeTool = el("badgeTool");
    if (badgeTool) badgeTool.textContent = currentTool;

    var badgeEnv = el("badgeEnv");
    if (badgeEnv) badgeEnv.textContent = currentEnv;

    var badgeTarget = el("badgeTarget");
    if (badgeTarget) badgeTarget.textContent = currentTarget;

    var offerTool = el("offerTool");
    if (offerTool) offerTool.textContent = currentTool;

    var userEmail = params.get("email") || "";

    var bodyText = "Task: Airgap Certainty Blueprint (Privacy & Telemetry Audit) for " + currentTool + ".\n";
    bodyText += "- Target Tool / AI Stack: " + currentTool + "\n";
    bodyText += "- Environment: " + currentEnv + "\n";
    bodyText += "- Privacy & Telemetry Goal: " + currentTarget + "\n";
    if (userEmail) {
      bodyText += "- Work Email: " + userEmail + "\n";
    }

    var ctaBtn = el("contactCtaBtn");
    if (ctaBtn) {
      // Clone to drop any previously attached listeners (View Transitions re-runs)
      var fresh = ctaBtn.cloneNode(true);
      ctaBtn.parentNode.replaceChild(fresh, ctaBtn);
      fresh.addEventListener("click", function (e) {
        e.preventDefault();
        sessionStorage.setItem("contactSubject", "Airgap Certainty Blueprint Audit for " + currentTool);
        sessionStorage.setItem("contactBody", bodyText);
        if (userEmail) {
          sessionStorage.setItem("contactEmail", userEmail);
        }
        window.location.href = "/contact";
      });
    }
  }

  if (toolInput) toolInput.addEventListener("input", updatePage);
  if (envSelect) envSelect.addEventListener("change", updatePage);
  if (targetSelect) targetSelect.addEventListener("change", updatePage);

  presetChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var toolName = chip.getAttribute("data-preset");
      var tInput = el("cfgToolInput");
      if (toolName && tInput) {
        tInput.value = toolName;
        updatePage();
      }
    });
  });

  updatePage();
}

// astro:page-load fires on window "load" for initial visits AND after View Transitions swaps
document.addEventListener("astro:page-load", initPrivacyCalculator);
