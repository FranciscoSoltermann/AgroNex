package org.agronex.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		// Cargamos el archivo .env
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

		// Seteamos las variables como propiedades del sistema para que Spring las lea
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		SpringApplication.run(BackendApplication.class, args);
	}
}