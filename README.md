# Agronex - Sistema de Gestión Agropecuaria Integral

Agronex es una solución de software diseñada para optimizar la gestión operativa y financiera en el sector agropecuario. La plataforma permite la digitalización de procesos, el control de stock de insumos y el seguimiento detallado de campañas agrícolas.



## Características Principales

- **Gestión Multi-Establecimiento:** Administración de múltiples campos y subdivisiones por lotes.
- **Trazabilidad de Actividades:** Registro cronológico de siembras, pulverizaciones y fertilizaciones.
- **Control de Insumos:** Catálogo detallado de semillas, agroquímicos y fertilizantes.
- **Módulo Financiero:** Registro de gastos fijos y variables vinculados directamente a campañas.
- **Seguridad Robusta:** Autenticación JWT y políticas de seguridad a nivel de fila (RLS) mediante Supabase.
- **Auditoría Automática:** Seguimiento de creación y modificación de registros (JPA Auditing).

## Stack Tecnológico

- **Backend:** Java 21 (LTS), Spring Boot, Spring Security (OAuth2 Resource Server con JWKS dinámico)
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, TanStack React Query
- **Persistencia:** PostgreSQL (Supabase) con políticas RLS endurecidas y migraciones versionadas
- **Caché y Límites:** Redis distribuido con fallback local (Bucket4j)
- **Mensajería:** RabbitMQ (TopicExchange) para procesamiento asíncrono de eventos
- **Integraciones:** John Deere Operations Center API, Mercado Pago Webhooks (HMAC), Agromonitoring, Cotizaciones BCR
- **Monitoreo & Métricas:** Actuator, Micrometer, Prometheus y Grafana
- **Documentación API:** Swagger / OpenAPI 3 (SpringDoc)

## Arquitectura del Sistema

El proyecto sigue un patrón de diseño por capas, asegurando el desacoplamiento y la mantenibilidad:

1. **Controllers:** Endpoints REST validados y protegidos.
2. **Services:** Lógica de negocio, validaciones de propiedad y reglas de cálculo.
3. **Mappers:** Transformación de entidades a DTOs para evitar la exposición de datos sensibles.
4. **Repositories:** Capa de acceso a datos optimizada.