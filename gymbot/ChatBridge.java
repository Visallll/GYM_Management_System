package bigboss_rmi;

import java.rmi.Naming;
import java.util.Scanner;

public class ChatBridge {
    private static final String LOG_PREFIX = "[GYMBOT]";
    
    public static void main(String[] args) {
        try {
            // Debug arguments
            System.out.printf("%s [DEBUG] Received %d arguments%n", LOG_PREFIX, args.length);
            if (args.length > 0) {
                System.out.printf("%s [DEBUG] Processing query: %s%n", LOG_PREFIX, args[0]);
            }

            // Connect to RMI server
            GymService gymService = (GymService) Naming.lookup("rmi://localhost:1099/GymService");
            String input = args.length > 0 ? String.join(" ", args) : new Scanner(System.in).nextLine();
            
            System.out.printf("%s [QUERY] Sending to server: %s%n", LOG_PREFIX, input);
            String response = gymService.askQuestion(input);
            
            // Final output (for Node.js to capture)
            System.out.printf("CHATBOT_RESPONSE:%s%n", response);
            
        } catch (Exception e) {
            System.err.printf("%s [ERROR] %s%n", LOG_PREFIX, e.getMessage());
            System.out.printf("CHATBOT_ERROR:%s%n", e.getMessage());
            System.exit(1);
        }
    }
}