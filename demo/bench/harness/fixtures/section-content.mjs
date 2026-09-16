// Deterministic CMS replacements. These are inputs, never expected geometry.
export const longBody = Array.from({ length: 20 }, () => 'Thoughtful teams build useful products with clear stories and care.').join(' ')
export const longTitle = 'A practical story about the people and decisions behind a thoughtful product, from the first idea to the final delivery. '.repeat(2).slice(0, 120)
export const mediaFiles = ['step-1.jpg', 'step-2.jpg', 'step-3.jpg']

// Copied into the isolated consumer along with real CLI output. No repo imports.
export const sectionContentSource = `import * as React from 'react'
import { StickySteps } from './StickySteps'
import { TimelineScrub } from './TimelineScrub'
import { CaseStudyRail } from './CaseStudyRail'
import { ScrollVarsBoot } from 'scrollvars/react'
const longBody = ${JSON.stringify(longBody)}
const longTitle = ${JSON.stringify(longTitle)}
export function ContentApp({ media = 'normal' }: { media?: string }) {
  const [long, setLong] = React.useState(false)
  const [count, setCount] = React.useState(3)
  const [lease, setLease] = React.useState(0)
  React.useEffect(() => {
    window.packedContent = { replace: setLong, count: setCount, remount: () => setLease(n => n + 1) }
    window.packedMounted = (window.packedMounted || 0) + 1
    return () => { delete window.packedContent }
  }, [])
  const items = [0, 1, 2].map(i => ({
    title: long ? longTitle : 'Step ' + (i + 1),
    text: long ? longBody : 'A short description of this useful product.',
    src: '/media/' + (i === 1 && media === 'held' ? 'held.jpg' : i === 1 && media === 'broken' ? 'missing.jpg' : 'step-' + (i + 1) + '.jpg'),
  }))
  return <><ScrollVarsBoot /><h1>Replaceable CMS content</h1><div key={lease} data-content-lease={lease}>
    <section id="content-steps"><StickySteps steps={items.slice(0, count).map((s, i) => ({
      title: <span data-content-title="">{s.title}</span>,
      text: <><span data-content-body="">{s.text}</span> <a href="#after">Read step {i + 1}</a></>,
      media: <a href="#after"><img src={s.src} width={1200} height={900} alt={'Product view ' + (i + 1)} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} /></a>,
    }))} /></section>
    <section id="content-timeline"><TimelineScrub steps={items.map((s, i) => ({ year: 2020 + i,
      text: <><span data-content-title="" style={{display:'block',fontWeight:700}}>{s.title}</span><span data-content-body="">{s.text}</span> <a href="#after">Read year {i + 1}</a></>,
    }))} /></section>
    <section id="content-rail"><CaseStudyRail projects={items.map(s => ({ title: s.title, summary: s.text, category: 'Product', image: { src: s.src, alt: 'Project view' } }))} href="#after" /></section>
  </div><a id="after" href="#before">End of content</a></>
}
`
