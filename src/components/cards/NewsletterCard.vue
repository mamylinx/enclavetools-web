<script setup lang="ts">
defineProps<{
  content: Record<string, string>
}>()
</script>

<template>
  <div
    class="col-span-1 border border-brand-forest/10 p-6 bg-white rounded-3xl transition-all duration-300 ease-out-expo hover:border-brand-forest hover:-translate-y-1 hover:shadow-lg">
    <div class="flex flex-col h-full">
      <div class="text-xs font-bold uppercase text-brand-muted tracking-wider mb-3">{{ content.marketing_newsletter_label || 'Newsletter' }}</div>
      <div class="text-lg font-bold text-brand-forest mb-2">{{ content.newsletter_title }}</div>
      <p class="text-sm font-medium text-brand-muted mb-4 flex-1">{{ content.newsletter_subtitle }}</p>

      <form method="post" action="https://systeme.io/embedded/41620392/subscription">
        <input
          class="w-full px-3 h-10 border border-brand-forest/10 font-sans text-sm mb-2 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal outline-none rounded-full"
          type="text" name="email" :placeholder="content.newsletter_placeholder || 'your@email.com'" />
        <button
          class="w-full h-10 bg-brand-forest text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors border-none rounded-full inline-flex items-center justify-center shadow-sm"
          type="submit">{{ content.newsletter_cta || 'Get the digest' }}</button>
      </form>
    </div>
  </div>
</template>
