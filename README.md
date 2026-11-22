# Aaditya Srivastava — Observatory

Personal site at https://arvspace.vercel.app/. Plain HTML, CSS and JavaScript: no build step, no libraries.

**Portfolio tab**
- `sky.js` — a hand-written WebGL galaxy (~64k stars) over a domain-warped nebula shader. Warps in on load, the camera follows your scroll, and you can drag the hero to spin it. Also draws the stardust cursor trail.
- Projects orbit a star; pick one to read about it.
- Skills are a constellation that draws itself in.
- **Orbit Lab**: a gravity sandbox. Drag and release to throw planets; the dotted line predicts the path. Add a companion star for chaos.
- The header shows tonight's real moon phase, computed from the date.

**Field Guide tab** (`#guide`)
- `bodies.js` — data for 15 bodies plus one fragment shader that ray-traces each world (craters, cloud decks, gas bands, Saturn's rings with shadow, a black hole, a pulsar).
- `guide.js` — catalog, filters, live viewer (drag to rotate, ← → to browse), stats, size against Earth, random facts.

Respects `prefers-reduced-motion`, and falls back gracefully without WebGL.
