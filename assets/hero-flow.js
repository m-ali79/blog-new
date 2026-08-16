/* nib · hero bg shader — DeepSeek-Harness spec, faithful rebuild
 * deep slate-navy base · silver-white domain-warped glow blobs ·
 * density-modulated halftone dots · thin sine wave lines ·
 * eased cursor lens (acid green = brand accent) · scroll drift
 * ONE ShaderMaterial · file://-safe · reduced-motion → static
 * debug: window.__H = { uniforms, move(x,y), dispose() }
 */
(function () {
  if (!window.THREE) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("hero-canvas");
  var section = document.querySelector(".hero");
  if (!canvas || !section) return;

  var renderer = null, scene = null, camera = null, material = null;
  var raf = null, paused = false, running = false;
  var W = 0, H = 0;
  var mouseTarget = new THREE.Vector2(0.75, 0.72);

  function fail(msg) { window.__HERR = (window.__HERR || "") + msg + "; "; }

  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: false, antialias: false });
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var VERT = [
      "void main() {",
      "  gl_Position = vec4(position.xy, 0.0, 1.0);",
      "}"
    ].join("\n");

    var FRAG = [
      "precision highp float;",
      "uniform vec2 uRes;",
      "uniform vec2 uMouse;",
      "uniform float uTime;",
      "uniform float uScroll;",
      "uniform float uDrift;",
      "uniform float uCursorEnergy;",

      "float hash(vec2 p) {",
      "  p = fract(p * vec2(123.34, 456.21));",
      "  p += dot(p, p + 45.32);",
      "  return fract(p.x * p.y);",
      "}",
      "float noise(vec2 p) {",
      "  vec2 i = floor(p), f = fract(p);",
      "  f = f * f * (3.0 - 2.0 * f);",
      "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),",
      "             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);",
      "}",
      "float fbm(vec2 p) {",
      "  float v = 0.0, a = 0.5;",
      "  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }",
      "  return v;",
      "}",

      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / uRes;",
      "  float aspect = uRes.x / uRes.y;",
      "  vec2 apos = uv * vec2(aspect, 1.0);",           /* aspect-corrected */

      /* ── 1 · base: deep slate-navy, darker at bottom, center lift ── */
      "  vec3 baseDark = vec3(0.028, 0.045, 0.088);",
      "  vec3 baseMid  = vec3(0.070, 0.118, 0.196);",
      "  float vGrad = 1.0 - uv.y;",
      "  vec2 radial = apos - vec2(aspect * 0.5, 0.55);",
      "  float rGrad = smoothstep(0.95, 0.22, length(radial));",
      "  vec3 base = mix(baseDark, baseMid, clamp(vGrad * 0.45 + rGrad * 0.55, 0.0, 1.0));",

      /* ── 2 · glow blobs: domain-warped smoke, silver-white ── */
      "  vec2 drift = vec2(uTime * 0.014, uTime * 0.009 - uScroll * 0.00035) * uDrift;",
      "  vec2 q = apos * 2.1 + drift;",
      "  vec2 w1 = vec2(fbm(q), fbm(q + vec2(5.2, 1.3)));",
      "  vec2 r1 = vec2(fbm(q + w1 * 1.2 + vec2(1.7, 9.2)), fbm(q + w1 * 1.2 + vec2(8.3, 2.8)));",
      "  float blob = fbm(q + r1 * 0.8);",

      /* two gaussian windows: upper-right large, mid-left small */
      "  vec2 c1 = vec2(0.72, 0.20) * vec2(aspect, 1.0);",
      "  vec2 c2 = vec2(0.45, 0.60) * vec2(aspect, 1.0);",
      "  float g1 = exp(-pow(length(apos - c1) / 0.55, 2.0));",
      "  float g2 = exp(-pow(length(apos - c2) / 0.42, 2.0));",
      "  float glowMask = g1 * 0.80 + g2 * 0.90;",
      "  float glow = smoothstep(0.22, 0.68, blob) * glowMask;",

      "  vec3 silver = vec3(0.90, 0.93, 0.97);",
      "  vec3 col = base + silver * (glow * 0.46 + glowMask * 0.10);",

      /* ── 3 · halftone dots: ~14px pitch, density = glow field ── */
      "  vec2 pix = gl_FragCoord.xy;",
      "  vec2 cell = fract(pix / 14.0) - 0.5;",
      "  float ddot = smoothstep(0.34, 0.26, length(cell));",
      "  float density = smoothstep(0.10, 0.55, glow + glowMask * 0.18);",
      "  vec3 steel = vec3(0.55, 0.65, 0.78);",
      "  col = mix(col, steel, ddot * 0.16 * density);",

      /* ── 4 · sine wave lines: 2 thin strokes, low alpha ── */
      "  for (int i = 0; i < 2; i++) {",
      "    float fi = float(i);",
      "    float yBase = 0.42 + fi * 0.16;",
      "    float lineY = yBase + sin(uv.x * 7.0 * aspect + fi * 2.1 + uTime * 0.10 * uDrift) * 0.055;",
      "    float dline = abs(uv.y - lineY);",
      "    float stroke = smoothstep(0.0060, 0.0018, dline);",
      "    col = mix(col, vec3(0.55, 0.68, 0.84), stroke * 0.22);",
      "  }",

      /* ── 5 · cursor lens: acid green, eased by JS, small radius ── */
      "  vec2 m = uMouse * 0.5 + 0.5;",
      "  m.x *= aspect;",
      "  float md = length(apos - m);",
      "  float cursorGlow = exp(-md * md * 16.0) * uCursorEnergy;",
      "  col = mix(col, vec3(0.47, 0.88, 0.55), cursorGlow * 0.30);",

      /* ── 6 · vignette: corners recede to near-black ── */
      "  float v = smoothstep(1.35, 0.45, length(apos - vec2(aspect * 0.5, 0.5)));",
      "  col *= 0.72 + 0.28 * v;",

      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");

    material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: mouseTarget.clone() },
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uDrift: { value: reduced ? 0 : 1 },
        uCursorEnergy: { value: 0 }
      },
      depthWrite: false,
      depthTest: false
    });

    var plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    plane.frustumCulled = false;
    scene.add(plane);

    function resize() {
      var r = section.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width));
      H = Math.max(1, Math.floor(r.height));
      renderer.setSize(W, H, false);
      material.uniforms.uRes.value.set(W, H);
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(section);

    function onMove(e) {
      var r = section.getBoundingClientRect();
      mouseTarget.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1)
      );
      cursorEnergy = 1;                    /* movement activates the lens */
    }
    if (window.matchMedia("(pointer: fine)").matches) {
      section.addEventListener("pointermove", onMove);
    }

    function onScroll() {
      material.uniforms.uScroll.value = window.scrollY || window.pageYOffset || 0;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var last = performance.now();
    var cursorEnergy = 0;
    function frame(now) {
      if (paused || !running) return;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      material.uniforms.uTime.value += dt;
      var u = material.uniforms.uMouse.value;
      u.x += (mouseTarget.x - u.x) * (1 - Math.pow(0.001, dt));
      u.y += (mouseTarget.y - u.y) * (1 - Math.pow(0.001, dt));
      cursorEnergy *= Math.pow(0.02, dt);   /* fades to 0 at rest */
      material.uniforms.uCursorEnergy.value = cursorEnergy;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function start() { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (!reduced && !paused) start();
    });

    if (reduced) {
      material.uniforms.uTime.value = 3.1;
      renderer.render(scene, camera);
    } else {
      start();
    }

    window.__H = {
      uniforms: material.uniforms,
      move: function (nx, ny) { mouseTarget.set(nx, ny); cursorEnergy = 1; },
      pause: function () { paused = true; stop(); },
      play: function () { paused = false; if (!reduced) start(); },
      dispose: function () {
        stop();
        plane.geometry.dispose();
        material.dispose();
        renderer.dispose();
      }
    };
  } catch (e) {
    fail(e.message);
  }
})();
