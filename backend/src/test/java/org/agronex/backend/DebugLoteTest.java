package org.agronex.backend;

import org.junit.jupiter.api.Test;
import java.sql.*;

public class DebugLoteTest {

    @Test
    public void testDatabaseInfo() throws Exception {
        String url = "jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?prepareThreshold=0";
        String user = "postgres.qgokssagrwpsfryhczug";
        String pass = "Agronex04032026";

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("====== REGISTRATION USERS ======");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id_usuario, email, rol FROM usuario")) {
                while (rs.next()) {
                    System.out.printf("User ID: %s | Email: %s | Rol: %s%n",
                            rs.getString(1), rs.getString(2), rs.getString(3));
                }
            }

            System.out.println("====== CAMPOS IN DB ======");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id_campo, nombre, superficie_total, id_usuario FROM campo")) {
                while (rs.next()) {
                    System.out.printf("Campo ID: %s | Nombre: %s | Superficie: %s | User ID: %s%n",
                            rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4));
                }
            }

            System.out.println("====== LOTES IN DB ======");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id_lote, nombre, superficie, id_campo FROM lote")) {
                while (rs.next()) {
                    System.out.printf("Lote ID: %s | Nombre: %s | Superficie: %s | Campo ID: %s%n",
                            rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4));
                }
            }
        }
    }
}

