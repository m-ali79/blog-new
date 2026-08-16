/* nib · hero halftone shader — DeepSeek-Harness register
 * fullscreen fragment shader: dot-grid halftone on cool charcoal,
 * dots breathe slowly, cursor raises dots + acid-green glow lens.
 * ONE ShaderMaterial · file://-safe (no fetch, no ESM)
 * reduced-motion → static frame
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
      "uniform vec2 uMouse;",          /* NDC -1..1 */
      "uniform float uTime;",
      "uniform float uDrift;",          /* 0 = frozen (reduced motion) */

      "float hash(vec2 p) {",
      "  p = fract(p * vec2(123.34, 456.21));",
      "  p += dot(p, p + 45.32);",
      "  return fract(p.x * p.y);",
      "}",

      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / uRes;",
      "  float aspect = uRes.x / uRes.y;",
      "  vec2 guv = uv * vec2(aspect, 1.0);",
      "  vec2 muv = uMouse * 0.5 + 0.5;",
      "  muv.x *= aspect;",

      /* slow global drift keeps the grid alive */
      "  guv += vec2(uTime * 0.015, uTime * 0.011) * uDrift;",

      /* halftone grid, 70 cells across */
      "  float N = 70.0;",
      "  vec2 g = guv * N;",
      "  vec2 cell = fract(g) - 0.5;",
      "  vec2 id = floor(g);",

      /* per-dot breathing jitter (deterministic) */
      "  float h = hash(id + floor(uTime * 0.5) * 1.0);",
      "  float jx = (hash(id + 7.7) - 0.5) * 0.30;",
      "  float jy = (hash(id + 13.1) - 0.5) * 0.30;",
      "  vec2 c = cell - vec2(jx, jy);",

      /* cursor proximity → dot lift + green lens */
      "  float d = length(guv - muv);",
      "  float glow = exp(-d * d * 24.0);",

      "  float r = 0.26 * (0.30 + 0.70 * h);",
      "  r += glow * 0.42;",

      "  float dotv = smoothstep(r, r - 0.10, length(c));",

      /* palette: cool charcoal dots, acid-green glow lens */
      "  vec3 base  = vec3(0.085, 0.095, 0.100);",
      "  vec3 dotc  = vec3(0.155, 0.170, 0.165);",
      "  vec3 green = vec3(0.47, 0.88, 0.55);",
      "  vec3 col = mix(base, dotc, dotv);",
      "  col = mix(col, green, glow * (0.30 + 0.70 * dotv));",

      /* soft vignette — corners recede */
      "  float v = smoothstep(1.45, 0.35, length(guv - vec2(aspect * 0.5, 0.5)));",
      "  col *= 0.72 + 0.28 * v;",

      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");

    material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.2, 0.4) },
        uTime: { value: 0 },
        uDrift: { value: reduced ? 0 : 1 }
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
      var nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      var ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      material.uniforms.uMouse.value.set(nx, ny);
    }
    if (window.matchMedia("(pointer: fine)").matches) {
      section.addEventListener("pointermove", onMove);
    }

    var last = performance.now();
    function frame(now) {
      if (paused || !running) return;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      material.uniforms.uTime.value += dt;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function start() { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (!reduced && !paused) start();
    });

    if (reduced) {
      material.uniforms.uTime.value = 3.2;   /* static poster frame */
      renderer.render(scene, camera);
    } else {
      start();
    }

    window.__H = {
      uniforms: material.uniforms,
      move: function (nx, ny) { material.uniforms.uMouse.value.set(nx, ny); },
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
