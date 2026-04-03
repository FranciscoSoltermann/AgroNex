package org.agronex.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BackendApplication {

	public static void main(String[] args) {
		// Cargamos el .env buscando hacia arriba desde el directorio de trabajo
		// ignoreIfMissing() evita crash si no existe (ej: en producción con variables reales)
		Dotenv dotenv = Dotenv.configure()
				.directory("./")          // Busca en el directorio de trabajo actual
				.ignoreIfMissing()        // No falla si no encuentra el .env
				.load();

		// Seteamos las variables como System properties para que Spring las lea via ${...}
		dotenv.entries().forEach(entry -> {
			// Solo seteamos si no está ya definida como variable de entorno del SO
			if (System.getenv(entry.getKey()) == null) {
				System.setProperty(entry.getKey(), entry.getValue());
			}
		});

		SpringApplication.run(BackendApplication.class, args);
	}
}