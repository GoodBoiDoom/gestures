//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
import java.io.IOException;

public class Main {
    public static void main(String[] args) {
        try {
            // Launch the Python script.
            ProcessBuilder pb = new ProcessBuilder("python3", "python/mediapipe_gestures.py");
            pb.inheritIO(); // Optional: stream Python output to the Java console.
            Process pythonProcess = pb.start();

            // Start the Java server.
            GestureCommandReceiver.main(null);

            // Optionally wait for the Python process to complete.
            pythonProcess.waitFor();
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }
}
