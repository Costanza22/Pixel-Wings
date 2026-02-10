import javax.swing.*;

public class Main {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("Batalha de Dragões");
            DragonFightGame game = new DragonFightGame();
            
            frame.add(game);
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.pack();
            frame.setLocationRelativeTo(null);
            frame.setResizable(false);
            frame.setVisible(true);
            
            // Focar no painel do jogo para receber eventos de teclado
            game.requestFocusInWindow();
        });
    }
}

