import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.net.Socket;

public class GestureCommandReceiver {
    public static void main(String[] args) {
        int port = 5005;  // Must match the Python script's port.
        try (ServerSocket serverSocket = new ServerSocket(port)) {
            System.out.println("Java server listening on port " + port);
            // Wait for the Python client to connect.
            Socket clientSocket = serverSocket.accept();
            BufferedReader in = new BufferedReader(
                    new InputStreamReader(clientSocket.getInputStream()));

            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                System.out.println("Received: " + inputLine);
                final String commandLine = inputLine;
                new Thread(() -> {
                    try {
                        if (commandLine.contains("FIST")) {
                            System.out.println("Executing: Show Desktop (ctrl+alt+d)");
                            Runtime.getRuntime().exec("xdotool key ctrl+alt+d");
                        } else if (commandLine.contains("PALM")) {
                            System.out.println("Executing: Show All Apps (Super key)");
                            Runtime.getRuntime().exec("xdotool key Super_L");
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }).start();
            }
            in.close();
            clientSocket.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
