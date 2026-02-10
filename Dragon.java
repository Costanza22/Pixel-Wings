import java.awt.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;
import java.io.IOException;

public class Dragon {
    private int x, y;
    private int width, height;
    private int health;
    private int maxHealth;
    private BufferedImage image;
    private String name;
    private boolean facingRight;
    private boolean isAttacking;
    private int attackCooldown;

    public Dragon(int x, int y, String imagePath, String name, boolean facingRight) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.facingRight = facingRight;
        this.maxHealth = 100;
        this.health = maxHealth;
        this.isAttacking = false;
        this.attackCooldown = 0;

        try {
            this.image = ImageIO.read(new File(imagePath));
            this.width = image.getWidth() / 3; // Redimensionar para caber na tela
            this.height = image.getHeight() / 3;
        } catch (IOException e) {
            System.err.println("Erro ao carregar imagem: " + imagePath);
            // Criar imagem padrão se não conseguir carregar
            this.image = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = this.image.createGraphics();
            g.setColor(Color.RED);
            g.fillRect(0, 0, 100, 100);
            g.dispose();
            this.width = 100;
            this.height = 100;
        }
    }

    public void update() {
        if (attackCooldown > 0) {
            attackCooldown--;
        }
        if (isAttacking && attackCooldown == 0) {
            isAttacking = false;
        }
    }

    public void move(int dx, int dy, int screenWidth, int screenHeight) {
        int newX = x + dx;
        int newY = y + dy;

        // Limitar movimento dentro da tela
        if (newX >= 0 && newX + width <= screenWidth) {
            x = newX;
        }
        if (newY >= 0 && newY + height <= screenHeight) {
            y = newY;
        }
    }

    public void attack() {
        if (attackCooldown == 0) {
            isAttacking = true;
            attackCooldown = 30; // Cooldown de 30 frames (~0.5 segundos a 60 FPS)
        }
    }

    public void takeDamage(int damage) {
        health -= damage;
        if (health < 0) {
            health = 0;
        }
    }

    public boolean isAlive() {
        return health > 0;
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, width, height);
    }

    public boolean isInAttackRange(Dragon other, int attackRange) {
        Rectangle bounds = getBounds();

        // Verificar se está na frente do outro dragão
        if (facingRight && x < other.getX()) {
            return bounds.intersects(new Rectangle(other.getX() - attackRange, other.getY(),
                    attackRange, other.getHeight()));
        } else if (!facingRight && x > other.getX()) {
            return bounds.intersects(new Rectangle(other.getX() + other.getWidth(), other.getY(),
                    attackRange, other.getHeight()));
        }
        return false;
    }

    public void draw(Graphics2D g) {
        // Desenhar dragão
        if (facingRight) {
            g.drawImage(image, x, y, x + width, y + height, 0, 0, image.getWidth(), image.getHeight(), null);
        } else {
            // Espelhar imagem se estiver virado para esquerda
            g.drawImage(image, x + width, y, x, y + height, 0, 0, image.getWidth(), image.getHeight(), null);
        }

        // Desenhar barra de vida
        int barWidth = 150;
        int barHeight = 20;
        int barX = x + (width - barWidth) / 2;
        int barY = y - 30;

        // Fundo da barra
        g.setColor(Color.BLACK);
        g.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

        // Barra de vida
        float healthPercent = (float) health / maxHealth;
        if (healthPercent > 0.6) {
            g.setColor(Color.GREEN);
        } else if (healthPercent > 0.3) {
            g.setColor(Color.YELLOW);
        } else {
            g.setColor(Color.RED);
        }
        g.fillRect(barX, barY, (int) (barWidth * healthPercent), barHeight);

        // Borda da barra
        g.setColor(Color.WHITE);
        g.drawRect(barX, barY, barWidth, barHeight);

        // Texto de vida
        g.setFont(new Font("Arial", Font.BOLD, 14));
        g.setColor(Color.WHITE);
        String healthText = health + "/" + maxHealth;
        int textWidth = g.getFontMetrics().stringWidth(healthText);
        g.drawString(healthText, barX + (barWidth - textWidth) / 2, barY + 15);

        // Nome do dragão
        int nameWidth = g.getFontMetrics().stringWidth(name);
        g.drawString(name, x + (width - nameWidth) / 2, barY - 5);

        // Efeito de ataque
        if (isAttacking) {
            g.setColor(new Color(255, 255, 0, 150));
            g.fillOval(x - 20, y - 20, width + 40, height + 40);
        }
    }

    // Getters e Setters
    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public int getHealth() {
        return health;
    }

    public int getMaxHealth() {
        return maxHealth;
    }

    public String getName() {
        return name;
    }

    public boolean isFacingRight() {
        return facingRight;
    }

    public void setFacingRight(boolean facingRight) {
        this.facingRight = facingRight;
    }

    public boolean isAttacking() {
        return isAttacking;
    }
}
