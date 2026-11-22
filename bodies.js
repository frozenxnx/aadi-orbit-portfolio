/* Bodies: data for the Field Guide plus a ray-traced sphere renderer (one fragment shader, many worlds).
   Exposes window.ARV.BODIES and window.ARV.createBodyRenderer(canvas) */
(() => {
  'use strict';
  const ARV = (window.ARV = window.ARV || {});

  // type: 0 rocky, 1 cloud deck, 2 earth, 3 mars, 4 gas giant, 5 ice giant, 6 star, 7 icy cracked, 8 hazy, 9 black hole, 10 neutron star, 11 pluto
  ARV.BODIES = [
    { id: 'sun', name: 'The Sun', kind: 'G-type main-sequence star', group: 'star', diameter: 1392700,
      tag: 'Our star, and nearly all the mass in the Solar System.',
      look: { type: 6, c1: [1.0, 0.45, 0.08], c2: [1.0, 0.86, 0.45], c3: [1.0, 0.55, 0.15], spin: 0.06, tilt: 0.12, glow: 1.4 },
      stats: [['Diameter', '1,392,700 km'], ['Spin', '~25 days at the equator'], ['Surface', '~5,500 °C'], ['Gravity', '28 g']],
      facts: ['It holds about 99.8% of all the mass in the Solar System.',
        'Sunlight takes about 8 minutes 20 seconds to reach Earth, so you always see the Sun as it was a few minutes ago.',
        'Its core reaches around 15 million °C, hot enough to fuse hydrogen into helium.',
        'It spins faster at its equator (about 25 days) than near its poles (about 35 days), because it isn’t solid.'] },

    { id: 'mercury', name: 'Mercury', kind: 'Rocky planet', group: 'planet', diameter: 4879,
      tag: 'The smallest planet, baked and frozen in turn.',
      look: { type: 0, c1: [0.62, 0.58, 0.55], c2: [0.32, 0.30, 0.29], c3: [0, 0, 0], spin: 0.12, tilt: 0.0, glow: 0 },
      stats: [['Diameter', '4,879 km'], ['Spin', '59 days'], ['Orbit', '88 days'], ['Gravity', '0.38 g']],
      facts: ['One solar day there, sunrise to sunrise, lasts about 176 Earth days: two of its years.',
        'With almost no atmosphere to hold heat, it swings from about 430 °C in daylight to −180 °C at night.',
        'It is the smallest planet, only slightly larger than our Moon.',
        'Even this close to the Sun, water ice survives in permanently shadowed craters at its poles.'] },

    { id: 'venus', name: 'Venus', kind: 'Rocky planet', group: 'planet', diameter: 12104,
      tag: 'Earth’s twin in size, a furnace under the clouds.',
      look: { type: 1, c1: [0.95, 0.80, 0.52], c2: [0.72, 0.50, 0.26], c3: [1.0, 0.85, 0.55], spin: 0.05, tilt: 0.05, glow: 0.7 },
      stats: [['Diameter', '12,104 km'], ['Spin', '243 days, backwards'], ['Orbit', '225 days'], ['Gravity', '0.90 g']],
      facts: ['It spins backwards compared with most planets, so the Sun rises in the west.',
        'It takes longer to spin once (243 Earth days) than to orbit the Sun (225 days).',
        'Its thick carbon dioxide air traps heat, making it the hottest planet at about 465 °C, hotter than Mercury.',
        'Pressure at the surface is about 90 times Earth’s, like being nearly a kilometre under the sea.'] },

    { id: 'earth', name: 'Earth', kind: 'Rocky planet', group: 'planet', diameter: 12742,
      tag: 'Home. The only place we know of with life.',
      look: { type: 2, c1: [0.22, 0.42, 0.18], c2: [0.04, 0.16, 0.42], c3: [0.35, 0.62, 1.0], spin: 0.16, tilt: 0.41, glow: 0.9 },
      stats: [['Diameter', '12,742 km'], ['Spin', '23.9 hours'], ['Orbit', '365.25 days'], ['Gravity', '1 g']],
      facts: ['It is the only planet known to have liquid water on its surface, and the only place we know of with life.',
        'At the equator, the ground carries you around at about 1,670 km/h.',
        'It isn’t a perfect sphere: its spin makes it bulge slightly at the equator.',
        'Earth’s axis is tilted about 23.4°, which is why we have seasons.'] },

    { id: 'moon', name: 'The Moon', kind: 'Earth’s moon', group: 'moon', diameter: 3474,
      tag: 'The only other world people have walked on.',
      look: { type: 0, c1: [0.74, 0.73, 0.71], c2: [0.40, 0.40, 0.41], c3: [0, 0, 0], spin: 0.08, tilt: 0.1, glow: 0, mare: 1 },
      stats: [['Diameter', '3,474 km'], ['Distance', '384,400 km from Earth'], ['Orbit', '27.3 days'], ['Gravity', '0.17 g']],
      facts: ['It is tidally locked, so the same side always faces Earth.',
        'Twelve people walked on it between 1969 and 1972, during the Apollo missions.',
        'It drifts about 3.8 cm farther from Earth every year.',
        'Total solar eclipses work because the Sun is about 400 times wider than the Moon, and also about 400 times farther away.'] },

    { id: 'mars', name: 'Mars', kind: 'Rocky planet', group: 'planet', diameter: 6779,
      tag: 'A cold desert with the tallest volcano we know.',
      look: { type: 3, c1: [0.80, 0.38, 0.18], c2: [0.42, 0.18, 0.10], c3: [1.0, 0.62, 0.45], spin: 0.15, tilt: 0.44, glow: 0.35 },
      stats: [['Diameter', '6,779 km'], ['Spin', '24.6 hours'], ['Orbit', '687 days'], ['Gravity', '0.38 g']],
      facts: ['Olympus Mons, the tallest volcano in the Solar System, rises about 22 km, roughly two and a half times the height of Everest.',
        'Sunsets on Mars look blue, because its fine dust scatters blue light forward toward the Sun’s direction.',
        'Valles Marineris is a canyon system about 4,000 km long.',
        'It has two small, lumpy moons, Phobos and Deimos.'] },

    { id: 'jupiter', name: 'Jupiter', kind: 'Gas giant', group: 'planet', diameter: 139820,
      tag: 'The giant, with a storm bigger than Earth.',
      look: { type: 4, c1: [0.88, 0.76, 0.60], c2: [0.62, 0.40, 0.26], c3: [0.95, 0.85, 0.70], spin: 0.22, tilt: 0.05, glow: 0.35, spot: 1 },
      stats: [['Diameter', '139,820 km'], ['Spin', '9.9 hours'], ['Orbit', '11.9 years'], ['Gravity', '2.53 g']],
      facts: ['It has the shortest day of any planet, spinning once in under 10 hours.',
        'About 1,300 Earths could fit inside it.',
        'The Great Red Spot is a storm wider than Earth that has been observed for well over 150 years.',
        'It is more than twice as massive as all the other planets combined.'] },

    { id: 'saturn', name: 'Saturn', kind: 'Gas giant', group: 'planet', diameter: 116460,
      tag: 'Lighter than water, wrapped in rings of ice.',
      look: { type: 4, c1: [0.93, 0.85, 0.64], c2: [0.76, 0.64, 0.44], c3: [0.95, 0.90, 0.75], spin: 0.2, tilt: 0.0, glow: 0.3, rings: 1, ringC: [0.86, 0.78, 0.62] },
      stats: [['Diameter', '116,460 km'], ['Spin', '10.7 hours'], ['Orbit', '29.4 years'], ['Gravity', '1.07 g']],
      facts: ['Its average density is lower than water, so it would float in a big enough bathtub.',
        'Its rings are mostly chunks of water ice, from tiny grains to pieces as big as houses.',
        'The main rings span about 280,000 km, yet are typically only about 10 metres thick.',
        'Its moon Titan is bigger than the planet Mercury.'] },

    { id: 'uranus', name: 'Uranus', kind: 'Ice giant', group: 'planet', diameter: 50724,
      tag: 'Knocked on its side, rolling around the Sun.',
      look: { type: 5, c1: [0.62, 0.86, 0.88], c2: [0.50, 0.76, 0.80], c3: [0.60, 0.92, 1.0], spin: 0.18, tilt: 1.71, glow: 0.6 },
      stats: [['Diameter', '50,724 km'], ['Spin', '17.2 hours'], ['Orbit', '84 years'], ['Gravity', '0.89 g']],
      facts: ['It is tipped on its side, with an axial tilt of about 98°.',
        'Each pole gets about 42 years of continuous sunlight, followed by 42 years of darkness.',
        'It was the first planet discovered with a telescope, by William Herschel in 1781.',
        'It has the coldest atmosphere of any planet, dipping to about −224 °C.'] },

    { id: 'neptune', name: 'Neptune', kind: 'Ice giant', group: 'planet', diameter: 49244,
      tag: 'Found with maths before anyone saw it.',
      look: { type: 5, c1: [0.20, 0.36, 0.86], c2: [0.12, 0.22, 0.62], c3: [0.40, 0.60, 1.0], spin: 0.18, tilt: 0.49, glow: 0.6, spot: 2 },
      stats: [['Diameter', '49,244 km'], ['Spin', '16.1 hours'], ['Orbit', '165 years'], ['Gravity', '1.14 g']],
      facts: ['Its winds are the fastest in the Solar System, reaching about 2,100 km/h.',
        'Its position was predicted mathematically from Uranus’s wobbles before it was first seen in 1846.',
        'One Neptune year lasts 165 Earth years: it completed its first full orbit since discovery in 2011.',
        'Its largest moon, Triton, orbits backwards and is slowly spiralling inward.'] },

    { id: 'pluto', name: 'Pluto', kind: 'Dwarf planet', group: 'dwarf', diameter: 2377,
      tag: 'Small, distant, and wearing a heart of ice.',
      look: { type: 11, c1: [0.78, 0.66, 0.55], c2: [0.45, 0.30, 0.22], c3: [0.95, 0.92, 0.88], spin: 0.1, tilt: 0.3, glow: 0.15 },
      stats: [['Diameter', '2,377 km'], ['Spin', '6.4 days'], ['Orbit', '248 years'], ['Gravity', '0.06 g']],
      facts: ['It was reclassified as a dwarf planet in 2006.',
        'Its famous “heart” is a vast region of nitrogen ice, seen up close by New Horizons in 2015.',
        'It is smaller than Earth’s Moon.',
        'Pluto and its moon Charon are tidally locked to each other, always showing each other the same face.'] },

    { id: 'europa', name: 'Europa', kind: 'Moon of Jupiter', group: 'moon', diameter: 3122,
      tag: 'An ice shell over a hidden ocean.',
      look: { type: 7, c1: [0.92, 0.88, 0.80], c2: [0.62, 0.34, 0.20], c3: [0.8, 0.85, 1.0], spin: 0.1, tilt: 0.05, glow: 0.15 },
      stats: [['Diameter', '3,122 km'], ['Orbit', '3.6 days around Jupiter'], ['Surface', '~ −160 °C'], ['Gravity', '0.13 g']],
      facts: ['Beneath its icy crust is a salty ocean that may hold about twice as much water as all of Earth’s oceans.',
        'That ocean makes it one of the most promising places to look for life beyond Earth.',
        'Its surface is one of the smoothest in the Solar System, crossed by long reddish cracks.',
        'NASA’s Europa Clipper spacecraft launched in 2024 to study it up close.'] },

    { id: 'titan', name: 'Titan', kind: 'Moon of Saturn', group: 'moon', diameter: 5150,
      tag: 'Rain, rivers and seas, all made of methane.',
      look: { type: 8, c1: [0.88, 0.62, 0.26], c2: [0.66, 0.42, 0.14], c3: [1.0, 0.72, 0.32], spin: 0.06, tilt: 0.1, glow: 1.0 },
      stats: [['Diameter', '5,150 km'], ['Orbit', '15.9 days around Saturn'], ['Surface', '~ −179 °C'], ['Gravity', '0.14 g']],
      facts: ['It is the only moon with a thick atmosphere, denser than Earth’s.',
        'It has rivers, lakes and seas, but they are filled with liquid methane and ethane.',
        'The Huygens probe landed there in 2005, the most distant landing ever made.',
        'It is larger than the planet Mercury.'] },

    { id: 'sgra', name: 'Sagittarius A*', kind: 'Supermassive black hole', group: 'extreme', diameter: 25000000,
      tag: 'The dark heart of the Milky Way.',
      look: { type: 9, c1: [1.0, 0.62, 0.25], c2: [1.0, 0.92, 0.75], c3: [1.0, 0.5, 0.2], spin: 0.4, tilt: 0.0, glow: 0 },
      stats: [['Mass', '~4 million Suns'], ['Distance', '~26,000 light-years'], ['Horizon', '~25 million km wide'], ['First image', '2022']],
      facts: ['It sits at the centre of our galaxy, about 26,000 light-years from Earth.',
        'It holds roughly the mass of 4 million Suns.',
        'The Event Horizon Telescope released the first image of its shadow in 2022.',
        'Stars close to it race around at thousands of kilometres per second, which is how its mass was measured.'] },

    { id: 'neutron', name: 'Neutron star', kind: 'Stellar remnant', group: 'extreme', diameter: 20,
      tag: 'More than a Sun’s mass, crushed into a city.',
      look: { type: 10, c1: [0.70, 0.85, 1.0], c2: [1.0, 1.0, 1.0], c3: [0.45, 0.65, 1.0], spin: 2.2, tilt: 0.0, glow: 1.2 },
      stats: [['Diameter', '~20 km'], ['Mass', '~1.4 Suns'], ['Spin', 'up to ~700 times a second'], ['Teaspoon', '~1 billion tonnes']],
      facts: ['It is the collapsed core of a massive star, packing more than our Sun’s mass into a ball about the size of a city.',
        'A teaspoon of its material would weigh about a billion tonnes on Earth.',
        'Some, called pulsars, sweep beams across space like lighthouses, up to hundreds of times a second.',
        'When two of them collided in 2017, astronomers detected both the gravitational waves and the light from the crash.'] },
  ];

  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uT; uniform float uRot; uniform int uType;
uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uRingC;
uniform float uTilt; uniform float uGlow; uniform float uRings; uniform float uSpot; uniform float uMare;

float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ v += a*noise(p); p = p*2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return v; }
vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
float craters(vec3 p){
  vec3 i = floor(p), f = fract(p); float res = 0.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z)), c = i + g;
    if (hash(c + 3.3) < 0.45) continue;
    vec3 o = vec3(hash(c), hash(c + 11.3), hash(c + 27.1));
    float d = length(g + o - f), rad = 0.18 + 0.3 * hash(c + 5.7);
    float bowl = smoothstep(rad, rad * 0.55, d);
    float rim = smoothstep(rad * 0.7, rad, d) * smoothstep(rad * 1.3, rad, d);
    res += -0.55 * bowl + 0.6 * rim;
  }
  return res;
}

vec3 surface(vec3 p, out float emissive){
  emissive = 0.0;
  float lat = p.y;
  if (uType == 0 || uType == 11) {                         // rocky, cratered
    float f = fbm(p * 3.0);
    vec3 c = mix(uC2, uC1, smoothstep(0.25, 0.8, f));
    c *= 1.0 + craters(p * 4.0) * 0.55 + craters(p * 9.0 + 3.0) * 0.35 + craters(p * 19.0 + 7.0) * 0.2;
    c *= 0.92 + 0.16 * noise(p * 40.0);
    if (uMare > 0.5) c *= 1.0 - 0.38 * smoothstep(0.52, 0.6, fbm(p * 1.4 + 7.0));
    if (uType == 11) {                                      // Pluto's heart
      vec3 h1 = normalize(vec3(0.15, -0.15, 1.0)), h2 = normalize(vec3(0.45, -0.05, 0.9));
      float heart = max(smoothstep(0.32, 0.26, distance(p, h1)), smoothstep(0.28, 0.22, distance(p, h2)));
      c = mix(c, uC3, heart * 0.9);
      c = mix(c, uC2 * 0.7, smoothstep(0.55, 0.7, fbm(p * 2.0 + 3.0)) * (1.0 - heart) * 0.6);
    }
    return c;
  }
  if (uType == 1) {                                          // thick cloud deck
    float w = fbm(p * 3.0 + vec3(uT * 0.03, 0.0, 0.0));
    float b = fbm(vec3(lat * 7.0 + w * 2.5, p.x * 1.5, p.z * 1.5));
    return mix(uC2, uC1, smoothstep(0.25, 0.75, b));
  }
  if (uType == 2) {                                          // Earth
    float land = smoothstep(0.47, 0.51, fbm(p * 2.1 + 4.0));
    vec3 ocean = uC2 * (0.75 + 0.5 * fbm(p * 6.0));
    vec3 ground = mix(uC1, vec3(0.62, 0.52, 0.34), smoothstep(0.45, 0.7, fbm(p * 5.0 + 2.0)));
    ground = mix(ground, vec3(0.5, 0.45, 0.32), smoothstep(0.25, 0.0, abs(lat) - 0.2) * 0.6);
    vec3 c = mix(ocean, ground, land);
    c = mix(c, vec3(0.95), smoothstep(0.80, 0.9, abs(lat) + (fbm(p * 6.0) - 0.5) * 0.12));
    vec3 cp = p; cp.xz = rot(cp.xz, uT * 0.03);
    float cl = smoothstep(0.52, 0.78, fbm(cp * 3.2 + 11.0));
    return mix(c, vec3(1.0), cl * 0.85);
  }
  if (uType == 3) {                                          // Mars
    float f = fbm(p * 3.0 + 1.0);
    vec3 c = mix(uC2, uC1, smoothstep(0.3, 0.7, f));
    c *= 0.9 + 0.2 * noise(p * 12.0);
    return mix(c, vec3(0.95, 0.93, 0.9), smoothstep(0.86, 0.93, abs(lat) + (fbm(p * 7.0) - 0.5) * 0.1));
  }
  if (uType == 4) {                                          // gas giant bands
    float w = fbm(p * vec3(2.0, 9.0, 2.0) + vec3(uT * 0.02, 0.0, 0.0)) - 0.5;
    float b1 = sin((lat + w * 0.12) * 26.0) * 0.5 + 0.5;
    float b2 = sin((lat + w * 0.25) * 9.0 + 1.0) * 0.5 + 0.5;
    vec3 c = mix(uC2, uC1, b1);
    c = mix(c, uC3, b2 * 0.35);
    c *= 0.92 + 0.16 * fbm(p * vec3(6.0, 30.0, 6.0));
    if (uSpot > 0.5) {
      vec3 sc = normalize(vec3(0.55, -0.36, 0.75));
      vec3 dd = p - sc;
      float e = length(dd * vec3(0.75, 1.9, 0.75));
      float swirl = fbm(dd * 14.0) * 0.06;
      c = mix(c, vec3(0.78, 0.34, 0.20), smoothstep(0.17 + swirl, 0.11, e));
      c = mix(c, vec3(0.95, 0.85, 0.7), smoothstep(0.012, 0.0, abs(e - 0.19)) * 0.5);
    }
    return c;
  }
  if (uType == 5) {                                          // ice giant
    float w = fbm(p * 3.0 + vec3(uT * 0.015, 0.0, 0.0));
    vec3 c = mix(uC2, uC1, 0.5 + 0.5 * sin(lat * 10.0 + w * 3.0) * 0.35);
    if (uSpot > 1.5) {
      vec3 sc = normalize(vec3(0.3, -0.35, 0.88));
      float e = length((p - sc) * vec3(0.8, 1.6, 0.8));
      c = mix(c, uC2 * 0.45, smoothstep(0.14, 0.09, e));
      c = mix(c, vec3(0.9, 0.95, 1.0), smoothstep(0.03, 0.0, abs(length((p - normalize(vec3(0.45, -0.18, 0.86))) * vec3(1.0, 3.0, 1.0)) - 0.03)) * 0.6);
    }
    return c;
  }
  if (uType == 6) {                                          // star surface
    vec3 q = p * 7.0 + vec3(0.0, uT * 0.05, 0.0);
    float g = fbm(q + fbm(q * 0.5 + uT * 0.03) * 2.0);
    emissive = 1.0;
    vec3 c = mix(uC1, uC2, smoothstep(0.3, 0.75, g)) * 1.6;
    c *= 1.0 - 0.6 * smoothstep(0.62, 0.68, fbm(p * 3.0 + 9.0)) * 0.5;
    return c;
  }
  if (uType == 7) {                                          // icy, cracked
    vec3 c = mix(uC1, uC1 * 0.82, fbm(p * 3.0));
    float l1 = abs(noise(p * 4.0) - 0.5), l2 = abs(noise(p * 7.0 + 3.0) - 0.5);
    float cracks = smoothstep(0.03, 0.0, l1) + smoothstep(0.02, 0.0, l2) * 0.7;
    c = mix(c, uC2, clamp(cracks, 0.0, 1.0) * 0.8);
    return mix(c, uC2 * 1.1, smoothstep(0.6, 0.75, fbm(p * 2.0 + 5.0)) * 0.35);
  }
  if (uType == 8) {                                          // hazy
    float f = fbm(p * 2.0 + vec3(uT * 0.01, 0.0, 0.0));
    return mix(uC2, uC1, 0.35 + f * 0.6 + lat * 0.08);
  }
  if (uType == 10) { emissive = 1.0; return mix(uC1, uC2, 0.6) * 2.0; }
  return uC1;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * min(uRes.x, uRes.y));
  vec3 col = vec3(0.0); float alpha = 0.0;

  if (uType == 9) {                                          // black hole: shadow, disk, lensed halo
    float R = 0.22;
    vec2 ru = rot(uv, -0.12);
    float r = length(ru);
    float ny = 0.985, nz = 0.17;
    float z = -(ru.y * ny) / nz;
    float dr = length(vec3(ru, z)) / R;
    float ang = atan(z, ru.x);
    float disk = smoothstep(1.6, 1.9, dr) * smoothstep(5.2, 2.4, dr);
    float swirl = 0.6 + 0.4 * fbm(vec3(dr * 3.0, ang * 2.0 - uT * 0.6 * (3.0 / dr), 1.0));
    float doppler = 1.0 + 0.75 * (-ru.x / max(dr * R, 0.001)) * 0.6;
    vec3 dcol = mix(uC1, uC2, smoothstep(3.5, 1.7, dr)) * disk * swirl * doppler * 1.6;
    float halo = exp(-abs(r - R * 1.55) * 32.0) * (0.9 + 0.4 * sin(atan(ru.y, ru.x) * 2.0 + 1.0) * 0.3);
    float lens = smoothstep(0.0, 0.08, ru.y) * exp(-abs(length(ru * vec2(1.0, 1.35)) - R * 2.1) * 18.0) * 0.8;
    bool front = z > 0.0;
    col = vec3(0.0);
    if (r < R * 1.42) { col = front ? dcol : vec3(0.0); alpha = 1.0; }
    else { col = dcol; }
    col += uC2 * halo * 1.1 + uC1 * lens * swirl;
    col = 1.0 - exp(-col * 1.4);
    alpha = max(alpha, clamp(max(max(col.r, col.g), col.b) * 1.3, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha);
    return;
  }

  float R = uRings > 0.5 ? 0.44 : (uType == 10 ? 0.16 : (uType == 6 ? 0.6 : 0.68));
  vec2 q = uv / R; float d2 = dot(q, q);
  vec3 L = normalize(vec3(-0.55, 0.35, 0.76));
  float sphereZ = -1e3;

  if (d2 < 1.0) {
    vec3 n = vec3(q, sqrt(1.0 - d2));
    sphereZ = n.z * R;
    vec3 p = n;
    p.xy = rot(p.xy, uTilt);
    p.xz = rot(p.xz, uRot);
    float em;
    vec3 s = surface(p, em);
    float diff = max(dot(n, L), 0.0);
    float lit = mix(0.035 + diff * 1.1, 0.55 + 0.45 * n.z, em);
    col = s * lit;
    if (uGlow > 0.0 && em < 0.5) col += uC3 * pow(1.0 - n.z, 2.5) * uGlow * (0.15 + diff * 0.9);
    if (uType == 8) col = mix(col, uC3 * (0.2 + diff), pow(1.0 - n.z, 1.5) * 0.6);
    alpha = 1.0;
  }
  float rr = sqrt(d2);
  if (rr >= 1.0 && uGlow > 0.0) {                           // atmosphere / corona
    float k = uType == 6 ? 3.0 : (uType == 10 ? 2.0 : 14.0);
    float g = exp(-(rr - 1.0) * k) * uGlow;
    if (uType == 6) g *= 0.75 + 0.25 * fbm(vec3(normalize(q) * 3.0, uT * 0.1));
    vec3 gc = uC3 * g;
    if (uType != 6 && uType != 10) { float side = max(dot(normalize(vec3(q, 0.0)), L), 0.0); gc *= 0.2 + side; }
    col += gc; alpha = max(alpha, clamp(g, 0.0, 1.0));
  }
  if (uType == 10) {                                         // pulsar beams
    vec2 dir = vec2(cos(uT * 2.2), sin(uT * 2.2) * 0.35);
    vec2 bu = rot(uv, 0.35);
    float along = dot(bu, normalize(dir)), across = abs(dot(bu, vec2(-normalize(dir).y, normalize(dir).x)));
    float beam = exp(-across * (14.0 + abs(along) * 10.0)) * smoothstep(0.1, 0.25, abs(along)) * exp(-abs(along) * 1.4);
    col += uC3 * beam * 1.6 + vec3(0.8, 0.9, 1.0) * beam * 0.5;
    alpha = max(alpha, clamp(beam * 1.5, 0.0, 1.0));
  }
  if (uRings > 0.5) {
    vec2 ru = rot(uv, -0.18);
    float ny = 0.94, nz = 0.34;
    float z = -(ru.y * ny) / nz;
    float r = length(vec3(ru, z)) / R;
    if (r > 1.22 && r < 2.35) {
      float band = 0.55 + 0.45 * sin(r * 46.0) * sin(r * 11.0 + 1.0);
      band *= smoothstep(0.015, 0.05, abs(r - 1.95));          // Cassini division
      band *= mix(0.5, 1.0, smoothstep(1.22, 1.5, r));
      float ra = band * smoothstep(1.22, 1.27, r) * smoothstep(2.35, 2.25, r) * 0.9;
      vec3 rc = mix(uRingC * 0.75, uRingC, sin(r * 7.0) * 0.5 + 0.5) * 0.95;
      vec3 ringPos = vec3(ru, z);
      float tl = dot(ringPos, L);
      float shadow = (tl < 0.0 && length(ringPos - L * tl) < R) ? 0.22 : 1.0;
      rc *= shadow;
      if (d2 >= 1.0 || z > sphereZ) { col = mix(col, rc, ra); alpha = max(alpha, ra); }
    }
  }
  if (uType == 6) col = 1.0 - exp(-col * 1.3);
  gl_FragColor = vec4(col * 1.0, alpha);
}`;

  ARV.createBodyRenderer = (canvas) => {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true, preserveDrawingBuffer: true });
    if (!gl) return null;
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(x)); return x; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }'));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p); gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uT', 'uRot', 'uType', 'uC1', 'uC2', 'uC3', 'uRingC', 'uTilt', 'uGlow', 'uRings', 'uSpot', 'uMare'].forEach((n) => (u[n] = gl.getUniformLocation(p, n)));
    return {
      gl,
      draw(body, t, extraRot) {
        const L = body.look;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(u.uRes, canvas.width, canvas.height);
        gl.uniform1f(u.uT, t);
        gl.uniform1f(u.uRot, t * L.spin + (extraRot || 0));
        gl.uniform1i(u.uType, L.type);
        gl.uniform3fv(u.uC1, L.c1); gl.uniform3fv(u.uC2, L.c2); gl.uniform3fv(u.uC3, L.c3);
        gl.uniform3fv(u.uRingC, L.ringC || [0, 0, 0]);
        gl.uniform1f(u.uTilt, L.tilt || 0); gl.uniform1f(u.uGlow, L.glow || 0);
        gl.uniform1f(u.uRings, L.rings || 0); gl.uniform1f(u.uSpot, L.spot || 0); gl.uniform1f(u.uMare, L.mare || 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  };
})();
