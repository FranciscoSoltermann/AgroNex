# ==========================================
# ETAPA 1: BUILDER
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw mvnw.cmd pom.xml ./

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

COPY src ./src

RUN ./mvnw clean package -DskipTests

# ==========================================
# ETAPA 2: RUNNER ultra-liviano (alpine JRE)
# ==========================================
# eclipse-temurin:21-jre-alpine pesa ~190MB vs 280MB de jammy
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Usuario no-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

# ─── Flags JVM para sobrevivir dentro de 512 MB ───────────────────────────────
# -XX:MaxRAM=400m          → Máximo de memoria que la JVM puede usar (dejamos ~112m al SO)
# -XX:MaxRAMPercentage=75  → La JVM tomará max el 75% del RAM disponible
# -XX:+UseContainerSupport → Detecta correctamente los límites de memoria del contenedor Docker
# -XX:+UseSerialGC         → Recolector de basura serial: mucho más liviano que G1GC en bajo RAM
# -Xss256k                 → Stack por thread reducido (default 512k)
# -XX:TieredStopAtLevel=1  → Compilación JIT básica: ahorra RAM a costo de un poco de velocidad
# -Djava.security.egd=...  → Acelera la generación de tokens JWT/SSL
ENTRYPOINT ["java", \
  "-XX:MaxRAM=400m", \
  "-XX:MaxRAMPercentage=75", \
  "-XX:+UseContainerSupport", \
  "-XX:+UseSerialGC", \
  "-Xss256k", \
  "-XX:TieredStopAtLevel=1", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]