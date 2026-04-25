# Robô Reativo — Visão de Cores

Simulador de agente reativo que classifica cores via HSV e decide em tempo real: pegar ou fugir.

## Como funciona

O robô detecta objetos dentro do raio de visão (círculo tracejado) e calcula um score HSV para cada cor:
- **Vermelho / Verde / Roxo** → persegue e coleta (pontos positivos)
- **Azul / Amarelo / Laranja** → foge (pontos negativos se colidir)

O painel direito mostra os cálculos ao vivo: valores H/S/V, scores por cor e a decisão tomada.

## Estrutura

```
robo-visao/
├── index.html   ← tudo em um único arquivo
├── vercel.json  ← configuração de deploy
└── README.md
```

## Deploy no Vercel via GitHub

1. Crie um repositório no GitHub e suba esta pasta
2. Acesse vercel.com → "Add New Project"
3. Importe o repositório
4. Clique em Deploy — pronto

Qualquer push na branch `main` atualiza o site automaticamente.
