package bigboss_rmi;

import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;

public class GymServiceImpl extends UnicastRemoteObject implements GymService {

    public GymServiceImpl() throws RemoteException {
        super();
        System.out.println("[SYSTEM] GymService initialized and ready for requests");
    }

    @Override
    public String askQuestion(String message) throws RemoteException {
        System.out.println("[QUERY RECEIVED] \"" + message + "\"");

        String response;
        String msg = message.trim().toLowerCase();

        if (msg.contains("membership") && msg.contains("type")) {
            response = "We offer three membership tiers:\n"
                     + "- Basic: Access to gym facilities\n"
                     + "- Premium: Includes group classes\n"
                     + "- Family: Covers two adults and two children";
        } 
        else if (msg.contains("cost") || msg.contains("price") || msg.contains("fee")) {
            response = "Our current membership rates:\n"
                     + "- Basic: $25/month\n"
                     + "- Premium: $50/month\n"
                     + "- Family: $70/month\n\n"
                     + "Annual subscriptions receive a 10% discount.";
        } 
        else if (msg.contains("schedule") || msg.contains("class") || msg.contains("time")) {
            response = "Class Schedule:\n"
                     + "Morning: 6:00 AM - 9:00 AM\n"
                     + "Afternoon: 4:00 PM - 6:00 PM\n"
                     + "Evening: 7:00 PM - 9:00 PM\n\n"
                     + "The gym is open from 5:00 AM to 10:00 PM daily.";
        } 
        else if (msg.contains("trainer") || msg.contains("coach")) {
            response = "Our certified trainers specialize in:\n"
                     + "- Strength and conditioning\n"
                     + "- Cardiovascular training\n"
                     + "- Flexibility and mobility\n\n"
                     + "Personal training sessions are available by appointment.";
        } 
        else if (msg.contains("payment") || msg.contains("pay")) {
            response = "Accepted payment methods:\n"
                     + "- Visa/MasterCard credit/debit cards\n"
                     + "- ABA bank transfers\n"
                     + "- Wing mobile payments\n"
                     + "- Cash payments at our facility\n\n"
                     + "Please visit our Payments page for detailed instructions.";
        } 
        else if (msg.contains("contact") || msg.contains("support") || msg.contains("help")) {
            response = "Contact Information:\n"
                     + "Email: bigbozz168@gmail.com\n"
                     + "Telegram: +855 11 434 668\n"
                     + "Address: Street 168, Phnom Penh\n\n"
                     + "Customer service hours: 7:00 AM - 9:00 PM daily";
        } 
        else if (msg.contains("location") || msg.contains("where") || msg.contains("address")) {
            response = "Our location:\n"
                     + "Big Boss Gym\n"
                     + "Street 110\n"
                     + "Phnom Penh\n\n"
                     + "We're located in ITC, Russian Federation Blvd (110)<br>Phnom Penh, Cambodia.";
        } 
        else {
            response = "Thank you for your inquiry. Could you please clarify if you're asking about:\n"
                     + "- Membership options\n"
                     + "- Payment methods\n"
                     + "- Class schedules\n"
                     + "- Trainer availability";
        }

        System.out.println("[RESPONSE SENT] \"" + response + "\"");
        return response;
    }
}