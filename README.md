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
