/* nib · punch-band shader field
 * ONE ShaderMaterial · additive ember particles over the deep-green band
 * file://-safe (plain script tag, no fetch, no ESM)
 * reduced-motion → single static frame
 * debug: window.__N = { scene, uniforms, pause(), play(), dispose() }
 */
(function () {
  if (!window.THREE) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("punch-canvas");
  var section = document.querySelector(".scream");
  if (!canvas || !section) return;

  var renderer = null, scene = null, camera = null, material = null, geometry = null;
  var raf = null, paused = false, running = false;
  var W = 0, H = 0;

  function fail(msg) { window.__NERR = (window.__NERR || "") + msg + "; "; }

  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 20);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    /* particle field · fixed world box x ±4, y ±2.2, z ±1.5 */
    var COUNT = reduced ? 3500 : (window.devicePixelRatio > 1 ? 8000 : 6000);
    var pos = new Float32Array(COUNT * 3);
    var phase = new Float32Array(COUNT);
    var speed = new Float32Array(COUNT);
    for (var i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() * 2 - 1) * 4.0;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 2.2;
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * 1.5;
      phase[i] = Math.random();
      speed[i] = 0.08 + Math.random() * 0.17;
    }
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));

    var VERT = [
      "attribute float aPhase;",
      "attribute float aSpeed;",
      "uniform float uTime;",
      "uniform vec2 uMouse;",
      "uniform float uMouseR;",
      "uniform float uPixelRatio;",
      "varying float vAlpha;",
      "varying float vTwinkle;",
      "void main() {",
      "  vec3 p = position;",
      /* rising ember: wrap 0..1 over time */
      "  float rise = mod(aPhase + uTime * aSpeed, 1.0);",
      "  p.y = mix(-2.4, 2.4, rise);",
      "  p.y += sin(uTime * 0.5 + aPhase * 6.2831) * 0.35;",
      /* gentle sway */
      "  p.x += sin(uTime * 0.4 + aPhase * 12.0) * 0.45;",
      "  p.z += cos(uTime * 0.3 + aPhase * 9.0) * 0.35;",
      /* mouse repulsion in world space */
      "  vec2 diff = p.xy - uMouse;",
      "  float d = length(diff);",
      "  float push = smoothstep(uMouseR, 0.0, d);",
      "  p.xy += normalize(diff + 0.0001) * push * 0.6;",
      "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
      "  float dist = length(mv.xyz);",
      "  float size = uPixelRatio * (34.0 / dist) * (0.55 + 0.45 * sin(uTime * 2.0 + aPhase * 20.0));",
      "  gl_PointSize = max(size, 1.0);",
      "  gl_Position = projectionMatrix * mv;",
      /* fade at band edges + twinkle */
      "  float edge = smoothstep(-2.3, -1.5, p.y) * smoothstep(2.3, 1.5, p.y);",
      "  float tw = 0.5 + 0.5 * sin(uTime * 3.0 + aPhase * 40.0);",
      "  vAlpha = edge * (0.25 + 0.75 * tw);",
      "  vTwinkle = tw;",
      "}"
    ].join("\n");

    var FRAG = [
      "uniform vec3 uColorA;",
      "uniform vec3 uColorB;",
      "varying float vAlpha;",
      "varying float vTwinkle;",
      "void main() {",
      "  vec2 uv = gl_PointCoord - 0.5;",
      "  float d = length(uv);",
      "  float a = smoothstep(0.5, 0.04, d) * vAlpha;",
      "  vec3 col = mix(uColorA, uColorB, vTwinkle);",
      "  gl_FragColor = vec4(col, a);",
      "}"
    ].join("\n");

    material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMouseR: { value: 1.6 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
        uColorA: { value: new THREE.Color(0x78e08c) },
        uColorB: { value: new THREE.Color(0xb9f5c6) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    function resize() {
      var r = section.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width));
      H = Math.max(1, Math.floor(r.height));
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    resize();
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(section);
    }

    /* mouse → world coords (x ±4, y ±2.2) */
    function onMove(e) {
      var r = section.getBoundingClientRect();
      var nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      var ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      material.uniforms.uMouse.value.set(nx * 4.0, ny * 2.2);
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
      material.uniforms.uTime.value = 1.7;   /* static poster frame */
      renderer.render(scene, camera);
    } else {
      start();
    }

    window.__N = {
      scene: scene,
      uniforms: material.uniforms,
      count: COUNT,
      pause: function () { paused = true; stop(); },
      play: function () { paused = false; if (!reduced) start(); },
      dispose: function () {
        stop();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      }
    };
  } catch (e) {
    fail(e.message);
  }
})();
