import java.sql.*;
public class DBCheck {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?prepareThreshold=0";
        try (Connection conn = DriverManager.getConnection(url, "postgres.qgokssagrwpsfryhczug", "Agronex04032026")) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT scopes FROM john_deere_tokens");
            while(rs.next()) {
                System.out.println("SCOPES: " + rs.getString("scopes"));
            }
        }
    }
}
