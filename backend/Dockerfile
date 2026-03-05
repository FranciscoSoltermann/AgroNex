# 1. Traemos la "computadora virtual" con Java 21 instalado
FROM eclipse-temurin:21-jdk-alpine

# 2. Creamos una carpeta llamada /app adentro del contenedor y nos metemos ahí
WORKDIR /app

# 3. Copiamos el motor de Maven y el pom.xml
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# 4. Descargamos las librerías de internet (Spring, Postgres, etc.)
RUN ./mvnw dependency:go-offline

# 5. ACÁ COPIAMOS TU CÓDIGO: Agarramos tu carpeta "src" y la metemos al contenedor
COPY src ./src

# 6. Abrimos el puerto 8080 para que el front se pueda conectar
EXPOSE 8080

# 7. Le damos "Play" al proyecto
CMD ["./mvnw", "spring-boot:run"]