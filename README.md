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

## Arquitectura DevSecOps y CI/CD (GitHub Actions)

`Orbit-Frontend` implementa una arquitectura **DevSecOps** progresiva (*Shift-Left Security*) alineada al flujo de ramas:

```text
feature / bug / docs ──▶ dev ──▶ main ──▶ release (aprobación manual en environment: production)
```

Se eliminó el despliegue automático al hacer `push` a `main` (`deploy.yml`) y todos los pipelines aplican política **fail-gate en severidades `HIGH` y `CRITICAL`**, usando autenticación federada vía **AWS OIDC** (sin credenciales estáticas `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).

### 1. Workflows de Seguridad y Despliegue

| Workflow | Trigger | Controles ejecutados |
|---|---|---|
| **`.github/workflows/ci-dev.yml`** | `pull_request` hacia `dev` | Validación de rama origen (bloquea `main → dev`, verifica prefijo), `npm run lint:security`, build de Angular (`npm run build`), **TruffleHog** (`--only-verified`), **Dependency Review** (`high`), `npm audit --omit=dev --audit-level=high` y **Snyk Open Source**. |
| **`.github/workflows/security-main.yml`** | `pull_request` hacia `main`, `push` a `main` (sin deploy), `workflow_dispatch` | Verifica origen `dev`, pruebas unitarias + cobertura **LCOV** (`npm run test:unit`), **SonarCloud** (`sonar.qualitygate.wait=true`), **CodeQL** (`javascript-typescript`, `security-extended`), **Snyk Code**, **Syft** (SBOM) + **Grype** (`severity-cutoff: high`) y **DAST OWASP ZAP Baseline** (`zap-baseline.py` con `.zap/rules.tsv`). |
| **`.github/workflows/release.yml`** | `release: [published]` y `workflow_dispatch` | Validación de tag **SemVer** y ancestro en `origin/main`, build de producción con **SRI** (*Subresource Integrity*), empaquetado reproducible `.tar.gz`, **Syft + Grype**, firma y verificación **Cosign Keyless (OIDC)**, **GitHub Build Provenance & SBOM Attestations**, `SHA256SUMS.txt` y despliegue a **Amazon S3 + CloudFront** vía **AWS OIDC** tras aprobación manual en `environment: production`. |

### 2. Scripts de Seguridad y Validación Local

- `npm run lint:security` — Ejecuta ESLint con reglas de seguridad (`eslint-plugin-security` y `angular-eslint`) sobre `src/**/*.ts` y `src/**/*.html`.
- `npm run audit:ci` — Audita dependencias de producción (`npm audit --omit=dev --audit-level=high`).
- `npm run test:workflow` — Valida los contratos de seguridad y estructura de los workflows (`node --test tests/deploy.workflow.test.js`).

### 3. Variables y Secretos Requeridos en GitHub

Configurar en `Settings → Secrets and variables → Actions`:

- **Secretos requeridos (Repository Secrets):**
  - `AWS_ROLE_ARN` — ARN del rol IAM federado por OIDC para sincronización en S3 e invalidación de CloudFront.
  - `SONAR_TOKEN` — Token de proyecto/usuario en SonarCloud.
  - `SNYK_TOKEN` — Token de API de Snyk (Snyk Open Source y Snyk Code).
- **Variables del Repositorio (Repository Variables):**
  - `AWS_REGION` — Región principal de AWS (ej. `us-east-2`).
  - `S3_FRONTEND_BUCKET_NAME` — Nombre del bucket S3 privado de hosting estático.
  - `CLOUDFRONT_DISTRIBUTION_ID` — Identificador de la distribución de CloudFront asociada al dominio.
  - `SONAR_ORGANIZATION` — Organización en SonarCloud (ej. `dromothewriter`).
  - `SONAR_PROJECT_KEY` — Key del proyecto en SonarCloud (ej. `DRomothewriter_Orbit-Frontend`).

### 4. GitHub Policy Enforcement

Las políticas de gobierno del repositorio (`.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/rulesets/` para `main`, `dev` y tags `v*`, `environment: production` con aprobación manual y alertas de seguridad) se aplican de forma idempotente mediante `scripts/apply-github-policies.sh`:

```bash
# Requiere GitHub CLI autenticado con permisos de administrador del repositorio
gh auth login
./scripts/apply-github-policies.sh DRomothewriter/Orbit-Frontend
```
