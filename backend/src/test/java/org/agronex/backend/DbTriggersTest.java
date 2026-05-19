package org.agronex.backend;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbTriggersTest {

    @Test
    public void testTriggers() throws Exception {
        String url = "jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?prepareThreshold=0";
        String user = "postgres.qgokssagrwpsfryhczug";
        String pass = "Agronex04032026";
        
        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            
            ResultSet rs = stmt.executeQuery(
                "SELECT tgname, pg_get_triggerdef(t.oid) " +
                "FROM pg_trigger t " +
                "JOIN pg_class c ON t.tgrelid = c.oid " +
                "WHERE c.relname = 'lote';"
            );
            
            System.out.println("====== TRIGGERS ON LOTE ======");
            while (rs.next()) {
                System.out.println(rs.getString(1) + ": " + rs.getString(2));
            }
            System.out.println("=================================");
        }
    }
}
