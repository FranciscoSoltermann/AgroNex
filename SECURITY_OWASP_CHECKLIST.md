# OWASP Security Checklist - AgroNex

## 1. JWT (Spring Security + Resource Server)
- [ ] Validar `iss`, `aud`, `exp`, `nbf` y firma de JWT en cada request protegida.
- [ ] Rechazar tokens sin `sub` UUID valido.
- [ ] Usar vida corta para access token y refresh token rotativo del proveedor (Supabase).
- [ ] No loggear JWT completos ni claims sensibles en backend/frontend.
- [ ] Aplicar control de autorizacion por rol (`ADMIN`, `PROPIETARIO`, `EMPLEADO`) en endpoints y capa servicio.
- [ ] Validar ownership de recursos (IDOR): un empleado solo debe leer datos de su `id_propietario`.
- [ ] En logout/cambio de rol sensible, invalidar sesion en cliente y forzar refresco.

## 2. CORS
- [ ] Evitar `*` en produccion; definir dominios explicitos por entorno.
- [ ] Permitir solo metodos y headers estrictamente necesarios.
- [ ] Si hay cookies/sesion, `allowCredentials=true` y orígenes exactos (no wildcard).
- [ ] Revisar preflight para que no exponga rutas internas no publicas.
- [ ] Asegurar que ambientes dev/staging/prod tengan listas de CORS separadas.

## 3. SQL Injection y Persistencia
- [ ] Usar siempre repositorios JPA/parametrizacion; evitar SQL concatenado.
- [ ] Si se usa `@Query(nativeQuery=true)`, parametrizar todos los valores.
- [ ] Validar/sanitizar entradas (`@Valid`, regex, longitudes maximas) antes de persistir.
- [ ] Aplicar principio de minimo privilegio al usuario de DB (sin `SUPERUSER`).
- [ ] Gestionar migraciones via Flyway y revisar cambios DDL en PR.

## 4. OWASP Top 10 aplicado al stack
- [ ] A01 Broken Access Control: pruebas negativas por rol y ownership.
- [ ] A02 Cryptographic Failures: TLS obligatorio, secretos en variables de entorno.
- [ ] A03 Injection: tests para payloads maliciosos en filtros y busquedas.
- [ ] A04 Insecure Design: threat modeling de endpoints criticos (auth, pagos).
- [ ] A05 Security Misconfiguration: headers seguros, Swagger deshabilitado en prod.
- [ ] A06 Vulnerable Components: escaneo automatico de dependencias en CI.
- [ ] A07 Identification/Auth Failures: limite de intentos y controles anti abuso.
- [ ] A08 Software/Data Integrity: dependencia lockeada, artifacts firmados cuando aplique.
- [ ] A09 Logging/Monitoring: logs de seguridad + alertas (401/403/5xx anomalias).
- [ ] A10 SSRF: bloquear destinos arbitrarios en llamadas salientes y validar URLs.

## 5. Hardening recomendado inmediato
- [ ] Agregar `Content-Security-Policy` y `Strict-Transport-Security` en frontend/proxy.
- [ ] Revisar `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- [ ] Rate limiting por endpoint sensible (registro/login/webhooks).
- [ ] Rotacion periodica de secretos (`SUPABASE_ANON_KEY`, tokens de terceros, SMTP).
- [ ] Backups cifrados y prueba de restore de PostgreSQL.
