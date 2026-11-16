(function () {
  var c = document.getElementById('cartao');
  var P = [].slice.call(c.querySelectorAll('.page'));
  var n = P.length, A = -112, i = 0;
  var astro = document.getElementById('astro');
  var bv = document.getElementById('voltar'), bp = document.getElementById('proxima');
  var x0 = null, dir = 0, al = null, W = 440, fim = false;

  P.forEach(function (p, k) { p.style.zIndex = n - k; });

  // gira uma página em torno da lombada; --s controla a sombra da dobra
  function rot(el, deg, anim) {
    el.style.transition = anim ? '' : 'none';
    el.style.transform = 'rotateY(' + deg + 'deg)';
    el.style.setProperty('--s', Math.sin(Math.min(1, Math.abs(deg / A)) * Math.PI).toFixed(3));
  }
  function ui() {
    var pg = P[i], t = i / (n - 1);
    c.style.setProperty('--nav', pg.dataset.nav);
    astro.style.left = (t * 100) + '%';
    astro.style.bottom = (-7 + Math.sin(t * Math.PI) * 18) + 'px';
    astro.style.setProperty('--sol', pg.dataset.sol);
    astro.classList.toggle('lua', i === n - 1);
    bv.disabled = i === 0;
    if (D) D.forEach(function (d, k) { d.classList.toggle('at', k === i); });
    bp.textContent = i === n - 1 ? 'ler de novo' : 'próxima';
    P.forEach(function (p, k) { p.classList.toggle('on', k === i); p.setAttribute('aria-hidden', k === i ? 'false' : 'true'); p.inert = k !== i; });
    if (i > 0) c.classList.add('virou');
    if (vd) video();
    if (i === n - 1 && !fim) { fim = true; setTimeout(confete, 700); }
    if (i < n - 1) fim = false;
  }
  function go(k) {
    var ant = i; i = Math.max(0, Math.min(n - 1, k));
    if (i !== ant && navigator.vibrate) navigator.vibrate(6);
    P.forEach(function (p, j) { rot(p, j < i ? A : 0, true); });
    ui();
  }

  c.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    x0 = e.clientX; dir = 0; al = null; W = c.offsetWidth;
  });
  c.addEventListener('pointermove', function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0;
    if (!dir && Math.abs(dx) > 8) {
      dir = dx < 0 ? 1 : -1;
      al = dir > 0 ? P[i] : P[i - 1];
      if (!al || (dir > 0 && i === n - 1)) { al = null; x0 = null; return; }
      c.setPointerCapture(e.pointerId);
    }
    if (!al) return;
    var p = Math.min(1, Math.abs(dx) / (W * 0.8));
    rot(al, dir > 0 ? A * p : A * (1 - p), false);
  });
  function soltar(e) {
    if (x0 === null) return;
    if (al) go(i + (Math.abs(e.clientX - x0) > W * 0.18 ? dir : 0));
    else if (e.type === 'pointerup' && Math.abs(e.clientX - x0) < 8) toque(e);
    x0 = null; al = null; dir = 0;
  }
  // toque simples (como nos stories): borda direita avança, borda esquerda volta; toque no vídeo pausa/retoma
  function toque(e) {
    if (e.target.closest('.vid')) { if (vd.paused) tocaVideo(); else vd.pause(); return; }
    var r = c.getBoundingClientRect(), f = (e.clientX - r.left) / r.width;
    if (f > .6) go(i + 1); else if (f < .3) go(i - 1);
  }
  c.addEventListener('pointerup', soltar);
  c.addEventListener('pointercancel', soltar);

  bp.addEventListener('click', function () { go(i === n - 1 ? 0 : i + 1); });
  var fb = document.getElementById('festa');
  if (fb) fb.addEventListener('click', confete);
  bv.addEventListener('click', function () { go(i - 1); });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') go(i + 1);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(i - 1);
    if (e.key === 'Home') go(0);
    if (e.key === 'End') go(n - 1);
  });

  // confete leve em canvas (desligado com prefers-reduced-motion)
  var cv = document.getElementById('confete'), cx = cv.getContext('2d'), fl = [], raf = 0;
  var cores = ['#F2C14E', '#FFF1B0', '#B9822A', '#FFFFFF', '#E8D6A0', '#D4A02F'];
  function confete() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    cv.width = r.width * d; cv.height = r.height * d;
    for (var k = 0; k < 110; k++) fl.push({ x: r.width / 2, y: r.height * 0.72, vx: (Math.random() - .5) * 15, vy: -Math.random() * 15 - 6, s: 5 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - .5) * .4, c: cores[k % cores.length] });
    cancelAnimationFrame(raf);
    (function quadro() {
      cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, r.width, r.height);
      fl = fl.filter(function (f) { return f.y < r.height + 20; });
      fl.forEach(function (f) {
        f.vy += .35; f.vx *= .99; f.x += f.vx; f.y += f.vy; f.a += f.va;
        cx.save(); cx.translate(f.x, f.y); cx.rotate(f.a); cx.fillStyle = f.c; cx.fillRect(-f.s / 2, -f.s / 4, f.s, f.s / 2); cx.restore();
      });
      if (fl.length) raf = requestAnimationFrame(quadro);
    })();
  }

  // pontos: ir direto a uma página
  var pt = document.createElement('div'); pt.className = 'pontos';
  var D = P.map(function (p, k) {
    var d = document.createElement('button'); d.type = 'button'; d.className = 'ponto';
    d.setAttribute('aria-label', 'Página ' + (k + 1)); d.addEventListener('click', function () { go(k); });
    pt.appendChild(d); return d;
  });
  bv.parentNode.insertBefore(pt, bp);

  // música: usa music/musica.mp3 se existir; senão toca uma caixinha de música com o "Parabéns"
  var au = document.getElementById('musica'), sb = document.getElementById('som');
  var ac = null, mg = null, tm = 0, tocando = false, sint = false;
  var MEL = [[67,.75],[67,.25],[69,1],[67,1],[72,1],[71,2],[67,.75],[67,.25],[69,1],[67,1],[74,1],[72,2],
             [67,.75],[67,.25],[79,1],[76,1],[72,1],[71,1],[69,1],[77,.75],[77,.25],[76,1],[72,1],[74,1],[72,2]];
  function nota(m, t) {
    var f = 440 * Math.pow(2, (m - 69) / 12);
    [[1, .5], [2, .2], [3, .07]].forEach(function (h, k) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = f * h[0];
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(h[1], t + .006);
      g.gain.exponentialRampToValueAtTime(.0001, t + (k ? .9 : 1.8));
      o.connect(g); g.connect(mg); o.start(t); o.stop(t + 1.9);
    });
  }
  function laco() {
    if (!tocando || !sint) return;
    var t = ac.currentTime + .15;
    MEL.forEach(function (n) { nota(n[0], t); t += n[1] * .7; });
    tm = setTimeout(laco, (t - ac.currentTime + 1.2) * 1000);
  }
  function sintetiza() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !tocando) return;
    sint = true; clearTimeout(tm);
    if (!ac) { ac = new AC(); mg = ac.createGain(); mg.gain.value = .35; mg.connect(ac.destination); }
    ac.resume(); laco();
  }
  function musica(on) {
    tocando = on; sb.setAttribute('aria-pressed', on ? 'true' : 'false'); c.classList.add('tocou');
    sb.setAttribute('aria-label', on ? 'Pausar música' : 'Tocar música');
    if (on) {
      au.volume = .6;
      var p = au.play();
      if (p && p.catch) p.catch(sintetiza); else sintetiza();
    } else {
      au.pause(); sint = false; clearTimeout(tm); if (ac) ac.suspend();
    }
  }
  sb.addEventListener('click', function () { musica(!tocando); });
  document.addEventListener('visibilitychange', function () {
    if (!tocando) return;
    if (document.hidden) { au.pause(); clearTimeout(tm); if (ac) ac.suspend(); } else musica(true);
  });

  // vídeo da página 5: começa mudo ao chegar, o som é por toque; a música de fundo pausa enquanto o vídeo fala
  var vd = document.getElementById('video'), vb = document.getElementById('vsom'), voltaMusica = false;
  var vp = document.getElementById('vplay'), vf = vd.parentNode, naPag = false;
  vd.muted = true;
  function tocaVideo() { var r = vd.play(); if (r && r.catch) r.catch(function () {}); }
  function vsom(on) {
    vd.muted = !on; vb.textContent = on ? '🔊' : '🔇'; vb.setAttribute('aria-pressed', on ? 'true' : 'false');
    vb.setAttribute('aria-label', on ? 'Silenciar o vídeo' : 'Ligar o som do vídeo');
    if (on && tocando) { voltaMusica = true; musica(false); }
    if (!on && voltaMusica) { voltaMusica = false; musica(true); }
  }
  // ao abrir a página 5 o vídeo recomeça e toca; ao sair, pausa. Se o celular bloquear, aparece o botão ▶
  function video() {
    var pag = P[i].contains(vd);
    if (pag && !document.hidden) { if (!naPag) vd.currentTime = 0; tocaVideo(); }
    else { vd.pause(); if (!vd.muted) vsom(false); }
    naPag = pag;
  }
  function estado() { vf.classList.toggle('pausado', vd.paused); }
  ['play', 'playing', 'pause', 'ended'].forEach(function (ev) { vd.addEventListener(ev, estado); });
  vp.addEventListener('click', tocaVideo);
  estado();
  vb.addEventListener('click', function () { vsom(vd.muted); if (vd.paused) tocaVideo(); });
  document.addEventListener('visibilitychange', video);

  go(0);
})();
