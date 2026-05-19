import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheck {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?prepareThreshold=0";
        String user = "postgres.qgokssagrwpsfryhczug";
        String pass = "Agronex04032026";
        
        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            
            ResultSet rs = stmt.executeQuery(
                "SELECT conname, pg_get_constraintdef(c.oid) " +
                "FROM pg_constraint c " +
                "JOIN pg_class t ON c.conrelid = t.oid " +
                "WHERE t.relname = 'lote';"
            );
            
            System.out.println("Constraints on lote:");
            while (rs.next()) {
                System.out.println(rs.getString(1) + ": " + rs.getString(2));
            }
        }
    }
}
