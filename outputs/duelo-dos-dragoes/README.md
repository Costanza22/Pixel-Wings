# Medieval Smash

Um jogo de arena em 2D, feito em JavaScript puro com Canvas, onde você controla Ignis, o dragão vermelho, em um duelo contra Azur, o dragão azul.

O projeto foi pensado como um protótipo de combate local com movimentação, salto, ataques corpo a corpo, fogo, defesa, energia e inteligência artificial simples do adversário.

## Visão geral

- Jogo 2D de combate em navegador
- Sem dependências externas
- Controles por teclado e toque
- Sistema de vida e energia
- IA básica do oponente
- Música sintetizada via Web Audio
- Suporte a inglês e português
- Arte local com sprites em folhas de imagem

## Como executar

1. Extraia todos os arquivos do projeto na mesma pasta.
2. Abra o arquivo `index.html` no navegador.
3. Clique em "Start duel" para começar.

Também é possível servir a pasta localmente por um servidor simples, por exemplo:

```bash
python -m http.server 8000
```

Depois abra:

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

Botões na interface para mover, pular, atacar, disparar fogo e defender.

## Mecânicas do jogo

- Vida máxima: 100
- Energia máxima: 100
- Garras: dano curto e próximo
- Fogo: projétil à distância
- Defesa: reduz dano frontal e consome energia
- Energia se recupera quando não há defesa ativa
- O oponente usa regras simples para aproximar, atacar e defender

## Estrutura dos arquivos

- `index.html` — estrutura da tela, estilos e interface
- `engine.js` — regras do combate, movimentação, dano, energia e IA
- `game.js` — entrada do usuário, renderização e ciclo do jogo
- `animation.js` — seleção de poses e animações dos dragões
- `audio.js` — trilha sonora sintetizada
- `i18n.js` — textos em inglês e português
- `sprite-data.js` — dados dos sprites do dragão vermelho
- `blue-sprite-data.js` — dados dos sprites do dragão azul
- `arena.png` — cenário do duelo
- `dragon.png` / `dragon-sprites.png` / `dragon-blue-sprites.png` — arte dos dragões

## Objetivo

Reduza a vida do adversário a zero antes que ele faça o mesmo com você.

## Observações

Este é um protótipo de combate local, sem multiplayer online, sem salvamento de progresso e sem integração com backend.

A proposta principal era validar a jogabilidade, o equilíbrio do combate e a experiência de controle antes de evoluir para mais recursos.

## Licença

Este projeto foi criado como protótipo de estudo e desenvolvimento de jogo em JavaScript. Se for reutilizar partes do código, inclua os créditos originais.

## Créditos

Projeto desenvolvido como protótipo de luta medieval 2D em navegador, com arte, animação e trilha sonora produzidas localmente no próprio projeto.
