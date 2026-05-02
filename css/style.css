/* =========================================================================
   COMBATE NEURAL v7 — DESIGN SYSTEM PREMIUM
   ========================================================================= */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --neon:#00ffa3;
  --neon-soft:#00d488;
  --neon2:#5ad9ff;
  --orange:#ffaa3a;
  --danger:#ff3b6f;
  --warn:#ffd83a;
  --bg:#060b1a;
  --bg2:#080e22;
  --bg3:#0c1430;
  --ink:#e6fff5;
  --ink-mute:#9ad9c0;
  --fz-3xs:.5rem;--fz-2xs:.563rem;--fz-xs:.625rem;--fz-sm:.75rem;--fz-md:.875rem;--fz-lg:1.125rem;
  --radius-s:2px;--radius:3px;--radius-l:6px;
  --sb-w:200px; --sb-w-collapsed:54px;
  --safe-top:env(safe-area-inset-top,0px);--safe-bot:env(safe-area-inset-bottom,0px);
}

@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
@keyframes neon-pulse{0%,100%{text-shadow:0 0 8px var(--neon),0 0 20px var(--neon)}50%{text-shadow:0 0 4px var(--neon)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes live-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}
@keyframes toast-in{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes view-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none !important;transition:none !important}body::after{display:none}}

html,body{height:100%;width:100%;overflow:hidden;
  background:radial-gradient(ellipse at 20% 20%,#0a1535 0%,#060b1a 40%,#08051a 100%);
  color:var(--neon);font-family:'Share Tech Mono',monospace;-webkit-font-smoothing:antialiased}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:998;
  background:repeating-linear-gradient(0deg,rgba(0,255,163,.012) 0,rgba(0,255,163,.012) 1px,transparent 1px,transparent 3px)}
body::after{content:'';position:fixed;left:0;right:0;height:60px;pointer-events:none;z-index:997;
  background:linear-gradient(to bottom,transparent,rgba(0,255,163,.035),transparent);animation:scanline 7s linear infinite}

.skip-link{position:absolute;left:-9999px;top:0;background:var(--neon);color:#000;padding:8px 12px;z-index:9999;font-weight:700}
.skip-link:focus{left:0}
:focus-visible{outline:2px solid var(--neon2);outline-offset:2px;border-radius:var(--radius)}

#root{display:flex;flex-direction:column;height:100%;width:100%;position:relative;z-index:2;
  padding-top:var(--safe-top);padding-bottom:var(--safe-bot)}

/* ───── TOPBAR ───── */
#topbar{display:flex;align-items:center;justify-content:space-between;padding:0 14px;height:50px;flex-shrink:0;
  background:linear-gradient(135deg,rgba(6,11,26,.98),rgba(10,16,40,.95));
  border-bottom:1px solid var(--neon);box-shadow:0 0 28px rgba(0,255,163,.18)}
#topbar-left{display:flex;align-items:center;gap:10px}
#topbar h1{font-family:'Orbitron',sans-serif;font-size:var(--fz-sm);font-weight:900;color:var(--neon);
  animation:neon-pulse 3s ease-in-out infinite;letter-spacing:.18em;line-height:1}
#version-badge{font-size:var(--fz-3xs);color:var(--neon2);letter-spacing:.1em;border:1px solid rgba(90,217,255,.4);
  padding:2px 7px;border-radius:var(--radius-s);background:rgba(90,217,255,.08)}
.mode-title{font-family:'Orbitron',sans-serif;font-size:var(--fz-2xs);color:var(--ink-mute);letter-spacing:.18em;
  margin-left:8px;padding-left:10px;border-left:1px solid rgba(0,255,163,.3);text-transform:uppercase}
#topbar-right{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:32px;padding:0 12px;
  background:rgba(0,255,163,.06);border:1px solid rgba(0,255,163,.4);border-radius:var(--radius);
  cursor:pointer;color:var(--neon);font-family:'Share Tech Mono',monospace;font-size:var(--fz-xs);
  letter-spacing:.07em;transition:all .15s;user-select:none;white-space:nowrap;text-transform:uppercase;font-weight:700}
.icon-btn:hover{background:rgba(0,255,163,.18);border-color:var(--neon);box-shadow:0 0 14px rgba(0,255,163,.4);transform:translateY(-1px)}
.icon-btn:active{transform:scale(.97)}
.icon-btn.active-mode{background:rgba(0,255,163,.25);border-color:var(--neon);box-shadow:0 0 18px rgba(0,255,163,.55)}
.icon-btn.primary-btn{background:rgba(0,255,163,.2);border-color:var(--neon);box-shadow:0 0 14px rgba(0,255,163,.4)}

/* ───── LAYOUT ───── */
#layout{flex:1;display:flex;overflow:hidden;min-height:0}

/* ───── SIDEBAR ───── */
#sidebar{width:var(--sb-w);flex-shrink:0;display:flex;flex-direction:column;
  background:linear-gradient(180deg,rgba(8,14,32,.96),rgba(6,11,26,.92));
  border-right:1px solid rgba(0,255,163,.25);transition:width .2s ease;overflow:hidden}
#sidebar.collapsed{width:var(--sb-w-collapsed)}
#sidebar.collapsed .sb-label,#sidebar.collapsed .sb-key,#sidebar.collapsed .sb-footer{display:none}
.sb-list{list-style:none;flex:1;padding:10px 6px;display:flex;flex-direction:column;gap:4px}
.sb-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--radius);
  cursor:pointer;color:var(--ink-mute);font-family:'Orbitron',sans-serif;font-size:var(--fz-xs);
  letter-spacing:.12em;text-transform:uppercase;transition:all .15s;border:1px solid transparent;font-weight:700}
.sb-item:hover{background:rgba(0,255,163,.08);color:var(--neon);border-color:rgba(0,255,163,.2)}
.sb-item.active{background:linear-gradient(135deg,rgba(0,255,163,.18),rgba(90,217,255,.08));
  color:var(--neon);border-color:var(--neon);box-shadow:0 0 14px rgba(0,255,163,.3),inset 0 0 8px rgba(0,255,163,.1)}
.sb-icon{font-size:18px;line-height:1;flex-shrink:0;width:22px;text-align:center}
.sb-label{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-key{font-size:var(--fz-3xs);background:rgba(0,255,163,.1);padding:2px 6px;border-radius:var(--radius-s);
  border:1px solid rgba(0,255,163,.3);font-family:'Share Tech Mono',monospace}
.sb-footer{padding:10px 14px;border-top:1px solid rgba(0,255,163,.15);font-size:var(--fz-3xs);
  color:var(--ink-mute);letter-spacing:.1em;text-align:center;line-height:1.6}
.sb-tag{color:var(--neon2);margin-top:3px;font-size:8px}
#sidebar-toggle{padding:0 8px;font-size:14px;height:32px;width:36px}

/* ───── MAIN AREA ───── */
#main-area{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;position:relative}
.view{flex:1;display:flex;overflow:hidden;min-height:0;animation:view-in .25s ease-out}
.view[hidden]{display:none !important}

/* ── VIEW: TREINO ── */
.view-train{flex-direction:row}
#arena-wrap{flex:1;min-width:0;min-height:0;display:flex;position:relative}
#arena{display:block;width:100%;height:100%}

#panel{width:300px;flex-shrink:0;display:flex;flex-direction:column;
  border-left:1px solid var(--neon);background:linear-gradient(180deg,rgba(6,11,26,.97),rgba(8,14,28,.95));
  overflow-y:auto;box-shadow:-4px 0 30px rgba(0,0,0,.4)}
#panel::-webkit-scrollbar{width:4px}
#panel::-webkit-scrollbar-thumb{background:rgba(0,255,163,.3);border-radius:2px}
.panel-header{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;
  background:rgba(0,255,163,.04);border-bottom:1px solid rgba(0,255,163,.2);flex-shrink:0;position:sticky;top:0;z-index:5;backdrop-filter:blur(6px)}
.panel-title{font-family:'Orbitron',sans-serif;font-size:var(--fz-3xs);font-weight:700;color:var(--neon);letter-spacing:.2em}
.panel-badge{display:inline-flex;align-items:center;gap:6px;font-size:var(--fz-3xs);color:var(--neon2);
  padding:2px 6px;border:1px solid rgba(90,217,255,.35);border-radius:var(--radius-s)}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--danger);
  animation:live-dot 1.4s ease-in-out infinite;box-shadow:0 0 6px var(--danger)}

.stats-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;
  background:rgba(0,255,163,.08);border-bottom:1px solid rgba(0,255,163,.15)}
.stat-cell{background:var(--bg2);padding:8px 10px;display:flex;flex-direction:column;gap:2px}
.stat-lbl{font-size:var(--fz-3xs);color:var(--ink-mute);text-transform:uppercase;letter-spacing:.1em}
.stat-val{font-family:'Orbitron',sans-serif;font-size:var(--fz-lg);font-weight:700;color:var(--neon);
  font-variant-numeric:tabular-nums;text-shadow:0 0 10px rgba(0,255,163,.35);line-height:1}
.stat-val.record{color:var(--warn);text-shadow:0 0 10px rgba(255,216,58,.35)}
.stat-val.danger-val{color:var(--danger)}

.section{padding:9px 14px;border-bottom:1px solid rgba(0,255,163,.1)}
.sec-label{font-size:var(--fz-3xs);color:var(--ink-mute);font-weight:700;text-transform:uppercase;
  letter-spacing:.15em;margin-bottom:7px;display:flex;align-items:center;gap:5px}
.sec-label::before{content:'';display:block;width:2px;height:9px;background:var(--neon);border-radius:1px;box-shadow:0 0 5px var(--neon)}
.none-msg{font-size:var(--fz-2xs);color:rgba(154,217,192,.55)}

/* TELEMETRIA */
#telemetry-spark{width:100%;height:54px;display:block;background:rgba(0,0,0,.3);border-radius:var(--radius);border:1px solid rgba(0,255,163,.15)}
.telemetry-sum{display:flex;gap:6px;font-size:var(--fz-3xs);color:var(--ink-mute);margin-top:6px;flex-wrap:wrap}
.telemetry-sum b{color:var(--neon);font-family:'Orbitron',sans-serif}

/* PER CLASS BARS */
.pcb-row{display:grid;grid-template-columns:10px 60px 1fr 70px;gap:6px;align-items:center;margin-bottom:4px}
.pcb-dot{width:8px;height:8px;border-radius:50%}
.pcb-name{font-size:var(--fz-3xs);color:var(--ink-mute);letter-spacing:.05em}
.pcb-bg{background:rgba(0,255,163,.08);height:5px;border-radius:1px;overflow:hidden}
.pcb-fill{height:100%;width:0;transition:width .3s;box-shadow:0 0 6px currentColor}
.pcb-val{font-size:var(--fz-3xs);text-align:right;font-family:'Orbitron',sans-serif;font-variant-numeric:tabular-nums}

#weights-wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}
.weight-cell{background:rgba(0,255,163,.04);border:1px solid rgba(0,255,163,.2);border-radius:var(--radius);padding:4px;text-align:center}
.weight-lbl{font-size:var(--fz-3xs);color:var(--ink-mute)}
.weight-val{font-family:'Orbitron',sans-serif;font-size:var(--fz-sm);font-weight:700;color:var(--neon)}

#weight-heatmap{display:grid;grid-template-columns:60px repeat(4,1fr);gap:2px;font-family:'Orbitron',sans-serif;font-size:var(--fz-3xs)}
.hm-cell{padding:4px 0;text-align:center;border-radius:var(--radius-s);font-weight:700;color:#04140d}
.hm-row-lbl{padding:4px 6px;color:var(--ink-mute);font-size:var(--fz-3xs);display:flex;align-items:center;gap:4px;text-transform:uppercase}
.hm-row-lbl .dot{width:6px;height:6px;border-radius:50%;display:inline-block}
.heatmap-legend{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:var(--fz-3xs);color:var(--ink-mute)}
.heatmap-bar{flex:1;height:5px;border-radius:2px;background:linear-gradient(to right,#ff3b6f,#1a2030,#00ffa3)}

#chart-wrap{padding:0 14px 8px;border-bottom:1px solid rgba(0,255,163,.1)}
#chart-label{font-size:var(--fz-3xs);color:var(--ink-mute);text-transform:uppercase;letter-spacing:.12em;margin-bottom:4px}
#chart{width:100%;height:50px;display:block}

.hsv-row{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}
.hsv-cell{background:rgba(0,255,163,.04);border:1px solid rgba(0,255,163,.2);border-radius:var(--radius-s);padding:4px;text-align:center}
.hsv-lbl{font-size:var(--fz-3xs);color:var(--ink-mute)}
.hsv-val{font-family:'Orbitron',sans-serif;font-size:var(--fz-sm);font-weight:700;color:var(--neon)}

.decision-box{border-radius:var(--radius);padding:8px 10px;background:rgba(0,255,163,.05);border:1px solid rgba(0,255,163,.25);margin-bottom:7px;transition:all .2s}
.dec-name{font-family:'Orbitron',sans-serif;font-size:var(--fz-xs);font-weight:700;color:var(--neon)}
.dec-sub{font-size:var(--fz-3xs);color:var(--ink-mute);margin-top:2px}
.dec-margin{font-size:var(--fz-3xs);color:var(--ink-mute);margin-top:4px;font-style:italic}
.conf-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px}
.conf-label{font-size:var(--fz-3xs);color:var(--ink-mute)}
.conf-pct{font-family:'Orbitron',sans-serif;font-size:var(--fz-xs);font-weight:700;color:var(--neon)}
.bar-bg{background:rgba(0,255,163,.08);border-radius:1px;height:3px;overflow:hidden}
.bar-fill{height:100%;border-radius:1px;transition:width .15s}

.bar-group{margin-bottom:4px}
.bar-header{display:flex;justify-content:space-between;margin-bottom:2px}
.bar-name{font-size:var(--fz-3xs);color:var(--ink-mute);display:flex;align-items:center;gap:4px}
.bar-dot{width:5px;height:5px;border-radius:50%;display:inline-block}
.bar-pct{font-family:'Orbitron',sans-serif;font-size:var(--fz-3xs);font-weight:700;color:var(--neon)}

.log-header{display:flex;justify-content:space-between;align-items:center;padding:7px 14px;
  border-bottom:1px solid rgba(0,255,163,.1);background:rgba(0,255,163,.03)}
.log-clear{font-size:var(--fz-3xs);color:var(--ink-mute);cursor:pointer;background:none;border:none;font-family:inherit}
.log-clear:hover{color:var(--neon)}
.log-wrap{padding:3px 14px;font-size:var(--fz-3xs);max-height:120px;overflow-y:auto}
.log-entry{display:flex;gap:5px;padding:2px 0;border-bottom:1px solid rgba(0,255,163,.05);line-height:1.3}
.log-time{color:var(--ink-mute);font-variant-numeric:tabular-nums;min-width:30px}

/* ════════ SALA DE AULA ════════ */
.view-class{flex-direction:column}
#class-banner{flex-shrink:0;padding:10px 20px;
  background:linear-gradient(135deg,rgba(0,255,163,.12),rgba(90,217,255,.06));
  border-bottom:2px solid var(--neon);display:flex;align-items:center;gap:14px;
  box-shadow:0 0 30px rgba(0,255,163,.25)}
#class-banner h2{font-family:'Orbitron',sans-serif;font-size:var(--fz-md);font-weight:900;color:var(--neon);letter-spacing:.22em;text-shadow:0 0 20px var(--neon)}
#class-speed-badge{font-size:var(--fz-2xs);color:var(--warn);border:1px solid var(--warn);padding:3px 10px;border-radius:var(--radius-s);background:rgba(255,216,58,.08);animation:blink 1.5s ease-in-out infinite}
#class-body{flex:1;display:grid;grid-template-columns:1fr 420px;overflow:hidden;min-height:0}
#class-arena-col{position:relative;display:flex;flex-direction:column;overflow:hidden}
#class-arena-header{flex-shrink:0;padding:6px 14px;background:rgba(0,255,163,.04);border-bottom:1px solid rgba(0,255,163,.12);font-size:var(--fz-2xs);color:var(--ink-mute);display:flex;justify-content:space-between}
#class-arena-inner{flex:1;position:relative;overflow:hidden}
#class-right{border-left:1px solid rgba(0,255,163,.2);overflow-y:auto;background:rgba(6,11,26,.95)}
#class-right::-webkit-scrollbar{width:4px}
#class-right::-webkit-scrollbar-thumb{background:rgba(0,255,163,.3)}
#class-step-box{padding:14px 18px;background:linear-gradient(135deg,rgba(0,255,163,.08),rgba(90,217,255,.04));border-bottom:1px solid rgba(0,255,163,.2)}
#class-step-num{font-size:var(--fz-3xs);color:var(--ink-mute);letter-spacing:.18em;margin-bottom:5px;font-family:'Orbitron',sans-serif}
#class-step-title{font-family:'Orbitron',sans-serif;font-size:var(--fz-md);font-weight:700;color:var(--neon);margin-bottom:6px;line-height:1.3}
#class-step-desc{font-size:var(--fz-sm);color:var(--ink);line-height:1.7;white-space:pre-line}
#class-step-formula{margin-top:8px;padding:8px 12px;background:rgba(0,0,0,.4);border-left:3px solid var(--neon2);border-radius:var(--radius-s);font-size:var(--fz-xs);color:var(--neon2);font-family:'Orbitron',sans-serif;line-height:1.7;white-space:pre-line}

/* MATH LIVE */
#math-live{display:flex;flex-direction:column;gap:10px}
.ml-section{background:rgba(0,0,0,.3);border:1px solid rgba(0,255,163,.15);border-radius:var(--radius);padding:8px 10px}
.ml-label{font-size:var(--fz-3xs);color:var(--neon);font-family:'Orbitron',sans-serif;letter-spacing:.12em;margin-bottom:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.ml-eq{color:var(--neon2);font-family:'Share Tech Mono',monospace;font-size:var(--fz-3xs);background:rgba(90,217,255,.08);padding:2px 5px;border-radius:var(--radius-s);letter-spacing:0;text-transform:none}
.ml-row{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.ml-x-cell{padding:6px 4px;border-radius:var(--radius-s);text-align:center;border:1px solid rgba(0,255,163,.2);background:rgba(0,255,163,.03);transition:all .25s}
.ml-x-lbl{font-size:var(--fz-3xs);color:var(--ink-mute);font-family:'Orbitron',sans-serif}
.ml-x-val{font-size:var(--fz-xs);color:var(--ink);font-family:'Orbitron',sans-serif;font-weight:700}
.ml-matrix{display:grid;grid-template-columns:50px repeat(4,1fr);gap:1px;background:rgba(0,255,163,.1);padding:1px;border-radius:var(--radius-s)}
.ml-W-hd,.ml-W-lbl{background:var(--bg);padding:4px;font-size:var(--fz-3xs);color:var(--ink-mute);text-align:center;font-family:'Orbitron',sans-serif;display:flex;align-items:center;justify-content:center;gap:3px}
.ml-W-lbl{justify-content:flex-start;padding-left:6px}
.ml-W-dot{width:6px;height:6px;border-radius:50%;display:inline-block}
.ml-W-cell{background:var(--bg2);padding:4px;text-align:center;font-size:var(--fz-3xs);font-family:'Orbitron',sans-serif;font-weight:700;color:#04140d;transition:all .25s}
.ml-W-cell.winner{outline:1.5px solid var(--neon);outline-offset:-2px;animation:blink 1s ease-in-out infinite}
.ml-z-row{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.ml-z-cell{background:rgba(0,0,0,.4);border:1px solid;border-radius:var(--radius-s);padding:4px 2px;text-align:center}
.ml-z-lbl{font-size:7px;font-family:'Orbitron',sans-serif;font-weight:700;letter-spacing:.05em}
.ml-z-val{font-size:var(--fz-3xs);color:var(--ink);font-family:'Orbitron',sans-serif;margin-top:2px}
.ml-p-cell{display:grid;grid-template-columns:38px 1fr 30px;gap:5px;align-items:center;padding:3px 5px;border:1px solid;border-radius:var(--radius-s);margin-bottom:3px;background:rgba(0,0,0,.3);transition:all .25s}
.ml-p-cell.winner{background:rgba(0,255,163,.08);box-shadow:0 0 10px rgba(0,255,163,.25)}
.ml-p-name{font-size:var(--fz-3xs);font-family:'Orbitron',sans-serif;font-weight:700}
.ml-p-bar-bg{background:rgba(0,255,163,.05);height:6px;border-radius:1px;overflow:hidden}
.ml-p-bar-fill{height:100%;width:0;transition:width .3s}
.ml-p-pct{font-size:var(--fz-3xs);font-family:'Orbitron',sans-serif;font-weight:700;text-align:right}
.ml-decision{padding:8px 10px;border-radius:var(--radius);background:rgba(0,255,163,.08);border:1px solid rgba(0,255,163,.3);display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:var(--fz-xs)}
.ml-dec-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0}
.ml-dec-name{font-family:'Orbitron',sans-serif;font-weight:700;letter-spacing:.1em}
.ml-dec-conf{color:var(--ink-mute);font-size:var(--fz-3xs)}
.ml-dec-action{margin-left:auto;color:var(--neon2);font-size:var(--fz-3xs)}
.ml-dec-idle{color:var(--ink-mute);font-style:italic;font-size:var(--fz-3xs)}

#class-hsv-wrap,#class-activations,#class-decision{padding:12px 18px;border-bottom:1px solid rgba(0,255,163,.15)}
.class-hsv-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px}
.class-hsv-cell{background:rgba(0,255,163,.04);border:1px solid rgba(0,255,163,.2);border-radius:var(--radius);padding:8px;transition:all .25s;text-align:center}
.class-hsv-cell.lit{background:rgba(0,255,163,.12);border-color:var(--neon);box-shadow:0 0 14px rgba(0,255,163,.3)}
.class-hsv-lbl{font-size:var(--fz-3xs);color:var(--ink-mute)}
.class-hsv-val{font-family:'Orbitron',sans-serif;font-size:var(--fz-md);font-weight:700;color:var(--neon)}
.class-act-row{display:grid;grid-template-columns:14px 70px 1fr 36px;gap:6px;align-items:center;margin-bottom:5px}
.class-act-dot{width:10px;height:10px;border-radius:50%;box-shadow:0 0 6px currentColor}
.class-act-name{font-size:var(--fz-xs);color:var(--ink);letter-spacing:.08em;font-weight:700}
.class-act-bar-bg{background:rgba(0,255,163,.08);border-radius:1px;height:6px;overflow:hidden}
.class-act-bar{height:100%;border-radius:1px;transition:width .25s;box-shadow:0 0 6px currentColor}
.class-act-pct{font-family:'Orbitron',sans-serif;font-size:var(--fz-xs);font-weight:700;text-align:right}
#class-dec-box{padding:10px 14px;border-radius:var(--radius);background:rgba(0,255,163,.06);border:1px solid rgba(0,255,163,.25);transition:all .25s}
#class-dec-name{font-family:'Orbitron',sans-serif;font-size:var(--fz-md);font-weight:700;color:var(--neon);margin-bottom:4px}
#class-dec-rationale{font-size:var(--fz-xs);color:var(--ink);line-height:1.7;white-space:pre-line}
#class-footer{padding:10px 18px;background:rgba(0,0,0,.3);border-top:1px solid rgba(0,255,163,.15);
  display:flex;align-items:center;justify-content:space-between;font-size:var(--fz-3xs);color:var(--ink-mute);gap:8px;flex-wrap:wrap}
#class-step-nav{display:flex;gap:6px}
.nav-btn{cursor:pointer;padding:5px 12px;border:1px solid rgba(0,255,163,.4);border-radius:var(--radius-s);
  color:var(--neon);font-family:'Share Tech Mono',monospace;font-size:var(--fz-3xs);
  background:rgba(0,255,163,.06);transition:all .15s;font-weight:700}
.nav-btn:hover{background:rgba(0,255,163,.18)}
.nav-btn:disabled{opacity:.35;cursor:not-allowed}

/* ════════ COMPETIÇÃO ════════ */
.view-compete{flex-direction:column}
.compete-banner{flex-shrink:0;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;
  background:linear-gradient(135deg,rgba(255,170,58,.1),rgba(0,255,163,.05));
  border-bottom:2px solid var(--orange);box-shadow:0 0 20px rgba(255,170,58,.2)}
.compete-banner h2{font-family:'Orbitron',sans-serif;font-size:var(--fz-md);font-weight:900;
  background:linear-gradient(90deg,var(--neon),var(--orange));-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.18em}
#compete-body{flex:1;display:grid;grid-template-columns:1fr 340px;overflow:hidden;min-height:0}
#compete-arena-col{position:relative;overflow:hidden;display:flex}
#compete-arena-inner{flex:1;position:relative;overflow:hidden}
#compete-panel{border-left:1px solid rgba(0,255,163,.2);overflow-y:auto;background:rgba(6,11,26,.95);padding:14px;display:flex;flex-direction:column;gap:12px}
.comp-card{padding:12px;border-radius:var(--radius-l);border:1px solid rgba(0,255,163,.25);background:rgba(0,0,0,.4)}
.comp-card.comp-b{border-color:rgba(255,170,58,.4)}
.comp-card-head{display:flex;align-items:center;gap:8px;font-family:'Orbitron',sans-serif;font-size:var(--fz-xs);font-weight:700;letter-spacing:.1em;margin-bottom:8px}
.comp-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
.comp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center}
.comp-lbl{font-size:var(--fz-3xs);color:var(--ink-mute);letter-spacing:.1em;text-transform:uppercase}
.comp-val{font-family:'Orbitron',sans-serif;font-size:var(--fz-md);font-weight:700;color:var(--ink);margin-top:3px}
.comp-card.comp-a .comp-val{color:var(--neon)}
.comp-card.comp-b .comp-val{color:var(--orange)}
.comp-chart-wrap{padding:10px;border:1px solid rgba(0,255,163,.2);border-radius:var(--radius-l);background:rgba(0,0,0,.3)}
#compete-chart{width:100%;height:130px;display:block;margin-top:4px}
.comp-legend{display:flex;gap:14px;font-size:var(--fz-3xs);color:var(--ink-mute);margin-top:6px;justify-content:center}
.lg-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}
.comp-explain{padding:10px 12px;border-radius:var(--radius);background:rgba(90,217,255,.05);border:1px solid rgba(90,217,255,.2);font-size:var(--fz-xs);color:var(--ink);line-height:1.6}
.comp-explain strong{color:var(--neon2)}

/* ════════ VISÃO REAL ════════ */
.view-vision{flex-direction:column}
.vision-banner{flex-shrink:0;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;
  background:linear-gradient(135deg,rgba(90,217,255,.1),rgba(0,255,163,.05));
  border-bottom:2px solid var(--neon2);gap:12px;flex-wrap:wrap}
.vision-banner h2{font-family:'Orbitron',sans-serif;font-size:var(--fz-md);font-weight:900;color:var(--neon2);letter-spacing:.18em;text-shadow:0 0 12px var(--neon2)}
.vision-controls{display:flex;gap:6px;flex-wrap:wrap}
#vision-body{flex:1;display:grid;grid-template-columns:1fr 360px;overflow:hidden;min-height:0}
.vision-cam-wrap{position:relative;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden}
#vision-video{max-width:100%;max-height:100%;object-fit:contain}
.vision-crosshair{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.vc-box{width:120px;height:120px;border:2px dashed var(--neon);border-radius:var(--radius);box-shadow:0 0 20px rgba(0,255,163,.4),inset 0 0 20px rgba(0,255,163,.1)}
.vc-label{margin-top:10px;font-size:var(--fz-2xs);color:var(--neon);background:rgba(0,0,0,.7);padding:4px 10px;border-radius:var(--radius-s);letter-spacing:.1em}
.vision-panel{border-left:1px solid rgba(0,255,163,.2);overflow-y:auto;background:rgba(6,11,26,.95);padding:14px;display:flex;flex-direction:column;gap:12px}
.vision-status-bar{padding:8px 12px;background:rgba(0,255,163,.05);border:1px solid rgba(0,255,163,.2);border-radius:var(--radius);font-size:var(--fz-xs);color:var(--ink)}
.vision-readout{display:grid;grid-template-columns:80px 1fr;gap:12px;align-items:center}
.vision-swatch{width:80px;height:80px;border-radius:var(--radius-l);border:2px solid rgba(0,255,163,.4);box-shadow:0 0 16px rgba(0,0,0,.6),inset 0 0 12px rgba(0,0,0,.3);background:#000;transition:background .15s}
.vision-info{display:flex;flex-direction:column;gap:4px}
.vi-row{display:flex;justify-content:space-between;font-size:var(--fz-2xs)}
.vi-lbl{color:var(--ink-mute);letter-spacing:.1em}
.vi-val{color:var(--neon);font-family:'Orbitron',sans-serif;font-weight:700;font-variant-numeric:tabular-nums}
.vision-decision-box{padding:12px;border-radius:var(--radius);background:rgba(0,255,163,.06);border:2px solid rgba(0,255,163,.3);display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:var(--fz-sm);min-height:50px;transition:border-color .25s}
.vd-dot{width:18px;height:18px;border-radius:50%;flex-shrink:0}
.vd-name{font-family:'Orbitron',sans-serif;font-weight:900;letter-spacing:.12em;font-size:var(--fz-md)}
.vd-conf{color:var(--ink-mute);font-size:var(--fz-xs);margin-left:auto}
.vd-idle{color:var(--ink-mute);font-style:italic;font-size:var(--fz-xs)}
.vp-row{display:grid;grid-template-columns:10px 70px 1fr 40px;gap:6px;align-items:center;margin-bottom:5px}
.vp-dot{width:8px;height:8px;border-radius:50%}
.vp-name{font-size:var(--fz-3xs);color:var(--ink-mute);letter-spacing:.05em}
.vp-bg{background:rgba(0,255,163,.08);height:6px;border-radius:1px;overflow:hidden}
.vp-fill{height:100%;width:0;transition:width .15s}
.vp-pct{font-size:var(--fz-3xs);font-family:'Orbitron',sans-serif;font-weight:700;text-align:right}
.vision-hint{padding:10px 12px;border-radius:var(--radius);background:rgba(255,216,58,.05);border:1px solid rgba(255,216,58,.25);font-size:var(--fz-xs);color:var(--ink);line-height:1.6}
.vision-hint strong{color:var(--warn)}

/* Toast */
#toast{position:fixed;left:50%;top:60px;transform:translateX(-50%);background:rgba(6,11,26,.95);
  border:1px solid var(--neon);color:var(--neon);font-family:'Share Tech Mono',monospace;
  font-size:var(--fz-xs);padding:8px 14px;border-radius:var(--radius);z-index:9999;
  box-shadow:0 0 20px rgba(0,255,163,.4);max-width:90vw;text-align:center;
  pointer-events:none;opacity:0;transition:opacity .25s}
#toast.show{opacity:1;animation:toast-in .25s ease-out}

/* Responsivo */
@media (max-width:900px){
  #class-body,#compete-body,#vision-body{grid-template-columns:1fr}
  #class-right,#compete-panel,.vision-panel{border-left:none;border-top:1px solid rgba(0,255,163,.2);max-height:50vh}
  #panel{width:280px}
}
@media (max-width:640px){
  #topbar{height:auto;padding:6px 10px;flex-wrap:wrap;gap:6px}
  .mode-title{display:none}
  .icon-btn{height:28px;padding:0 8px;font-size:var(--fz-3xs)}
  #sidebar{width:var(--sb-w-collapsed)}
  #sidebar .sb-label,#sidebar .sb-key,#sidebar .sb-footer{display:none}
  .view-train{flex-direction:column}
  #arena-wrap{height:55vw;min-height:200px;flex:0 0 auto}
  #panel{width:100%;flex:1;border-left:none;border-top:1px solid var(--neon)}
}
