/**
 * rpaudit early-access page initialiser.
 * External file so it bypasses the strict hash-based CSP (no inline scripts).
 *
 * Handles all three inline forms (hero / magnet / final):
 * - query-param prefill (?email, ?stack / ?tool)
 * - email validation
 * - direct POST of {name, company, email, subject, text} to /api/contact
 *   (same mechanism as the contact form: rate-limited, Telegram + D1)
 * - "Sending..." button state + success message swap
 * - staggered reveal of the illustrative outbound-log rows
 *
 * Timing: astro:page-load fires on window "load" for initial visits AND after
 * View Transitions swaps, so one listener covers all cases (no double-init
 * thanks to the per-form dataset guard + node cloning pattern).
 */

var EARLY_ACCESS_STACK_OPTIONS = [
  "Vendor / third-party software",
  "AI tools and agents",
  "Servers and containers",
  "Desktop apps",
  "Dev tools and dependencies",
  "Something else",
];

function initRpauditEarlyAccess() {
  var params = new URLSearchParams(window.location.search);
  var prefillEmail = params.get("email") || "";
  var prefillStack = params.get("stack") || params.get("tool") || "";

  var forms = document.querySelectorAll("form[data-early-access-form]");

  // Guard: only run on the privacy-offer / early-access page.
  if (!forms.length && !document.getElementById("outboundLog")) return;
  // Avoid double-init when astro:page-load re-fires on the same DOM.
  if (document.documentElement.dataset.rpauditInit === "1") return;
  document.documentElement.dataset.rpauditInit = "1";

  function matchStackOption(select, wanted) {
    if (!select || !wanted) return;
    var needle = wanted.trim().toLowerCase();
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].text.trim().toLowerCase() === needle) {
        select.selectedIndex = i;
        return;
      }
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  forms.forEach(function (form) {
    // Clone to drop any previously attached listeners (View Transitions re-runs).
    var fresh = form.cloneNode(true);
    form.parentNode.replaceChild(fresh, form);

    var emailInput = fresh.querySelector('input[name="email"]');
    var stackSelect = fresh.querySelector('select[name="stack"]');
    var submitBtn = fresh.querySelector("[data-submit-btn]");

    if (emailInput && prefillEmail && !emailInput.value) {
      emailInput.value = prefillEmail;
    }
    if (stackSelect && prefillStack) {
      matchStackOption(stackSelect, prefillStack);
    }

    fresh.addEventListener("submit", function (e) {
      e.preventDefault();

      var email = emailInput ? emailInput.value.trim() : "";
      if (!isValidEmail(email)) {
        if (emailInput) {
          emailInput.focus();
          try {
            emailInput.setCustomValidity("Enter a valid email address.");
            emailInput.reportValidity();
            emailInput.addEventListener(
              "input",
              function () {
                emailInput.setCustomValidity("");
              },
              { once: true }
            );
          } catch (err) {
            /* reportValidity unsupported — focus is enough */
          }
        }
        return;
      }

      var source = fresh.getAttribute("data-early-access-form") || "hero";
      var stack =
        stackSelect && stackSelect.value
          ? stackSelect.value
          : source === "magnet"
            ? "Software Phone-Home Checklist"
            : "not specified";

      var payload = {
        name: "rpaudit early access",
        company: "",
        email: email,
        subject: "rpaudit early access (" + source + ")",
        text:
          "Source: privacy-offer / " +
          source +
          "\nEmail: " +
          email +
          "\nWants to check: " +
          stack,
      };

      var originalText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed: " + res.status);
          fresh.classList.add("hidden");
          var ok =
            fresh.parentElement.querySelector('[data-success="' + source + '"]') ||
            fresh.nextElementSibling;
          if (ok) ok.classList.remove("hidden");
          if (ok && ok.scrollIntoView) {
            ok.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        })
        .catch(function (err) {
          console.error("Early-access signup error:", err);
          alert("Failed to send. Please try again later.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        });
    });
  });

  // Staggered reveal of the illustrative log rows (progressive enhancement:
  // rows are visible by default when JS is off).
  var rows = document.querySelectorAll("[data-log-row]");
  if (rows.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    rows.forEach(function (row, i) {
      row.style.opacity = "0";
      row.style.transition = "opacity 0.35s ease";
      setTimeout(function () {
        row.style.opacity = "1";
      }, 400 + i * 550);
    });
  }
}

// astro:page-load fires on window "load" for initial visits AND after
// View Transitions swaps — one listener covers all cases.
document.addEventListener("astro:page-load", initRpauditEarlyAccess);
