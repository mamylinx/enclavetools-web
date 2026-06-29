import { h } from 'vue'
import type { Component } from 'vue'

const attrs = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round' as const,
  'stroke-linejoin': 'round' as const,
}

function s(tag: string, d: Record<string, string | number>) {
  return h(tag, d)
}

function icon(children: ReturnType<typeof h>[]): Component {
  return {
    render() {
      return h('svg', { ...attrs, width: this.$props.size || 24, height: this.$props.size || 24, 'aria-hidden': 'true' }, children)
    }
  }
}

export const Cpu = icon([
  s('path', { d: 'M12 20v2' }),
  s('path', { d: 'M12 2v2' }),
  s('path', { d: 'M17 20v2' }),
  s('path', { d: 'M17 2v2' }),
  s('path', { d: 'M2 12h2' }),
  s('path', { d: 'M2 17h2' }),
  s('path', { d: 'M2 7h2' }),
  s('path', { d: 'M20 12h2' }),
  s('path', { d: 'M20 17h2' }),
  s('path', { d: 'M20 7h2' }),
  s('path', { d: 'M7 20v2' }),
  s('path', { d: 'M7 2v2' }),
  s('rect', { x: '4', y: '4', width: '16', height: '16', rx: '2' }),
  s('rect', { x: '8', y: '8', width: '8', height: '8', rx: '1' }),
])

export const Brain = icon([
  s('path', { d: 'M12 18V5' }),
  s('path', { d: 'M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4' }),
  s('path', { d: 'M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5' }),
  s('path', { d: 'M17.997 5.125a4 4 0 0 1 2.526 5.77' }),
  s('path', { d: 'M18 18a4 4 0 0 0 2-7.464' }),
  s('path', { d: 'M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517' }),
  s('path', { d: 'M6 18a4 4 0 0 1-2-7.464' }),
  s('path', { d: 'M6.003 5.125a4 4 0 0 0-2.526 5.77' }),
])

export const Database = icon([
  s('ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' }),
  s('path', { d: 'M3 5V19A9 3 0 0 0 21 19V5' }),
  s('path', { d: 'M3 12A9 3 0 0 0 21 12' }),
])

export const Bot = icon([
  s('path', { d: 'M12 8V4H8' }),
  s('rect', { x: '4', y: '8', width: '16', height: '12', rx: '2' }),
  s('path', { d: 'M2 14h2' }),
  s('path', { d: 'M20 14h2' }),
  s('path', { d: 'M15 13v2' }),
  s('path', { d: 'M9 13v2' }),
])

export const MessageSquare = icon([
  s('path', { d: 'M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z' }),
])

export const FileText = icon([
  s('path', { d: 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z' }),
  s('path', { d: 'M14 2v5a1 1 0 0 0 1 1h5' }),
  s('path', { d: 'M10 9H8' }),
  s('path', { d: 'M16 13H8' }),
  s('path', { d: 'M16 17H8' }),
])

export const Mic = icon([
  s('path', { d: 'M12 19v3' }),
  s('path', { d: 'M19 10v2a7 7 0 0 1-14 0v-2' }),
  s('rect', { x: '9', y: '2', width: '6', height: '13', rx: '3' }),
])

export const Volume2 = icon([
  s('path', { d: 'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z' }),
  s('path', { d: 'M16 9a5 5 0 0 1 0 6' }),
  s('path', { d: 'M19.364 18.364a9 9 0 0 0 0-12.728' }),
])

export const Image = icon([
  s('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
  s('circle', { cx: '9', cy: '9', r: '2' }),
  s('path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }),
])

export const GraduationCap = icon([
  s('path', { d: 'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z' }),
  s('path', { d: 'M22 10v6' }),
  s('path', { d: 'M6 12.5V16a6 3 0 0 0 12 0v-3.5' }),
])

export const Activity = icon([
  s('path', { d: 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2' }),
])

export const Shield = icon([
  s('path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }),
])

export const Layers = icon([
  s('path', { d: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z' }),
  s('path', { d: 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12' }),
  s('path', { d: 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17' }),
])

export const Server = icon([
  s('rect', { x: '2', y: '2', width: '20', height: '8', rx: '2', ry: '2' }),
  s('rect', { x: '2', y: '14', width: '20', height: '8', rx: '2', ry: '2' }),
  s('line', { x1: '6', x2: '6.01', y1: '6', y2: '6' }),
  s('line', { x1: '6', x2: '6.01', y1: '18', y2: '18' }),
])

export const GitBranch = icon([
  s('path', { d: 'M15 6a9 9 0 0 0-9 9V3' }),
  s('circle', { cx: '18', cy: '6', r: '3' }),
  s('circle', { cx: '6', cy: '18', r: '3' }),
])

export const Video = icon([
  s('path', { d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5' }),
  s('rect', { x: '2', y: '6', width: '14', height: '12', rx: '2' }),
])

export const Eye = icon([
  s('path', { d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0' }),
  s('circle', { cx: '12', cy: '12', r: '3' }),
])

export const Terminal = icon([
  s('path', { d: 'M12 19h8' }),
  s('path', { d: 'm4 17 6-6-6-6' }),
])

export const ChartBar = icon([
  s('path', { d: 'M3 3v16a2 2 0 0 0 2 2h16' }),
  s('path', { d: 'M7 16h8' }),
  s('path', { d: 'M7 11h12' }),
  s('path', { d: 'M7 6h3' }),
])

export const Circle = icon([
  s('circle', { cx: '12', cy: '12', r: '10' }),
])

export const iconMap: Record<string, Component> = {
  Cpu,
  Brain,
  Database,
  Bot,
  MessageSquare,
  FileText,
  Mic,
  Volume2,
  Image,
  GraduationCap,
  Activity,
  Shield,
  Layers,
  Server,
  GitBranch,
  Video,
  Eye,
  Terminal,
  ChartBar,
  Circle,
}
