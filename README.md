# Portal de Gestión UME

Este proyecto es una aplicación web moderna construida con [Next.js](https://nextjs.org) para la gestión integral de personal, solicitudes de ausencia y administración de turnos de la UME.

La aplicación cuenta con un sistema robusto de roles (Administrador y Usuario) y está diseñada para facilitar la interacción entre la gestión y el personal.

## Características Principales

### 🔐 Autenticación y Seguridad
- Sistema de **Login seguro** mediante Supabase Auth.
- **Control de acceso basado en roles (RBAC)**: Diferenciación estricta entre interfaces de Administrador y Usuario.
- Protección de rutas y redirecciones automáticas.

### 👤 Portal del Empleado
Diseñado para que el personal gestione su información y solicitudes de manera autónoma:
- **Dashboard Personal**: Vista rápida de estado, saldo de días disponibles y accesos directos.
- **Gestión de Solicitudes**:
  - **Crear nuevas solicitudes** de forma intuitiva.
  - Tipos de solicitud soportados:
    - **PO**: Permiso Oficial.
    - **DA**: Días Adicionales.
    - **AP**: Asuntos Propios.
  - Validación de fechas y reglas de negocio.
- **Historial**: Consulta del estado de todas las solicitudes realizadas.
- **Calendario Personal**: Visualización de días solicitados, aprobados y turnos.
- **Mensajería**: Canal de comunicación directo con la administración para dudas o notificaciones.

### 🛡️ Portal de Administración
Herramientas completas para la gestión de recursos humanos y planificación operativa:
- **Dashboard General**: Métricas clave y visión global de la actividad.
- **Gestión de Usuarios**:
  - Directorio completo de personal.
  - **Perfil Detallado**: Historial completo de solicitudes, saldo de días y chat individual con cada usuario.
  - Gestión extrema de usuarios (Altas, Bajas, Edición).
- **Planificación y Capacidad (NUEVO)**:
  - **Reglas de Presencia**: Configuración de reglas de mínimos de personal requeridos por periodos (ej. Verano 30%, Invierno 50%).
  - **Niveles de Plantilla**: Registro del total de efectivos disponibles por fechas.
  - **Disponibilidad Diaria**: Cálculo automático de la capacidad operativa diaria basándose en plantilla, reglas y ausencias aprobadas.
  - **Gestión Manual**: Posibilidad de registrar ausencias o bloqueos manualmente desde administración.
- **Gestión de Solicitudes**:
  - Bandeja de entrada centralizada.
  - Flujo de aprobación/rechazo informado por la disponibilidad diaria calculada.
- **Calendario Global**: Vista maestra de todas las ausencias y disponibilidad.
- **Configuración**: Ajustes globales de la aplicación y parámetros de capacidad.

## Tecnologías Utilizadas

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Actions).
- **Lenguaje**: TypeScript.
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) con [Shadcn UI](https://ui.shadcn.com/) para componentes accesibles y modernos.
- **Iconos**: [Lucide React](https://lucide.dev/).
- **Base de Datos y Autenticación**: [Supabase](https://supabase.com/).
- **Manejo de Fechas**: `date-fns` y `react-day-picker`.

## Primeros Pasos

Para ejecutar el proyecto localmente:

1.  Instala las dependencias:

```bash
npm install
# o
yarn install
```

2.  Configura las variables de entorno para Supabase en un archivo `.env.local`.

3.  Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.
