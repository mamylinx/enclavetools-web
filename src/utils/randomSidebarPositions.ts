import { computed, type Ref } from 'vue'

function randomIndex(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min
}

export function randomSidebarPositions(cardCount: Ref<number>) {
  return computed(() => {
    const count = cardCount.value
    if (count < 6) return { sponsor: 1, newsletter: 3, sponsor_cta: 5 }

    const third = Math.floor(count / 3)
    return {
      sponsor:     randomIndex(1, third),
      newsletter:  randomIndex(third + 1, third * 2),
      sponsor_cta: randomIndex(third * 2 + 1, count - 1),
    }
  })
}