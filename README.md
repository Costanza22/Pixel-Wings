# Batalha de Dragões 🐲

Um jogo de luta onde dois dragões batalham entre si!

## Como Jogar

### Controles

**Dragão 1 (Vermelho):**
- **W, A, S, D**: Mover o dragão
- **Q**: Atacar

**Dragão 2 (Azul):**
- **Setas (↑ ↓ ← →)**: Mover o dragão
- **Espaço**: Atacar

### Objetivo

Reduza a vida do oponente a zero para vencer!

## Como Executar

### Versão Web (Recomendado) 🌐

1. Abra o arquivo `index.html` no seu navegador
2. Ou use um servidor local:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (com http-server instalado)
   npx http-server
   ```
3. Acesse `http://localhost:8000` no navegador

### Versão Java 🖥️

#### Compilar:
```bash
javac *.java
```

#### Executar:
```bash
java Main
```

## Requisitos

### Versão Web:
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- As imagens `image.png`, `image copy.png` e `background.jpg` devem estar no mesmo diretório

### Versão Java:
- Java JDK 8 ou superior
- As imagens `image.png`, `image copy.png` e `background.jpg` devem estar no mesmo diretório

## Características

- Sistema de vida com barra de HP visual
- Sistema de cooldown para ataques
- Detecção de colisão e alcance de ataque
- Imagem de fundo medieval
- Animações de ataque
- Tela de vitória
- Reiniciar jogo (pressione R quando o jogo terminar)

## Estrutura do Projeto

### Versão Web:
- `index.html`: Página HTML principal
- `game.js`: Lógica do jogo em JavaScript
- `image.png` e `image copy.png`: Imagens dos dragões
- `background.jpg`: Imagem de fundo medieval

### Versão Java:
- `Main.java`: Classe principal que inicia o jogo
- `DragonFightGame.java`: Classe que gerencia a lógica do jogo e interface gráfica
- `Dragon.java`: Classe que representa um dragão com suas propriedades e métodos
- `image.png` e `image copy.png`: Imagens dos dragões
- `background.jpg`: Imagem de fundo medieval


