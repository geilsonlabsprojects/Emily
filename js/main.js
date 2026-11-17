(function () {
  var c = document.getElementById('cartao');
  var P = [].slice.call(c.querySelectorAll('.page'));
  var n = P.length, A = -112, i = 0;
  var astro = document.getElementById('astro'), nv = c.querySelector('.nav');
  var bv = document.getElementById('voltar'), bp = document.getElementById('proxima');
  var x0 = null, dir = 0, al = null, W = 440, fim = false, abre = false;

  var desk = window.matchMedia('(min-width:701px) and (pointer:fine)');
  P.forEach(function (p, k) {
    p.style.zIndex = n - k;
    var sh = document.createElement('i'); sh.className = 'dobra'; sh.setAttribute('aria-hidden', 'true'); p.appendChild(sh); p._sh = sh;
  });

  // páginas presas a uma mola amortecida: partida e chegada suaves, seguem o dedo com leve atraso e mantêm o impulso ao soltar.
  // A sombra da dobra e a bolinha da linha acompanham o ângulo real a cada quadro (inclusive durante o arrasto).
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S = P.map(function (p) { return { a: 0, v: 0, to: 0, r: null, sh: p._sh }; }), arrasta = false, ak = -1, rf = 0, tq = 0;
  var hz = c.querySelector('.horizonte'), hw = 0;
  function medir() { hw = hz.offsetWidth; }
  window.addEventListener('resize', medir);
  function arranca() { if (!rf) { tq = performance.now(); rf = requestAnimationFrame(gira); } }
  function gira(t) {
    var dt = Math.max(.001, Math.min(.1, (t - tq) / 1000)), m = Math.ceil(dt / .01), h = dt / m, vivo = false, idx = 0;
    tq = t;
    P.forEach(function (el, k) {
      var s = S[k], kk = arrasta && k === ak ? 600 : 26;
      if (calmo || (Math.abs(s.to - s.a) < .4 && Math.abs(s.v) < 4)) {
        s.a = s.to; s.v = 0; el.classList.toggle('longe', Math.abs(k - i) > 1);
      } else {
        for (var q = 0; q < m; q++) {
          s.v += (kk * (s.to - s.a) - 2 * Math.sqrt(kk) * s.v) * h;
          var na = s.a + s.v * h;
          if (na > 0 || na < A) { na = Math.min(0, Math.max(A, na)); s.v = 0; }
          s.a = na;
        }
        vivo = true;
      }
      if (s.a !== s.r) {
        s.r = s.a; el.style.transform = 'rotateY(' + s.a.toFixed(2) + 'deg)';
        s.sh.style.opacity = Math.sin(Math.min(1, Math.abs(s.a / A)) * Math.PI).toFixed(3);
      }
      idx += Math.min(1, Math.abs(s.a / A));
    });
    astro.style.transform = 'translate(calc(' + (idx / (n - 1) * hw).toFixed(1) + 'px - 50%),-50%)';
    if (desk.matches) { c.style.setProperty('--r', (1 - idx / (n - 1)).toFixed(3)); c.style.setProperty('--l', (idx / (n - 1)).toFixed(3)); }
    rf = vivo ? requestAnimationFrame(gira) : 0;
  }
  function ui() {
    var pg = P[i], t = i / (n - 1);
    c.style.setProperty('--nav', pg.dataset.nav);
    astro.style.setProperty('--sol', pg.dataset.sol);
    astro.classList.toggle('lua', i === n - 1); nv.classList.toggle('fim', i === n - 1); ciclo(i === n - 1);
    bv.disabled = i === 0;
    if (D) D.forEach(function (d, k) { d.classList.toggle('at', k === i); });
    bp.textContent = i === n - 1 ? 'ler de novo' : 'próxima';
    P.forEach(function (p, k) { p.classList.toggle('on', k === i); p.setAttribute('aria-hidden', k === i ? 'false' : 'true'); p.inert = k !== i; if (Math.abs(k - i) <= 1) p.classList.remove('longe'); });
    if (i > 0) c.classList.add('virou');
    if (vd) { if (i >= 2 && vd.preload !== 'auto') { vd.preload = 'auto'; vd.load(); } video(); }
    if (i === n - 1 && !fim) { fim = true; setTimeout(confete, 700); }
    if (i < n - 1) fim = false;
  }
  function go(k) {
    if (abre) return;
    var ant = i; i = Math.max(0, Math.min(n - 1, k));
    if (i !== ant && navigator.vibrate) navigator.vibrate(6);
    var f1 = -1; // só a página de cima precisa aparecer girando; as de baixo ficam escondidas (menos peso)
    P.forEach(function (p, j) { var to = j < i ? A : 0; if (S[j].to !== to && f1 < 0) f1 = j; S[j].to = to; });
    if (f1 >= 0) P[f1].classList.remove('longe');
    arrasta = false; arranca();
    ui();
  }

  c.addEventListener('pointerdown', function (e) {
    if (abre || e.target.closest('button')) return;
    x0 = e.clientX; dir = 0; al = null; W = c.offsetWidth;
  });
  c.addEventListener('pointermove', function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0;
    if (!dir && Math.abs(dx) > 8) {
      dir = dx < 0 ? 1 : -1;
      ak = dir > 0 ? i : i - 1; al = P[ak];
      if (!al || (dir > 0 && i === n - 1)) { al = null; x0 = null; return; }
      c.setPointerCapture(e.pointerId);
    }
    if (!al) return;
    var p = Math.min(1, Math.abs(dx) / (W * 0.8));
    S[ak].to = dir > 0 ? A * p : A * (1 - p); arrasta = true; arranca();
  });
  function soltar(e) {
    if (x0 === null) return;
    arrasta = false;
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
  if (fb) fb.addEventListener('click', function () { confete(); });
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
  function confete(oy) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2), y0 = r.height * (typeof oy === 'number' ? oy : 0.72);
    if (cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
    for (var k = 0; k < 90; k++) {
      var an = -Math.PI / 2 + (Math.random() - .5) * 2.4, v = 300 + Math.random() * 520;
      fl.push({ x: r.width / 2, y: y0, vx: Math.cos(an) * v, vy: Math.sin(an) * v, s: 5 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - .5) * 9, c: cores[k % cores.length], t: 0, w: Math.random() * 6 });
    }
    if (raf) return;
    var t0 = performance.now();
    // física por tempo (não por quadro): mesma suavidade em telas de 60 e 120 Hz; cai devagar e some aos poucos
    raf = requestAnimationFrame(function quadro(t) {
      var dt = Math.max(0, Math.min(.034, (t - t0) / 1000)); t0 = t;
      cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, r.width, r.height);
      fl = fl.filter(function (f) { return f.t < 4 && f.y < r.height + 30; });
      fl.forEach(function (f) {
        f.t += dt; f.vx *= Math.pow(.2, dt); if (f.vy < 0) f.vy *= Math.pow(.25, dt);
        f.vy = Math.min(f.vy + 760 * dt, 230);
        f.x += (f.vx + Math.sin(f.t * 3 + f.w) * 26) * dt; f.y += f.vy * dt; f.a += f.va * dt;
        var co = Math.cos(f.a) * d, si = Math.sin(f.a) * d; cx.setTransform(co, si, -si, co, f.x * d, f.y * d); cx.globalAlpha = Math.max(0, Math.min(1, (4 - f.t) * 1.2)); cx.fillStyle = f.c; cx.fillRect(-f.s / 2, -f.s / 4, f.s, f.s / 2);
      });
      if (fl.length) raf = requestAnimationFrame(quadro); else { raf = 0; cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.clearRect(0, 0, cv.width, cv.height); cv.width = cv.height = 1; }
    });
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

  // bolo de aniversário (SVG) com m velinhas: usado na abertura (16) e no fim da linha (5)
  var CV = ['#FFF6DC', '#F2C14E', '#3b3b3f'], cb = false, tb = [];
  function bolo(m) {
    var v = '';
    for (var k = 0; k < m; k++) {
      var x = m === 1 ? 50 : 22 + k * 56 / (m - 1);
      v += '<g class="vela" transform="translate(' + x.toFixed(1) + ' 0)" style="--k:' + k + '"><rect x="-1.4" y="22" width="2.8" height="18" rx="1" fill="' + CV[k % 3] + '"/><path class="chama" d="M0 21c-2.4-2.4-2-5.2 0-8.5 2 3.3 2.4 6.1 0 8.5z"/></g>';
    }
    return '<svg class="bolo" viewBox="0 0 100 74" aria-hidden="true"><ellipse cx="50" cy="68" rx="47" ry="5" fill="#B9822A"/><rect x="12" y="38" width="76" height="28" rx="6" fill="#E1B544"/>' + v +
      '<path d="M12 44a6 6 0 0 1 6-6h64a6 6 0 0 1 6 6v3c-5 0-5 7-10 7s-5-6-10-6s-5 8-10 8s-5-7-10-7s-5 7-10 7s-5-8-10-8s-5 6-10 6h-6z" fill="#FFF6DC"/></svg>';
  }
  // fim da linha: bolo apagado, velinhas acendem, vira "16 anos", volta a ser bolo, repete
  astro.innerHTML = bolo(5) + '<span class="n16 ouro">16 anos</span>';
  function ciclo(on) {
    if (on === cb) return;
    cb = on; tb.forEach(clearTimeout); tb = [];
    astro.classList.remove('acesa', 'num');
    if (!on) return;
    (function volta() {
      tb.push(setTimeout(function () { astro.classList.add('acesa'); }, 1300));
      tb.push(setTimeout(function () { astro.classList.add('num'); }, 4800));
      tb.push(setTimeout(function () { astro.classList.remove('num', 'acesa'); }, 8000));
      tb.push(setTimeout(volta, 8000));
    })();
  }

  // sons da abertura (sintetizados, sem arquivos): pop por velinha subindo a escala, varredura mágica, acorde + estouro no "16"
  var sx = null, sg = null;
  function sxIni() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!sx) { sx = new AC(); sg = sx.createGain(); sg.gain.value = .55; sg.connect(sx.destination); }
    sx.resume();
  }
  function tom(f, t, d, v, ty) {
    var o = sx.createOscillator(), g = sx.createGain();
    o.type = ty || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(sg); o.start(t); o.stop(t + d + .05);
  }
  function ruido(t, d, v, f) {
    var b = sx.createBuffer(1, Math.ceil(sx.sampleRate * d), sx.sampleRate), a = b.getChannelData(0);
    for (var q = 0; q < a.length; q++) a[q] = (Math.random() * 2 - 1) * Math.pow(1 - q / a.length, 2);
    var s = sx.createBufferSource(), fl = sx.createBiquadFilter(), g = sx.createGain();
    s.buffer = b; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = .8; g.gain.value = v;
    s.connect(fl); fl.connect(g); g.connect(sg); s.start(t);
  }
  function varre(t, d, f1, f2, v) {
    var o = sx.createOscillator(), g = sx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + d * .7); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(sg); o.start(t); o.stop(t + d + .05);
  }
  function som(f) { if (sx && sx.state === 'running') f(sx.currentTime + .02); }
  function somVela(k) {
    som(function (t) {
      var m = 60 + [0, 2, 4, 7, 9][k % 5] + 12 * Math.floor(k / 5), f = 440 * Math.pow(2, (m - 69) / 12);
      tom(f, t, .45, .16); tom(f * 2, t, .15, .04, 'triangle');
    });
  }
  function somTitulo() { som(function (t) { tom(784, t, 1.2, .08, 'triangle'); tom(988, t + .12, 1.2, .07, 'triangle'); }); }
  function somVarre() { som(function (t) { varre(t, 1.2, 250, 1800, .14); ruido(t, 1.2, .06, 3200); }); }
  function somNum() {
    som(function (t) {
      ruido(t, .35, .4, 2500); tom(90, t, .3, .35);
      [84, 88, 91, 96, 100].forEach(function (m, k) { tom(440 * Math.pow(2, (m - 69) / 12), t + .05 + k * .07, 1.6, .1, 'triangle'); });
    });
  }
  function somEstouro() { som(function (t) { ruido(t, .3, .3, 2800); tom(70, t, .2, .2); }); }

  // abertura: bolo com velinhas até 16, bolo some, "16 anos" em confete; depois libera o cartão
  var ab = document.getElementById('abertura');
  function abertura() {
    if (!ab) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { ab.remove(); abre = false; P[0].classList.add('on'); return; }
    document.getElementById('bolo-g').innerHTML = bolo(16);
    var T = [];
    function em(ms, f) { T.push(setTimeout(f, ms)); }
    function solta() {
      T.forEach(clearTimeout); ab.classList.add('sai'); P[0].classList.add('on');
      setTimeout(function () { ab.remove(); abre = false; }, 950);
    }
    var gate = document.getElementById('abrir'), ini = false;
    function comeca() {
      if (ini) return; ini = true; gate.hidden = true; sxIni();
      em(150, function () { ab.classList.add('v1'); somTitulo(); });
      for (var k = 0; k < 16; k++) (function (k) { em(1280 + k * 130, function () { somVela(k); }); })(k);
      em(4800, function () { ab.classList.add('v2'); somVarre(); });
      em(5400, function () { ab.classList.add('v3'); confete(.5); somNum(); setTimeout(function () { confete(.5); somEstouro(); }, 400); });
      em(8400, solta);
    }
    gate.addEventListener('click', comeca);
    document.getElementById('pular').addEventListener('click', solta);
  }

  medir(); go(0);
  [].forEach.call(c.querySelectorAll('img'), function (im) { if (im.decode) im.decode().catch(function () {}); });
  if (ab) { abre = true; P[0].classList.remove('on'); }
  // espera as fontes (evita o título "pular" de uma fonte para outra) e então começa a abertura
  (function pronto(f) {
    var ok = false, vai = function () { if (!ok) { ok = true; f(); } };
    setTimeout(vai, 1600);
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('1em "Kaushan Script"'), document.fonts.load('1em Newsreader')]).then(vai, vai); else vai();
  })(abertura);
})();
