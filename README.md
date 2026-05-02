# Combate Neural v6 — Premium Edition

Simulador interativo de visão computacional + rede neural adaptativa com **Sala de Aula** didática.
Reescrito a partir da v5 com foco em arquitetura, performance, acessibilidade e didática real de IA.

## 🚀 O que mudou (v5 → v6)

### 🐛 Bugs corrigidos
- `RESET` agora restaura o estado de `Pausar`.
- `scoreColor` agora usa **os 4 pesos reais** (H, S, V, Dist), não apenas 2.
- Faixa de **CIANO corrigida** (165–195°). Adicionada classe **LARANJA** (15–40°).
- `AudioContext` único, reaproveitado (sem vazar recursos).
- Blob URLs dos SVGs do robô são **revogados** após o load.
- `class-speed-badge` agora atualiza dinamicamente, dentro de `toggleTeacher`.

### 🧠 Rede neural didática REAL
- **Perceptron multi-classe**: matriz `W [n_classes × 4]` + bias por classe.
- **Softmax** real para probabilidades.
- **Aprendizado Hebbian** (`ΔW = η · r · x`) — a rede *de fato* aprende a classificar.
- **Heatmap de pesos** (6×4) no painel lateral.
- Mostra **2ª melhor classe e margem** (medida de incerteza).

### ♿ Acessibilidade
- Botões `<button>` semânticos com `aria-label`, `aria-pressed`, `aria-keyshortcuts`.
- `prefers-reduced-motion` honrado.
- `:focus-visible` global, skip link, `role="log"` no histórico.
- Tipografia em `rem`, contraste AA, suporte a `safe-area-inset` (iPhone).

### ⚡ Performance
- HiDPI no canvas (devicePixelRatio).
- Cache de elementos no DOM (sem `getElementById` por frame).
- Chart redimensionado apenas no resize.
- Pausa o `AudioContext` quando a aba fica oculta.
- Sem `transform` no canvas durante hits (evita reflow).

### 🛡️ Segurança
- `addLog` usa `textContent` (sem XSS).
- CSP estrito via `<meta>`.
- Preconnect para fontes Google.

### ⌨️ UX
- Atalhos: **Espaço** (pausa), **R** (reset), **S** (velocidade), **T** (sala de aula), **M** (música), **← →** (passos).
- **Toast** de boas-vindas e fallback de tela cheia.
- **Recorde persistente** em `localStorage` (chave `cn6_highscore`).
- **PWA**: `manifest.json` + favicon SVG (instalável offline).

## 📁 Estrutura

```
robo-visao-v6/
├── index.html
├── manifest.json
├── favicon.svg
├── css/
│   └── style.css
└── js/
    ├── config.js     # constantes, RULES, passos da aula
    ├── state.js      # estado global + matriz NN.W inicializada
    ├── neural.js     # perceptron, softmax, Hebbian
    ├── audio.js      # AudioContext único, beeps + chiptune
    ├── render.js     # canvas, robô, partículas, radar, chart
    ├── sim.js        # vision/move/collide/spawn/reset
    ├── ui.js         # painéis, heatmap, viz neural
    └── main.js       # loop, eventos, atalhos
```

## ▶️ Rodar

Como usa `<script type="module">`, precisa de um servidor HTTP local:

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

Ou publique direto no GitHub Pages (já compatível).

## 🎓 Para a sala de aula

A v6 é especialmente útil em aula porque:
1. Os pesos do heatmap **mudam visivelmente** após cada colisão (aprendizado real).
2. O log mostra `pred:NOME ✓/✗` para discutir acertos e erros do classificador.
3. As 5 etapas (Percepção → HSV → Sinapses → Softmax → Hebbian) têm fórmulas reais.

— Prof. Carlos Adriano · v6.0
