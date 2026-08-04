/**
 * Sponsor form initialiser.
 * External file so it bypasses the strict hash-based CSP.
 */
function initSponsorForm() {
  var form = document.getElementById("sponsorForm");
  var success = document.getElementById("sSuccess");
  if (!form) return;

  // Clone to drop any previously attached listeners (View Transitions re-runs)
  var freshForm = form.cloneNode(true);
  form.parentNode.replaceChild(freshForm, form);

  freshForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var submitBtn = document.getElementById("sSubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent || "Send Sponsorship Request";
      submitBtn.textContent = "Sending...";
    }

    var nameEl = document.getElementById("sName");
    var companyEl = document.getElementById("sCompany");
    var emailEl = document.getElementById("sEmail");
    var messageEl = document.getElementById("sMessage");

    var payload = {
      name: nameEl ? nameEl.value : "",
      company: companyEl ? companyEl.value : "",
      email: emailEl ? emailEl.value : "",
      message: messageEl ? messageEl.value : ""
    };

    try {
      var res = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        freshForm.classList.add("hidden");
        if (success) success.classList.remove("hidden");
      } else {
        alert("Failed to send message. Please try again later.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || "Send Sponsorship Request";
        }
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred. Please try again.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || "Send Sponsorship Request";
      }
    }
  });
}

document.addEventListener("astro:page-load", initSponsorForm);
