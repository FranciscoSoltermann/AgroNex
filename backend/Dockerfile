# ==========================================
# ETAPA 1: BUILDER (Compilación y empaquetado)
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# Copiamos la estructura de Maven Wrapper y pom.xml primero para aprovechar el caché de Docker
COPY .mvn/ .mvn/
COPY mvnw mvnw.cmd pom.xml ./

# Dar permisos de ejecución al mvnw y descargar dependencias offline (para acelerar compilaciones)
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

# Copiamos el resto del código fuente del backend
COPY src ./src

# Compilamos y empaquetamos el JAR saltando los tests para acelerar el despliegue
RUN ./mvnw clean package -DskipTests

# ==========================================
# ETAPA 2: RUNNER (Imagen liviana de producción)
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Crear un usuario no-root por seguridad
RUN useradd -ms /bin/bash appuser
USER appuser

# Copiar el archivo JAR compilado desde la etapa anterior
COPY --from=builder /app/target/*.jar app.jar

# Exponer el puerto por defecto de Spring Boot (8080)
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]