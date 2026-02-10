import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

public class DragonFightGame extends JPanel implements ActionListener, KeyListener {
    private Dragon dragon1;
    private Dragon dragon2;
    private Timer timer;
    private Set<Integer> pressedKeys;
    private String winner;
    private boolean gameOver;
    private BufferedImage backgroundImage;
    
    // Controles
    // Dragão 1: WASD para movimento, Q para atacar
    // Dragão 2: Setas para movimento, Espaço para atacar
    
    private static final int ATTACK_DAMAGE = 10;
    private static final int ATTACK_RANGE = 80;
    private static final int MOVE_SPEED = 5;
    
    private BufferedImage loadBackgroundImage() {
        // Tentar diferentes caminhos para encontrar a imagem
        String[] paths = {
            "background.jpg",
            System.getProperty("user.dir") + File.separator + "background.jpg",
            new File("").getAbsolutePath() + File.separator + "background.jpg"
        };
        
        System.out.println("Tentando carregar imagem de fundo...");
        System.out.println("Diretório atual: " + System.getProperty("user.dir"));
        
        for (String path : paths) {
            try {
                File bgFile = new File(path);
                System.out.println("Tentando: " + bgFile.getAbsolutePath() + " (existe: " + bgFile.exists() + ")");
                if (bgFile.exists() && bgFile.isFile()) {
                    BufferedImage img = ImageIO.read(bgFile);
                    if (img != null) {
                        System.out.println("✓ Imagem de fundo carregada com sucesso: " + bgFile.getAbsolutePath());
                        System.out.println("  Dimensões: " + img.getWidth() + "x" + img.getHeight());
                        return img;
                    }
                }
            } catch (IOException e) {
                System.err.println("Erro ao ler arquivo " + path + ": " + e.getMessage());
            }
        }
        
        // Se não encontrou, tentar como recurso
        try {
            java.net.URL imgURL = getClass().getResource("/background.jpg");
            if (imgURL != null) {
                BufferedImage img = ImageIO.read(imgURL);
                if (img != null) {
                    System.out.println("✓ Imagem de fundo carregada como recurso");
                    return img;
                }
            }
        } catch (IOException e) {
            // Ignorar
        }
        
        System.err.println("AVISO: Nao foi possivel carregar background.jpg. O jogo continuara sem imagem de fundo.");
        System.err.println("Certifique-se de que o arquivo background.jpg esta no mesmo diretorio dos arquivos .java");
        return null;
    }
    
    public DragonFightGame() {
        setPreferredSize(new Dimension(1200, 700));
        setBackground(new Color(30, 30, 50));
        setFocusable(true);
        addKeyListener(this);
        
        pressedKeys = new HashSet<>();
        gameOver = false;
        winner = null;
        
        // Carregar imagem de fundo
        backgroundImage = loadBackgroundImage();
        
        // Criar os dragões
        dragon1 = new Dragon(100, 400, "image.png", "Dragão Vermelho", true);
        dragon2 = new Dragon(900, 400, "image copy.png", "Dragão Azul", false);
        
        timer = new Timer(16, this); // ~60 FPS
        timer.start();
    }
    
    @Override
    public void actionPerformed(ActionEvent e) {
        if (!gameOver) {
            update();
            checkCollisions();
            repaint();
        }
    }
    
    private void update() {
        dragon1.update();
        dragon2.update();
        
        handleInput();
    }
    
    private void handleInput() {
        int screenWidth = getWidth();
        int screenHeight = getHeight();
        
        // Movimento Dragão 1 (WASD)
        if (pressedKeys.contains(KeyEvent.VK_W)) {
            dragon1.move(0, -MOVE_SPEED, screenWidth, screenHeight);
        }
        if (pressedKeys.contains(KeyEvent.VK_S)) {
            dragon1.move(0, MOVE_SPEED, screenWidth, screenHeight);
        }
        if (pressedKeys.contains(KeyEvent.VK_A)) {
            dragon1.move(-MOVE_SPEED, 0, screenWidth, screenHeight);
            dragon1.setFacingRight(false);
        }
        if (pressedKeys.contains(KeyEvent.VK_D)) {
            dragon1.move(MOVE_SPEED, 0, screenWidth, screenHeight);
            dragon1.setFacingRight(true);
        }
        if (pressedKeys.contains(KeyEvent.VK_Q)) {
            dragon1.attack();
        }
        
        // Movimento Dragão 2 (Setas)
        if (pressedKeys.contains(KeyEvent.VK_UP)) {
            dragon2.move(0, -MOVE_SPEED, screenWidth, screenHeight);
        }
        if (pressedKeys.contains(KeyEvent.VK_DOWN)) {
            dragon2.move(0, MOVE_SPEED, screenWidth, screenHeight);
        }
        if (pressedKeys.contains(KeyEvent.VK_LEFT)) {
            dragon2.move(-MOVE_SPEED, 0, screenWidth, screenHeight);
            dragon2.setFacingRight(false);
        }
        if (pressedKeys.contains(KeyEvent.VK_RIGHT)) {
            dragon2.move(MOVE_SPEED, 0, screenWidth, screenHeight);
            dragon2.setFacingRight(true);
        }
        if (pressedKeys.contains(KeyEvent.VK_SPACE)) {
            dragon2.attack();
        }
        
        // Verificar direção dos dragões baseado na posição relativa
        if (dragon1.getX() < dragon2.getX()) {
            dragon1.setFacingRight(true);
            dragon2.setFacingRight(false);
        } else {
            dragon1.setFacingRight(false);
            dragon2.setFacingRight(true);
        }
    }
    
    private void checkCollisions() {
        // Verificar se dragão 1 está atacando dragão 2
        if (dragon1.isAttacking() && dragon1.isInAttackRange(dragon2, ATTACK_RANGE)) {
            dragon2.takeDamage(ATTACK_DAMAGE);
        }
        
        // Verificar se dragão 2 está atacando dragão 1
        if (dragon2.isAttacking() && dragon2.isInAttackRange(dragon1, ATTACK_RANGE)) {
            dragon1.takeDamage(ATTACK_DAMAGE);
        }
        
        // Verificar se algum dragão morreu
        if (!dragon1.isAlive() && winner == null) {
            winner = dragon2.getName();
            gameOver = true;
        } else if (!dragon2.isAlive() && winner == null) {
            winner = dragon1.getName();
            gameOver = true;
        }
    }
    
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        
        // Desenhar imagem de fundo
        if (backgroundImage != null) {
            g2d.drawImage(backgroundImage, 0, 0, getWidth(), getHeight(), null);
        } else {
            // Fallback: desenhar fundo sólido se a imagem não carregar
            g2d.setColor(new Color(30, 30, 50));
            g2d.fillRect(0, 0, getWidth(), getHeight());
        }
        
        // Desenhar dragões
        dragon1.draw(g2d);
        dragon2.draw(g2d);
        
        // Desenhar instruções com fundo semi-transparente para melhor legibilidade
        g2d.setFont(new Font("Arial", Font.BOLD, 16));
        g2d.setColor(new Color(0, 0, 0, 150));
        g2d.fillRect(5, 5, 500, 55);
        g2d.setColor(Color.WHITE);
        g2d.drawString("Dragão 1: WASD (movimento) | Q (atacar)", 10, 30);
        g2d.drawString("Dragão 2: Setas (movimento) | Espaço (atacar)", 10, 50);
        
        // Desenhar tela de game over
        if (gameOver) {
            g2d.setColor(new Color(0, 0, 0, 200));
            g2d.fillRect(0, 0, getWidth(), getHeight());
            
            g2d.setFont(new Font("Arial", Font.BOLD, 48));
            g2d.setColor(Color.YELLOW);
            String gameOverText = "VITÓRIA!";
            int textWidth = g2d.getFontMetrics().stringWidth(gameOverText);
            g2d.drawString(gameOverText, (getWidth() - textWidth) / 2, getHeight() / 2 - 50);
            
            g2d.setFont(new Font("Arial", Font.BOLD, 32));
            g2d.setColor(Color.WHITE);
            String winnerText = winner + " venceu!";
            textWidth = g2d.getFontMetrics().stringWidth(winnerText);
            g2d.drawString(winnerText, (getWidth() - textWidth) / 2, getHeight() / 2 + 20);
            
            g2d.setFont(new Font("Arial", Font.PLAIN, 20));
            String restartText = "Pressione R para reiniciar";
            textWidth = g2d.getFontMetrics().stringWidth(restartText);
            g2d.drawString(restartText, (getWidth() - textWidth) / 2, getHeight() / 2 + 70);
        }
    }
    
    public void restart() {
        dragon1 = new Dragon(100, 400, "image.png", "Dragão Vermelho", true);
        dragon2 = new Dragon(900, 400, "image copy.png", "Dragão Azul", false);
        gameOver = false;
        winner = null;
        repaint();
    }
    
    @Override
    public void keyPressed(KeyEvent e) {
        pressedKeys.add(e.getKeyCode());
        if (e.getKeyCode() == KeyEvent.VK_R && gameOver) {
            restart();
        }
    }
    
    @Override
    public void keyReleased(KeyEvent e) {
        pressedKeys.remove(e.getKeyCode());
    }
    
    @Override
    public void keyTyped(KeyEvent e) {}
}

