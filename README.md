# Sistema de Registro y Seguimiento de Procesos Sumariales

Sistema web privado para registrar, controlar y dar seguimiento a procesos sumariales, optimizando el control de plazos legales, cambios de fiscal, etapas del proceso y trazabilidad.

## 🚀 Características

### Gestión de Procesos
- **Dashboard Completo**: Estadísticas en tiempo real de procesos activos, etapas y plazos
- **CRUD de Procesos**: Crear, editar y visualizar procesos sumariales
- **Filtrado Avanzado**: Búsqueda por resolución, fiscal, detalle y filtros por etapa/estado

### Control de Plazos y Etapas
- **Cálculo Automático de Etapas**: El sistema determina automáticamente si un proceso está en:
  - **Indagatoria Vigente**: Dentro del plazo legal considerando prórrogas
  - **Indagatoria Fuera de Plazo**: Plazo vencido sin prórroga correspondiente
  - **Concluido**: Proceso finalizado con resolución final
- **Días Hábiles**: Cálculo de plazos usando días hábiles (excluye fines de semana y feriados)
- **Sistema de Prórrogas**: Gestión de prórroga 1 (días 20-40) y prórroga 2 (días 40-60)

### Gestión de Fiscales
- **Ciclos de Fiscal**: Historial completo de cada fiscal asignado al proceso
- **Cambio de Fiscal**: Reinicio automático de plazos al cambiar fiscal
- **Prórrogas por Ciclo**: Cada ciclo fiscal puede tener sus propias prórrogas

### Revisión Jurídica
- **Tipos de Revisión**:
  - Reapertura
  - Acoge Propuesta del Fiscal
  - Pendiente de Revisión
- **Número de Memo**: Registro del memo asociado a la revisión
- **Iconos de Estado**: Verde (completada), Amarillo (pendiente de revisión)

### Sistema de Notificaciones
- **Notificaciones en Tiempo Real**: Alertas de revisiones jurídicas recientes
- **Dropdown de Notificaciones**: Panel desplegable con las últimas 48 horas
- **Marcar como Leídas**: Individual o todas a la vez
- **Navegación Directa**: Clic en notificación abre el proceso correspondiente

### Exportación de Datos
- **Exportar a Excel**: Genera archivo Excel con formato profesional
- **Filtro por Fechas**: Exportar por rango de fechas de resolución
- **Datos Completos**: Incluye información del proceso, fiscal, plazos, prórrogas y revisión jurídica

### Resultados de Proceso
- **Tipos de Resultado**:
  - Medida Disciplinaria
  - Sobreseimiento
  - Absolución
- **Detalle del Resultado**: Campo adicional para especificar el resultado

### Roles de Usuario
- **Administrador**: Gestión completa del sistema
- **Jurídica**: Puede realizar revisiones jurídicas
- **Visualizador**: Acceso de solo lectura

### Interfaz de Usuario
- **Diseño Moderno**: Paleta de colores rosado pastel
- **Notificaciones Toast**: Mensajes de éxito y error en tiempo real
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Modales**: Crear, editar y ver detalles sin salir de la página

## 🛠 Stack Tecnológico

### Frontend
- **React 18** con **TypeScript**
- **Vite** (bundler y dev server)
- **TailwindCSS** (estilos)
- **React Router** (navegación)
- **React Hook Form + Zod** (formularios y validación)
- **Zustand** (gestión de estado)
- **Lucide React** (iconos)
- **date-fns** (manejo de fechas)
- **ExcelJS** (exportación a Excel)

### Backend / Servicios
- **Firebase Authentication** (autenticación)
- **Firebase Firestore** (base de datos en tiempo real)
- **Firestore Security Rules** (seguridad a nivel de documento)

### Deploy
- **Firebase Hosting** o **Vercel** (hosting)

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Firebase
- Cuenta de Vercel (para deploy)

## ⚙️ Configuración

### 1. Clonar o descargar el proyecto

```bash
cd sistema-sumariales
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar **Authentication** con método Email/Password
3. Crear base de datos **Firestore**
4. Copiar las credenciales del proyecto

### 4. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 5. Configurar Firestore Security Rules

En Firebase Console > Firestore Database > Rules, pegar las siguientes reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }

    function isJuridica() {
      return isAuthenticated() && getUserRole() == 'juridica';
    }

    function canWrite() {
      return isAdmin() || isJuridica();
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if false; // Solo administradores de Firebase pueden modificar roles
    }

    // Procesos Sumariales
    match /procesos_sumariales/{procesoId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if canWrite(); // Admin y Jurídica pueden actualizar
      allow delete: if false; // No se permite eliminar, solo marcar como inactivo

      // Subcollection: ciclos_fiscal
      match /ciclos_fiscal/{cicloId} {
        allow read: if isAuthenticated();
        allow write: if isAdmin();
      }

      // Subcollection: recusaciones
      match /recusaciones/{recusacionId} {
        allow read: if isAuthenticated();
        allow write: if isAdmin();
      }
    }
  }
}
```

### 6. Crear usuarios iniciales

En Firebase Console > Authentication, crear usuarios manualmente.

Luego, en Firestore, crear la colección `users` con documentos:

```javascript
// Documento: [UID del usuario]
{
  email: "admin@ejemplo.com",
  role: "admin" // "admin", "juridica" o "viewer"
}
```

**Roles disponibles:**
- `admin`: Administrador con acceso completo
- `juridica`: Usuario de área jurídica (revisiones jurídicas)
- `viewer`: Solo lectura

## 🚀 Desarrollo

Iniciar servidor de desarrollo:

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:5173`

## 📦 Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

## 🌐 Deploy en Vercel

### Opción 1: Desde el CLI

```bash
npm i -g vercel
vercel
```

### Opción 2: Desde la interfaz web

1. Conectar repositorio en [Vercel](https://vercel.com)
2. Configurar variables de entorno (VITE_FIREBASE_*)
3. Deploy automático

### Variables de entorno en Vercel

En la configuración del proyecto en Vercel, agregar todas las variables `VITE_FIREBASE_*` con sus valores correspondientes.

## 📊 Estructura del Proyecto

```
sistema-sumariales/
├── src/
│   ├── components/              # Componentes reutilizables
│   │   ├── ExportarDatos.tsx       # Exportación a Excel
│   │   ├── HistorialFiscal.tsx     # Historial de ciclos fiscales
│   │   ├── ModalRevisionJuridica.tsx  # Modal de revisión jurídica
│   │   ├── NotificacionesDropdown.tsx # Dropdown de notificaciones
│   │   ├── NuevoProcesoModal.tsx   # Modal crear proceso
│   │   ├── ProcesoDetalleModal.tsx # Modal ver detalles
│   │   ├── ProcesoEditarModal.tsx  # Modal editar proceso
│   │   └── ToastNotification.tsx   # Notificaciones toast
│   ├── pages/                   # Páginas principales
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── ProcesosPage.tsx
│   ├── layouts/                 # Layouts de página
│   │   └── MainLayout.tsx
│   ├── hooks/                   # Custom hooks
│   │   ├── useProcesos.ts          # Gestión de procesos
│   │   ├── usePlazos.ts            # Cálculo de plazos
│   │   ├── useCiclosFiscal.ts      # Gestión de ciclos fiscales
│   │   └── useNotificacionesRevision.ts  # Notificaciones en tiempo real
│   ├── services/                # Servicios externos
│   │   └── firebase.ts
│   ├── context/                 # Estado global
│   │   ├── authStore.ts            # Autenticación
│   │   └── NotificationContext.tsx # Notificaciones toast
│   ├── routes/                  # Configuración de rutas
│   │   └── ProtectedRoute.tsx
│   ├── types/                   # Tipos TypeScript
│   │   └── index.ts
│   ├── utils/                   # Utilidades
│   │   ├── diasHabiles.ts          # Cálculo días hábiles
│   │   └── exportToExcel.ts        # Generación de Excel
│   ├── styles/                  # Estilos globales
│   │   └── index.css
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🗄 Modelo de Datos

### Colección: `procesos_sumariales`

Cada documento representa un proceso sumarial completo:

```typescript
{
  sirh: boolean;                           // Registrado en SIRH
  envio_ordinario: boolean;                // Enviado por ordinario
  tipo_proceso: string;                    // Tipo de proceso
  numero_resolucion: string;               // Número de resolución
  fecha_resolucion: Timestamp;             // Fecha de resolución
  fecha_notificacion: Timestamp;           // Fecha de notificación inicial
  por_cgr: boolean;                        // Por CGR
  detalle: string;                         // Detalle del proceso
  etapa: 'INDAGATORIA_VIGENTE' | 'INDAGATORIA_FUERA_PLAZO' | 'CONCLUIDO';
  fiscal_actual: {
    nombre: string;
    fecha_asignacion: Timestamp;
  };
  activo: boolean;                         // Estado activo/inactivo
  resolucion_final: string | null;         // Resolución final (si concluido)
  tipo_resultado: 'medida_disciplinaria' | 'sobreseimiento' | 'absolucion' | null;
  detalle_resultado: string | null;        // Detalle del resultado
  funcionario: string | null;              // Funcionario involucrado
  memo_entrega_direccion: string | null;   // Memo de entrega a dirección
  revision_juridica: {
    revision_realizada: boolean;
    tipo_revision: 'reapertura' | 'acoge_propuesta_fiscal' | 'pendiente_de_revision' | null;
    numero_memo: string | null;
    fecha_revision: Timestamp | null;
  } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Subcolección: `ciclos_fiscal`

Registra cada ciclo de fiscal y sus plazos:

```typescript
{
  fiscal: string;                          // Nombre del fiscal
  fecha_notificacion: Timestamp;           // Fecha de notificación al fiscal
  motivo_cambio: string | null;            // Motivo del cambio de fiscal
  plazos: {
    plazo_20: { inicio: Timestamp; fin: Timestamp };
    plazo_40: { inicio: Timestamp; fin: Timestamp };
    plazo_60: { inicio: Timestamp; fin: Timestamp };
  };
  prorroga_1: {                            // Prórroga para días 20-40
    numero_resolucion: string;
    fecha_resolucion: Timestamp;
  } | null;
  prorroga_2: {                            // Prórroga para días 40-60
    numero_resolucion: string;
    fecha_resolucion: Timestamp;
  } | null;
  activo: boolean;                         // Solo un ciclo activo por proceso
  createdAt: Timestamp;
}
```

### Subcolección: `recusaciones`

```typescript
{
  fiscal: string;
  fecha: Timestamp;
  ha_lugar: boolean;
  causal_invocada: string;
  observacion: string;
  createdAt: Timestamp;
}
```

### Colección: `users`

```typescript
{
  email: string;
  role: 'admin' | 'juridica' | 'viewer';
}
```

## 🎨 Paleta de Colores

- **Fondo principal**: `#FFF1F5`
- **Color primario**: `#F4A7B9`
- **Color secundario**: `#FADADD`
- **Texto principal**: `#374151`

## 🔐 Roles de Usuario

### Administrador (`admin`)
- Crear y editar procesos sumariales
- Cambiar fiscal asignado
- Registrar y eliminar prórrogas
- Registrar resoluciones finales y resultados
- Gestionar envío ordinario
- Ver notificaciones de revisiones jurídicas
- Exportar datos a Excel
- Acceso completo al dashboard

### Jurídica (`juridica`)
- Realizar revisiones jurídicas
- Registrar tipo de revisión y número de memo
- Ver procesos y detalles
- Acceso al dashboard

### Visualizador (`viewer`)
- Acceso solo lectura
- Ver dashboard y estadísticas
- Listar y filtrar procesos
- Ver detalles de procesos

## 📝 Reglas de Negocio

### Plazos y Etapas
1. Los plazos se calculan en **días hábiles** (excluye fines de semana y feriados)
2. **Plazo base**: 20 días hábiles desde la notificación
3. **Prórroga 1**: Extiende el plazo de 20 a 40 días hábiles
4. **Prórroga 2**: Extiende el plazo de 40 a 60 días hábiles (máximo legal)

### Determinación Automática de Etapa
- **Indagatoria Vigente**:
  - Días 0-20: Siempre vigente
  - Días 20-40: Vigente solo con prórroga 1
  - Días 40-60: Vigente solo con prórroga 2
- **Indagatoria Fuera de Plazo**: Superado el plazo sin prórroga correspondiente
- **Concluido**: Cuando se registra una resolución final

### Ciclos de Fiscal
1. Solo puede existir un ciclo de fiscal activo por proceso
2. El cambio de fiscal crea un nuevo ciclo y reinicia los plazos
3. Cada ciclo mantiene su propio historial de prórrogas
4. Los ciclos anteriores quedan como historial

### Revisión Jurídica
1. Solo usuarios con rol "juridica" pueden realizar revisiones
2. El tipo "Pendiente de Revisión" no requiere número de memo
3. Las notificaciones se muestran durante 48 horas
4. Las revisiones generan notificaciones para administradores

### Resultados de Proceso
1. Los resultados solo se pueden registrar en procesos concluidos
2. Tipos: Medida Disciplinaria, Sobreseimiento, Absolución
3. Se puede agregar detalle adicional al resultado

## 🛡 Seguridad

- **Autenticación**: Requerida para todas las rutas (Firebase Auth)
- **Autorización por Roles**: Validación en frontend y backend (Firestore Rules)
- **Permisos Granulares**:
  - Solo admin puede crear procesos
  - Solo admin y jurídica pueden actualizar
  - Todos los autenticados pueden leer
- **Variables de Entorno**: Credenciales sensibles en archivos `.env`
- **HTTPS**: Obligatorio en producción
- **Soft Delete**: No se permite eliminar registros, solo desactivar
- **Notificaciones Locales**: Estado de lectura almacenado en localStorage

## 🤝 Soporte

Este es un sistema de uso interno. Para soporte, contactar al administrador del sistema.

## 📄 Licencia

Uso interno privado - Todos los derechos reservados
