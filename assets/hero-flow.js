/* nib · hero bg shader — SHAPE-faithful to DeepSeek register
 * ONE focal dotted ribbon (dot-matrix along a defined sine path),
 * soft glow behind it, CLEAN DARK NEGATIVE SPACE everywhere else.
 * green palette kept (colors were never the problem — shape was)
 * eased cursor lens · scroll drift · file://-safe · reduced-motion static
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
  var mouseTarget = new THREE.Vector2(0.75, 0.7);

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

      "float hash(vec2 p) {",
      "  p = fract(p * vec2(123.34, 456.21));",
      "  p += dot(p, p + 45.32);",
      "  return fract(p.x * p.y);",
      "}",

      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / uRes;",
      "  float aspect = uRes.x / uRes.y;",
      "  vec2 apos = uv * vec2(aspect, 1.0);",

      /* ── 1 · clean dark base — negative space is the design ── */
      "  vec3 baseDark = vec3(0.045, 0.070, 0.058);",
      "  vec3 baseMid  = vec3(0.075, 0.115, 0.092);",
      "  float vGrad = 1.0 - uv.y;",
      "  vec2 radial = apos - vec2(aspect * 0.5, 0.5);",
      "  float rGrad = smoothstep(1.1, 0.25, length(radial));",
      "  vec3 col = mix(baseDark, baseMid, clamp(vGrad * 0.4 + rGrad * 0.6, 0.0, 1.0));",

      /* ── 2 · ONE focal shape: a dotted ribbon on a defined path ── */
      "  float driftT = uTime * 0.05 + uScroll * 0.0006;",
      "  float driftX = uTime * 0.02 * uDrift;",

      /* the ribbon's center path: a gentle sine curve across the middle */
      "  vec2 center = vec2(0.50 * aspect, 0.56);",
      "  float pathY = center.y + sin((uv.x - 0.22) * 5.2 + driftT) * 0.075 * uDrift;",
      "  float dBand = abs(uv.y - pathY);",

      /* band mask: tight vertical falloff — a 2D ribbon, not a cloud */
      "  float bandMask = exp(-dBand * dBand * 160.0);",

      /* fade the ribbon at the horizontal ends (finite, focused object) */
      "  float spanFade = smoothstep(0.02, 0.16, uv.x) * smoothstep(0.98, 0.84, uv.x);",
      "  bandMask *= spanFade;",

      /* ── 3 · dot-matrix: dots live ON the ribbon, follow its path ── */
      "  vec2 pix = gl_FragCoord.xy;",
      "  vec2 cell = fract(pix / 13.0) - 0.5;",
      "  float ddot = smoothstep(0.36, 0.26, length(cell));",

      /* per-dot jitter + twinkle so the ribbon feels alive, not printed */
      "  vec2 id = floor(pix / 13.0);",
      "  float h = hash(id + floor(uTime * 0.6));",
      "  float twinkle = 0.55 + 0.45 * h;",

      "  vec3 dotGreen = vec3(0.35, 0.72, 0.48);",
      "  vec3 dotBright = vec3(0.55, 0.92, 0.66);",
      "  vec3 dotCol = mix(dotGreen, dotBright, twinkle);",
      "  col = mix(col, dotCol, ddot * bandMask * 0.5 * twinkle);",

      /* ── 4 · soft glow hugging the ribbon (atmospheric, blurred) ── */
      "  float glow = exp(-dBand * dBand * 26.0) * spanFade;",
      "  vec3 glowCol = vec3(0.28, 0.52, 0.38);",
      "  col = mix(col, glowCol, glow * 0.30);",

      /* ── 5 · cursor lens: green, eased by JS, small radius ── */
      "  vec2 m = uMouse * 0.5 + 0.5;",
      "  m.x *= aspect;",
      "  float md = length(apos - m);",
      "  float cursorGlow = exp(-md * md * 14.0);",
      "  col = mix(col, dotBright, cursorGlow * 0.35);",

      /* ── 6 · vignette — corners recede, content stays loud ── */
      "  float v = smoothstep(1.30, 0.42, length(apos - vec2(aspect * 0.5, 0.5)));",
      "  col *= 0.60 + 0.40 * v;",

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
      material.uniforms.uTime.value = 3.1;
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
