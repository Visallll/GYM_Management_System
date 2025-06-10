package bigboss_rmi;

import java.rmi.Remote;
import java.rmi.RemoteException;

public interface GymService extends Remote {
    String askQuestion(String message) throws RemoteException;
}
