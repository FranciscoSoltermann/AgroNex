# Plan Integral de QA Automation - AgroNex

## 1. Objetivo
Asegurar calidad funcional, regresión controlada y estabilidad de plataforma para backend Spring Boot + frontend Next.js/React + PostgreSQL, con bloqueo de merge si falla cualquier suite crítica.

## 2. Pirámide de Tests (objetivo de distribución)
- Unit tests: 70%
- Integration tests: 20%
- E2E tests: 10%

Este enfoque maximiza feedback rápido y minimiza costo de mantenimiento.

## 3. Backend - Estrategia

### 3.1 Unit Testing (JUnit 5 + Mockito)
Cobertura objetivo: 80%+ de líneas (enforced por JaCoCo).

Capas objetivo:
- Service layer (reglas de negocio)
- Mappers con lógica no trivial
- Validación de normalización y flujo de auditoría

Casos incluidos en módulo Auth/Usuario:
- Happy path de registro
- Normalización de email y DNI/CUIT
- Usuario ya registrado
- Datos duplicados
- Asignación de empleado válida/ inválida
- Casos de límite (email con espacios/mayúsculas, DNI formateado con puntos)

### 3.2 Integration Testing con Testcontainers
Uso de PostgreSQL real en contenedor para validar:
- Persistencia real de entidades heredadas (usuario/persona_fisica)
- Restricciones de unicidad
- Consultas case-insensitive
- Integridad transaccional

### 3.3 API Web Testing (MockMvc)
Validaciones sobre:
- HTTP status: 200, 201, 400, 404, 500
- Contratos JSON de respuesta
- JSON Schema validation de payloads de respuesta
- Validaciones de DTO (@Valid)

## 4. Frontend - Estrategia

### 4.1 Unit Tests (Jest + React Testing Library)
Prioridad:
- Accesibilidad (roles, labels, placeholders, feedback de error)
- Comportamiento (flujos de usuario)
- No acoplar a implementación interna

Casos incluidos en Login:
- Render accesible de formulario
- Login happy path
- Error de credenciales
- Registro FISICA completo
- Error 400 de disponibilidad
- Caso límite de trimming de email

### 4.2 E2E (Playwright) con Page Object Model
Flujos críticos cubiertos:
- Login exitoso -> redirección dashboard
- Registro exitoso de persona física
- Registro con error de disponibilidad (400)

POM usado para encapsular selectores y acciones de autenticación.

## 5. Estrategia de Mocks vs Spies

### Mocks
Usar cuando:
- Dependencia externa (Supabase, APIs HTTP, DB en unit tests)
- Se quiere aislar comportamiento de una unidad

### Spies
Usar cuando:
- Queremos verificar invocaciones reales sin perder implementación base
- Ejemplo: monitorizar una función utilitaria o callback sin reemplazar todo el módulo

### Regla práctica
- Unit tests: mock fuerte de infraestructura.
- Integration tests: sin mocks de DB.
- E2E: mock de integraciones externas no deterministas (Supabase/API third-party), manteniendo comportamiento de UI real.

## 6. Estructura profesional de carpetas

backend/
- src/test/java/org/agronex/backend/service/
- src/test/java/org/agronex/backend/controller/
- src/test/java/org/agronex/backend/repository/

frontend/
- __tests__/app/
- tests/qa/pages/
- tests/qa/

## 7. Criterios de salida
- Unit + integration + e2e en verde
- Cobertura JaCoCo >= 80%
- Sin regresiones en flujos críticos de autenticación
- Pipeline exitoso en Pull Request antes de merge

## 8. Escenarios sugeridos adicionales (próxima iteración)
- 401/403 de endpoints protegidos
- 409 por conflictos de unicidad a nivel API
- Timeouts y reintentos de cliente HTTP
- Pruebas contract-first para endpoints de analytics/campos/lotes
- Pruebas de performance (k6/Gatling) para rutas de alto tráfico
