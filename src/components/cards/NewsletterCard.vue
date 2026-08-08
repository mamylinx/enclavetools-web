<script setup lang="ts">
defineProps<{
  content: Record<string, string>
}>()
</script>

<template>
  <div
    class="col-span-1 border border-brand-forest/5 p-6 bg-linear-to-br from-white via-white to-accent-teal/8 backdrop-blur-sm rounded-3xl shadow-sm shadow-brand-forest/5 transition-all duration-300 ease-out-expo hover:border-accent-teal/20 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,54,27,0.08)]">
    <div class="flex flex-col h-full">
      <div class="text-xs font-bold uppercase text-accent-teal tracking-wider mb-3">{{ content.marketing_newsletter_label || 'Newsletter' }}</div>
      <div class="text-lg font-bold text-brand-forest mb-2">{{ content.newsletter_title }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ content.newsletter_subtitle }}</p>

      <form method="post" action="https://systeme.io/embedded/41620392/subscription">
        <input
          class="w-full px-4 h-10 bg-white/90 border border-brand-forest/5 font-sans text-sm mb-2 focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/30 outline-none rounded-full transition-all"
          type="text" name="email" :placeholder="content.newsletter_placeholder || 'your@email.com'" />
        <button
          class="w-full h-10 bg-gradient-cool text-white font-bold text-xs uppercase tracking-wider hover:shadow-md hover:shadow-accent-green/30 hover:scale-[1.02] transition-all border-none rounded-full inline-flex items-center justify-center shadow-sm shadow-accent-green/20"
          type="submit">{{ content.newsletter_cta || 'Get the digest' }}</button>
      </form>
    </div>
  </div>
</template>
