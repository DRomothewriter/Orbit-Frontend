# OrbitFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.15.

## Estado de Módulos y Roadmap (v1 & Futuro)

| Módulo | Estado en Release v1 | Notas y Roadmap |
|---|---|---|
| **Autenticación (JWT & Google OAuth)** | ✅ Activo | Flujo completo de registro, verificación de email, inicio de sesión y recuperación de contraseña. |
| **Comunidades y Grupos** | ✅ Activo | Creación, gestión de miembros, roles y navegación lateral. |
| **Mensajería en tiempo real** | ✅ Activo | Sockets en tiempo real con mitigación de fugas de memoria (`SocketService`). |
| **Videollamadas (WebRTC / Mediasoup)** | ✅ Activo | Llamadas de audio y video multicanal en tiempo real. |
| **Notificaciones** | ✅ Activo | Alertas en tiempo real con menú dropdown y marcado de vistos. |
| **Calendario de Eventos** | ⏳ Oculto temporalmente (v1) | La interfaz (`CalendarModalComponent`) y la lógica base (`EventsService`) están implementadas operando localmente en memoria. Para el release v1 se ocultó el acceso directo desde el header (`header.component.html`) para evitar presentar una funcionalidad sin persistencia compartida. **Roadmap v2:** Se reactivará una vez integrados los endpoints de persistencia y sincronización entre usuarios en el backend. |

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Pipeline de CI/CD (GitHub Actions - Orbit-0018)

El despliegue del frontend está completamente automatizado hacia **Amazon S3 y CloudFront** mediante GitHub Actions (`.github/workflows/deploy.yml`), eliminando por completo credenciales estáticas de AWS (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`):

### 1. Autenticación OIDC con AWS
GitHub Actions asume federadamente el rol IAM de menor privilegio en AWS vía OpenID Connect (`aws-actions/configure-aws-credentials@v4`), otorgando exclusivamente permisos para sincronizar en el bucket S3 del frontend e invalidar la distribución de CloudFront.

### 2. Variables y Secretos Requeridos en GitHub
Configurar los siguientes valores en el repositorio (`Settings > Secrets and variables > Actions`):

#### **Variables del Repositorio (Repository Variables):**
- `AWS_REGION`: Región principal de AWS (ej. `us-east-2`).
- `S3_FRONTEND_BUCKET_NAME`: Nombre del bucket S3 privado de hosting estático (ej. `orbit-frontend-production-static`).
- `CLOUDFRONT_DISTRIBUTION_ID`: Identificador de la distribución de CloudFront asociada al dominio.

#### **Secretos del Repositorio (Repository Secrets):**
- `AWS_ROLE_ARN`: ARN del rol IAM OIDC generado por Terraform (`Orbit-IaC`, ej. `arn:aws:iam::<ACCOUNT_ID>:role/orbit-github-actions-role-production`).

### 3. Fases del Flujo de Trabajo
1. **Validación de Especificación:** Ejecución de `npm run test:workflow` para comprobar que el pipeline respete los contratos de seguridad y estructura.
2. **Build de Producción:** Compilación optimizada con Angular CLI (`npm run build -- --configuration=production`), generando los bundles en `dist/orbit-frontend/browser/`.
3. **Sincronización a S3 con `--delete`:** Sube los nuevos chunks JS/CSS e index.html, eliminando del bucket archivos obsoletos de versiones previas.
4. **Invalidación de CloudFront:** Dispara una invalidación inmediata en `/*` para purgar la caché de los Edge Locations de AWS, permitiendo que los usuarios obtengan instantáneamente la nueva versión sin errores 404 de hash.
