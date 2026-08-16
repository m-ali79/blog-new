/* nib · hero flow-field shader — DeepSeek-Harness register, v3 tuning
 * LOW intensity · consistent dotted pattern everywhere ·
 * tiny cursor lens with eased follow · gentle scroll drift
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
  var mouseTarget = new THREE.Vector2(0.2, 0.4);  /* eased toward */

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
      "uniform vec2 uMouse;",            /* NDC -1..1, eased by JS */
      "uniform float uTime;",
      "uniform float uScroll;",          /* scrollY px — gentle parallax */
      "uniform float uDrift;",           /* 0 = frozen (reduced motion) */

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
      "  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }",
      "  return v;",
      "}",

      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / uRes;",
      "  float aspect = uRes.x / uRes.y;",
      "  vec2 p = uv * vec2(aspect, 1.0) * 3.0;",

      /* very slow time + scroll drift — barely moving */
      "  p += vec2(uTime * 0.012, uTime * 0.008 - uScroll * 0.0004) * uDrift;",

      /* cursor lens: SMALL radius, SMALL push, eased by JS */
      "  vec2 m = uMouse * 0.5 + 0.5;",
      "  m.x *= aspect;",
      "  m *= 3.0;",
      "  vec2 dir = normalize(p - m + 0.0001);",
      "  float md = length(p - m);",
      "  float influence = exp(-md * md * 6.0) * 0.5;",
      "  p -= dir * influence * 0.35;",

      /* LOW-intensity domain warp — waves, not storms */
      "  vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));",
      "  vec2 r = vec2(fbm(p + q * 0.8 + vec2(1.7, 9.2)), fbm(p + q * 0.8 + vec2(8.3, 2.8)));",
      "  float f = fbm(p + r * 0.6);",

      /* palette: charcoal base, faint green waves */
      "  vec3 deep   = vec3(0.075, 0.085, 0.090);",
      "  vec3 green  = vec3(0.200, 0.380, 0.260);",
      "  vec3 bright = vec3(0.380, 0.680, 0.440);",
      "  vec3 col = mix(deep, green, smoothstep(0.42, 0.60, f) * 0.55);",
      "  col = mix(col, bright, smoothstep(0.62, 0.80, f) * 0.30);",

      /* CONSISTENT dotted pattern everywhere — small, low intensity */
      "  vec2 dotUV = uv * vec2(aspect, 1.0) * 46.0;",
      "  vec2 dc = fract(dotUV) - 0.5;",
      "  float ddot = smoothstep(0.32, 0.28, length(dc));",
      "  col = mix(col, vec3(0.300, 0.520, 0.360), ddot * 0.22);",

      /* faint contour lines */
      "  float contour = fract(f * 10.0);",
      "  float line = smoothstep(0.94, 1.0, contour);",
      "  col = mix(col, vec3(0.520, 0.780, 0.580), line * 0.16);",

      /* tiny cursor halo — the only bright spot */
      "  float glow = exp(-md * md * 9.0);",
      "  col = mix(col, bright, glow * 0.55);",

      /* vignette */
      "  float v = smoothstep(1.40, 0.40, length(uv * vec2(aspect, 1.0) - vec2(aspect * 0.5, 0.5)));",
      "  col *= 0.80 + 0.20 * v;",

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
      mouseTarget.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1)
      );
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
    function frame(now) {
      if (paused || !running) return;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      material.uniforms.uTime.value += dt;
      /* ease the cursor — smooth follow, no snap */
      var u = material.uniforms.uMouse.value;
      u.x += (mouseTarget.x - u.x) * (1 - Math.pow(0.001, dt));
      u.y += (mouseTarget.y - u.y) * (1 - Math.pow(0.001, dt));
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function start() { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (!reduced && !paused) start();
    });

    if (reduced) {
      material.uniforms.uTime.value = 2.4;   /* static poster frame */
      renderer.render(scene, camera);
    } else {
      start();
    }

    window.__H = {
      uniforms: material.uniforms,
      move: function (nx, ny) { mouseTarget.set(nx, ny); },
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
