# Pixel Wings

Projeto de estudo e protótipo de jogo em navegador, com temática medieval e combate em 2D entre dragões.

A versão atual é um duelo local em JavaScript puro com Canvas, sem dependências externas nem necessidade de build. O objetivo principal é validar movimentação, ataque, defesa, energia e a sensação do combate antes de evoluir para recursos mais avançados.

## Visão geral

- Arena 2D com dragões em perspectiva lateral
- Movimento horizontal e salto
- Ataques corpo a corpo e disparo de fogo
- Sistema de vida e energia
- Defesa frontal e consumo de energia
- Oponente controlado por IA simples
- Música sintetizada em Web Audio
- Tradução para inglês e português
- Arte local em sprites e imagens embutidas

## Como executar

1. Baixe ou clone este repositório.
2. Abra a pasta do projeto.
3. Entre na pasta `outputs/duelo-dos-dragoes`.
4. Abra o arquivo `index.html` no navegador.

Também é possível rodar localmente em um servidor simples:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000/
```

## Controles

### Teclado

- A / D: mover
- W: pular
- J: garras
- K: fogo
- L: defender
- P: pausar
- R: reiniciar

### Toque

Há botões visuais na interface para movimentação, salto, ataque e defesa.

## Mecânicas principais

- Vida máxima: 100
- Energia máxima: 100
- Garras causam dano curto e próximo
- Fogo dispara projéteis com custo de energia
- Defesa reduz dano frontal e consome energia
- Energia é regenerada quando a defesa não está ativa
- O computador busca se aproximar, atacar e defender conforme regras simples

## Estrutura do projeto

- `outputs/duelo-dos-dragoes/index.html` — estrutura do jogo e interface
- `outputs/duelo-dos-dragoes/engine.js` — regras do combate e IA
- `outputs/duelo-dos-dragoes/game.js` — entrada, renderização e loop principal
- `outputs/duelo-dos-dragoes/animation.js` — poses e animações dos dragões
- `outputs/duelo-dos-dragoes/audio.js` — trilha sonora sintetizada
- `outputs/duelo-dos-dragoes/i18n.js` — textos em inglês e português
- `outputs/duelo-dos-dragoes/sprite-data.js` — sprites do dragão vermelho
- `outputs/duelo-dos-dragoes/blue-sprite-data.js` — sprites do dragão azul
- `outputs/duelo-dos-dragoes/arena.png` — cenário do duelo
- `outputs/duelo-dos-dragoes/dragon.png` e `dragon-blue-sprites.png` — arte dos dragões
- `work/` — scripts de testes e suporte para validação do projeto

## Objetivo do protótipo

O objetivo desta versão é validar se o combate funciona de maneira clara e divertida em um contexto local, sem necessidade de engine ou framework.

## Observações

Este projeto é um protótipo de jogo. Ele ainda não inclui multiplayer online, salvamento de progresso ou sistemas de menu completos.

A ideia atual foi criar uma base jogável com regras bem definidas, combate responsivo e animação simples para evoluir em futuras iterações.

## Licença

Este projeto foi desenvolvido como estudo e protótipo de jogo em JavaScript. Caso reutilize partes do código, mantenha os créditos originais.
