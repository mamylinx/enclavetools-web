/**
 * Contact form initialiser.
 * Loaded as a plain external script (/scripts/contact-form.js) so the
 * strict hash-based CSP never blocks it ('self' covers same-origin files).
 *
 * Timing: astro:page-load fires on window "load" (after module scripts) for
 * both initial hard-navigations AND Astro View Transitions swaps, so we only
 * need one listener. We deliberately do NOT also listen to DOMContentLoaded
 * to avoid clearing sessionStorage before astro:page-load reads it.
 */

function initContactForm() {
  const params = new URLSearchParams(window.location.search);

  // Read from sessionStorage first (set by offer pages), fall back to URL params
  const subject =
    sessionStorage.getItem("contactSubject") ||
    params.get("subject") ||
    "Hardware Sizing & Benchmark";
  const body =
    sessionStorage.getItem("contactBody") || params.get("body") || "";
  const email =
    sessionStorage.getItem("contactEmail") || params.get("email") || "";

  // Clear sessionStorage after reading so it doesn't persist across future visits
  sessionStorage.removeItem("contactSubject");
  sessionStorage.removeItem("contactBody");
  sessionStorage.removeItem("contactEmail");

  const subjectEl = document.getElementById("cSubject");
  const bodyEl = document.getElementById("cBody");
  const emailEl = document.getElementById("cEmail");
  const titleEl = document.getElementById("contactTitle");
  const subEl = document.getElementById("contactSub");
  const submitBtn = document.getElementById("cSubmitBtn");
  const successTitle = document.getElementById("cSuccessTitle");
  const successSub = document.getElementById("cSuccessSub");

  // Guard: only run when we are actually on the contact page
  if (!subjectEl) return;

  if (subjectEl) subjectEl.value = subject;
  if (bodyEl) bodyEl.value = body;
  if (emailEl && email) emailEl.value = email;

  if (
    subject.includes("Airgap") ||
    subject.includes("Privacy") ||
    subject.includes("Audit")
  ) {
    if (titleEl)
      titleEl.textContent = "Request Your Airgap Certainty Blueprint";
    if (subEl)
      subEl.textContent =
        "Review your stack details below and submit to lock in your audit slot.";
    if (submitBtn) submitBtn.textContent = "🛡️ Submit Audit Request";
    if (successTitle) successTitle.textContent = "Audit Request Submitted";
    if (successSub)
      successSub.textContent =
        "We will email your audit confirmation within 24 hours.";
  }

  const form = document.getElementById("contactForm");
  const success = document.getElementById("cSuccess");
  if (!form) return;

  // Clone the form node to drop any previously attached submit listeners
  // (View Transitions re-runs this function on every navigation to /contact)
  const freshForm = form.cloneNode(true);
  form.parentNode.replaceChild(freshForm, form);

  freshForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("cSubmitBtn");
    if (btn) {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent || "Send My Blueprint";
      btn.textContent = "Sending...";
    }

    const nameEl = document.getElementById("cName");
    const companyEl = document.getElementById("cCompany");
    const sEl = document.getElementById("cSubject");
    const bEl = document.getElementById("cBody");
    const eEl = document.getElementById("cEmail");

    const payload = {
      name: nameEl ? nameEl.value : "",
      company: companyEl ? companyEl.value : "",
      email: eEl ? eEl.value : "",
      subject: sEl ? sEl.value : "",
      text: bEl ? bEl.value : "",
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        freshForm.classList.add("hidden");
        if (success) success.classList.remove("hidden");
      } else {
        alert("Failed to send message. Please try again later.");
        if (btn) {
          btn.disabled = false;
          btn.textContent = btn.dataset.originalText || "Send My Blueprint";
        }
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred. Please try again.");
      if (btn) {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || "Send My Blueprint";
      }
    }
  });
}

// astro:page-load fires on window "load" for initial visits AND after every
// View Transitions swap — one listener covers all cases, no double-init.
document.addEventListener("astro:page-load", initContactForm);
