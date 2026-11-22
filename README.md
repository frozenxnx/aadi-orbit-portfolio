# Aaditya Srivastava — Field Notes from Earth

Personal portfolio at https://arvspace.vercel.app/

- Plain HTML, CSS and JavaScript, no build step and no dependencies.
- The background is a hand-written WebGL galaxy (~64k stars on desktop). The camera flies through it as you scroll, and you can drag the hero to spin it.
- Project diagrams, the skills constellation and the rocket launch are inline SVG + CSS.
- Respects `prefers-reduced-motion` and falls back to a CSS gradient without WebGL.

Edit content in `index.html`; galaxy settings (star counts, colours, camera path) live at the top of the galaxy block in `script.js`.
