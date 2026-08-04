# Backend Folder Architecture

## Objective
Separate domain logic from infrastructure concerns to keep services and controllers focused on business behavior.

## Current Structure
- `controller/`: REST entrypoints.
- `service/`: business use cases.
- `repository/`: persistence interfaces.
- `entity/`: JPA entities.
- `dto/`: API request/response contracts.
- `mapper/`: entity/dto mapping.
- `enums/`: shared domain enums.
- `infrastructure/config/`: Spring configuration.
- `infrastructure/security/`: authentication/authorization helpers and filters.
- `infrastructure/exception/`: global exception handling.

## Packaging Rules
- Keep business logic in `service` and domain model packages.
- Keep framework wiring in `infrastructure/config`.
- Keep security implementation details in `infrastructure/security`.
- Keep global web exception handlers in `infrastructure/exception`.

## Migration Policy
- New technical framework classes should be placed under `infrastructure/*`.
- Avoid importing infrastructure classes into domain entities.
- Keep package names aligned with folder paths to prevent classpath issues.
