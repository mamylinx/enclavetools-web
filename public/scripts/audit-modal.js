/**
 * Audit modal initialiser.
 * External file so it bypasses the strict hash-based CSP.
 */
function initAuditModal() {
  var modal = document.getElementById("auditModal");
  var closeBtn = document.getElementById("closeAuditModal");
  var form = document.getElementById("auditModalForm");
  var input = document.getElementById("modalToolName");
  var envSelect = document.getElementById("modalEnvSelect");
  var emailInput = document.getElementById("modalWorkEmail");
  var chips = document.querySelectorAll(".modal-chip");

  // Guard: only run when audit modal elements exist
  if (!modal) return;

  function openModal(defaultTool) {
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (input) {
      if (defaultTool) input.value = defaultTool;
      setTimeout(function() { input.focus(); }, 100);
    }
    updateChipStyles();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function updateChipStyles() {
    var currentVal = input ? input.value.trim().toLowerCase() : "";
    chips.forEach(function(chip) {
      var chipVal = (chip.getAttribute("data-tool") || "").toLowerCase();
      if (chipVal && chipVal === currentVal) {
        chip.classList.add("bg-brand-teal", "text-white", "border-brand-teal");
        chip.classList.remove("bg-brand-forest/5", "text-brand-forest", "border-brand-forest/10");
      } else {
        chip.classList.remove("bg-brand-teal", "text-white", "border-brand-teal");
        chip.classList.add("bg-brand-forest/5", "text-brand-forest", "border-brand-forest/10");
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", function(e) {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  chips.forEach(function(chip) {
    chip.addEventListener("click", function() {
      var val = chip.getAttribute("data-tool");
      if (val && input) {
        input.value = val;
        updateChipStyles();
      }
    });
  });

  if (input) {
    input.addEventListener("input", updateChipStyles);
  }

  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      var tool = input ? input.value.trim() : "";
      var env = envSelect ? envSelect.value : "Docker Container";
      var email = emailInput ? emailInput.value.trim() : "";
      if (!tool) {
        if (input) input.focus();
        return;
      }
      var targetUrl = "/privacy-offer?tool=" + encodeURIComponent(tool) + "&env=" + encodeURIComponent(env);
      if (email) {
        targetUrl += "&email=" + encodeURIComponent(email);
      }
      window.location.href = targetUrl;
    });
  }

  document.addEventListener("click", function(e) {
    var target = e.target;
    var trigger = target.closest ? target.closest(".open-audit-modal") : null;
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      var initial = trigger.getAttribute("data-tool") || "";
      openModal(initial);
    }
  });
}

document.addEventListener("astro:page-load", initAuditModal);
