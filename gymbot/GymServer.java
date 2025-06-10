package bigboss_rmi;

import java.rmi.Naming;
import java.rmi.registry.LocateRegistry;

public class GymServer {
    public static void main(String[] args) {
        try {
            System.out.println("🛠️ Starting GymServer RMI Registry...");
            LocateRegistry.createRegistry(1099);
            GymService gymService = new GymServiceImpl();
            Naming.rebind("GymService", gymService);
            System.out.println("✅ GymService is now registered and ready!");
        } catch (Exception e) {
            System.err.println("❌ Server Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
