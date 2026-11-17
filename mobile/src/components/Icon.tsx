import React from 'react'
import Svg, { Circle, Path, Rect } from 'react-native-svg'

/* Icon path data reused verbatim from the website (data.js IC / ui.jsx ICN / views.jsx). */
export const ICONS: Record<string, string> = {
  home: `<path d='M3 11l9-8 9 8M5 10v10h14V10'/>`,
  patrimoine: `<path d='M3 20h18M6 16l4-5 4 3 5-8'/>`,
  comptes: `<path d='M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18'/>`,
  cartes: `<path d='M3 6h18v12H3zM3 10h18'/>`,
  virements: `<path d='M7 7h12l-3-3M17 17H5l3 3'/>`,
  assurances: `<path d='M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z'/>`,
  credits: `<circle cx='7' cy='7' r='2'/><circle cx='17' cy='17' r='2'/><path d='M19 5L5 19'/>`,
  documents: `<path d='M7 3h7l5 5v13H7zM14 3v5h5'/>`,
  collapse: `<path d='M15 6l-6 6 6 6'/>`,
  logout: `<path d='M9 4H5v16h4M16 8l4 4-4 4M20 12H9'/>`,
  eye: `<path d='M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/>`,
  eyeOff: `<path d='M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/><path d='M4 4l16 16'/>`,
  wallet: `<path d='M4 8.5V7a2 2 0 0 1 2-2h10l2 2'/><rect x='3' y='8' width='18' height='12' rx='3'/><rect x='15' y='12' width='6' height='4' rx='1.5'/><circle cx='17.5' cy='14' r='.6'/>`,
  bank: `<path d='M3 9l9-5 9 5'/><path d='M3 9h18'/><path d='M6 12v6M10 12v6M14 12v6M18 12v6'/><path d='M3 21h18'/>`,
  cashback: `<path d='M3.5 12a8.5 8.5 0 1 0 2.6-6.1'/><path d='M3 4v4.5h4.5'/><path d='M14.5 9.2a3 3 0 1 0 0 5.6M8.5 11h5M8.5 13h5'/>`,
  plus: `<circle cx='12' cy='12' r='9.5'/><path d='M12 7v10M7 12h10'/>`,
  mail: `<rect x='3' y='5' width='18' height='14' rx='2'/><path d='M3 7l9 6 9-6'/>`,
  phone: `<path d='M5 3.5h3.5l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5V17a2.5 2.5 0 0 1-2.5 2.5C10.5 19.5 4.5 13.5 4.5 6A2.5 2.5 0 0 1 5 3.5z'/>`,
  cal: `<rect x='3.5' y='5' width='17' height='15' rx='2'/><path d='M3.5 10h17M8 3v4M16 3v4'/>`,
  video: `<rect x='3' y='6' width='12' height='12' rx='2'/><path d='M15 10l6-3v10l-6-3z'/>`,
  chevR: `<path d='M9 6l6 6-6 6'/>`,
  chevD: `<path d='M6 9l6 6 6-6'/>`,
  chevL: `<path d='M15 6l-6 6 6 6'/>`,
  menu: `<path d='M4 7h16M4 12h16M4 17h16'/>`,
  user: `<circle cx='12' cy='8' r='4'/><path d='M4 21c1-4.5 4-6.5 8-6.5s7 2 8 6.5'/>`,
  camera: `<path d='M4 8h3l2-3h6l2 3h3v12H4z'/><circle cx='12' cy='13.5' r='3.4'/>`,
  clip: `<path d='M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 6'/>`,
  shield: `<path d='M12 3l7 3v6c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6z'/>`,
  device: `<rect x='7' y='2.5' width='10' height='19' rx='2'/><path d='M10.5 18.5h3'/>`,
  info: `<circle cx='12' cy='12' r='9'/><path d='M12 11v5M12 7.8h.01'/>`,
  folder: `<path d='M3 7h6l2 2h10v11H3z'/>`,
  umbrella: `<path d='M3 12a9 9 0 0 1 18 0z'/><path d='M12 12v6a2 2 0 0 0 4 0'/>`,
  check: `<path d='M5 12.5l4.5 4.5L19 7.5'/>`,
  close: `<path d='M6 6l12 12M18 6L6 18'/>`,
  search: `<circle cx='11' cy='11' r='6.5'/><path d='M16 16l4.5 4.5'/>`,
  edit: `<path d='M4 20h4L19 9l-4-4L4 16z'/>`,
  trash: `<path d='M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13'/>`,
  download: `<path d='M12 4v11M7 11l5 5 5-5M5 20h14'/>`,
  lock: `<rect x='5' y='11' width='14' height='9' rx='2'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/>`,
  bell: `<path d='M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4'/>`,
  globe: `<circle cx='12' cy='12' r='9'/><path d='M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'/>`,
  tag: `<path d='M3 12V4h8l10 10-8 8z'/><circle cx='7.5' cy='8.5' r='1'/>`,
  sort: `<path d='M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3'/>`
}

const attr = (s: string, name: string) => {
  const m = new RegExp(`${name}='([^']*)'`).exec(s)
  return m ? m[1] : undefined
}

export function Icon({ name, size = 22, color = '#000', stroke = 1.7 }: { name: string; size?: number; color?: string; stroke?: number }) {
  const src = ICONS[name] || ''
  const els = src.match(/<(path|circle|rect)\s[^>]*\/>/g) || []
  const common = { stroke: color, fill: 'none', strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {els.map((e, i) => {
        if (e.startsWith('<path')) return <Path key={i} d={attr(e, 'd')} {...common} />
        if (e.startsWith('<circle'))
          return <Circle key={i} cx={Number(attr(e, 'cx'))} cy={Number(attr(e, 'cy'))} r={Number(attr(e, 'r'))} {...common} />
        return (
          <Rect
            key={i}
            x={Number(attr(e, 'x'))}
            y={Number(attr(e, 'y'))}
            width={Number(attr(e, 'width'))}
            height={Number(attr(e, 'height'))}
            rx={Number(attr(e, 'rx') || 0)}
            {...common}
          />
        )
      })}
    </Svg>
  )
}
