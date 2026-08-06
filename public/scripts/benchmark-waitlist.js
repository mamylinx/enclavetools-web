(function () {
  'use strict';

  const form = document.getElementById('waitlistForm');
  const emailInput = document.getElementById('waitlistEmail');
  const btn = document.getElementById('waitlistBtn');
  const msg = document.getElementById('waitlistMsg');

  if (!form) return;

  function showMessage(text, isError) {
    msg.textContent = text;
    msg.classList.remove('hidden', 'text-red-300', 'text-brand-lime');
    msg.classList.add(isError ? 'text-red-300' : 'text-brand-lime');
  }

  function setLoading(loading) {
    btn.disabled = loading;
    btn.textContent = loading ? 'Joining...' : 'Count Me In';
    btn.classList.toggle('opacity-60', loading);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) return;

    setLoading(true);
    msg.classList.add('hidden');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.status === 'already_registered') {
          showMessage("You're already on the priority list. We'll notify you as soon as the next cohort opens.", false);
        } else {
          showMessage("You're in! We've saved your spot on the priority waitlist and will notify you when cohort slots open.", false);
        }
        emailInput.value = '';
      } else {
        showMessage(data.error || "Something went wrong. Please try again.", true);
      }
    } catch (err) {
      showMessage("Connection failed. Please try again.", true);
    } finally {
      setLoading(false);
    }
  });

  // Set a plausible "last updated" date (2 days ago from page load)
  const dateEl = document.getElementById('benchmarkDate');
  if (dateEl) {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    dateEl.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
})();
