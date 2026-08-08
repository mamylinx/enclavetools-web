(function() {
  function initTabs() {
    var tabs = document.querySelectorAll('[data-tab-role="tab"]');
    var panels = document.querySelectorAll('.use-case-content');
    if (!tabs.length || !panels.length) return;

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var persona = tab.dataset.persona;

        tabs.forEach(function(t) {
          t.classList.remove('bg-gradient-cool', 'text-white', 'border-transparent', 'shadow-md', 'shadow-accent-green/20');
          t.classList.add('bg-white', 'text-brand-forest', 'border-brand-forest/5');
          t.setAttribute('aria-selected', 'false');
        });

        tab.classList.remove('bg-white', 'text-brand-forest', 'border-brand-forest/5');
        tab.classList.add('bg-gradient-cool', 'text-white', 'border-transparent', 'shadow-md', 'shadow-accent-green/20');
        tab.setAttribute('aria-selected', 'true');

        panels.forEach(function(panel) { panel.classList.add('hidden'); });
        var panelId = 'use-case-' + persona.replace(/\s+/g, '-').toLowerCase();
        var target = document.getElementById(panelId);
        if (target) target.classList.remove('hidden');
      });
    });
  }

  document.addEventListener('astro:page-load', initTabs);
  if (document.readyState !== 'loading') initTabs();
})();
