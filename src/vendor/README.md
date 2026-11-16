# Vendored runtime libraries

- Three.js 0.170.0: npm `three@0.170.0`, MIT; license retained. GLTFLoader, OrbitControls and BufferGeometryUtils imports point to sibling files to avoid a bundler/import map.
- GSAP + ScrollTrigger 3.12.5: npm `gsap@3.12.5`; original license notices in minified distribution files and package README retained. Licensing: https://gsap.com/standard-license/.

Packages downloaded with npm's normal integrity/TLS verification. No installation or build is needed to use these static runtime files. Google Fonts stylesheet is the only remote font dependency; serif/sans-serif fallbacks remain available offline.
