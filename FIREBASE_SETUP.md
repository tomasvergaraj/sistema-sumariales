# Guía de Configuración de Firebase

Esta guía te ayudará a configurar Firebase para el Sistema de Procesos Sumariales.

## 1. Crear Proyecto en Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Clic en "Agregar proyecto"
3. Nombre del proyecto: "Sistema Procesos Sumariales" (o el que prefieras)
4. Seguir los pasos del asistente

## 2. Configurar Authentication

1. En el menú lateral, ir a **Build > Authentication**
2. Clic en "Comenzar"
3. En la pestaña "Sign-in method", habilitar:
   - **Correo electrónico/Contraseña**: Activar

## 3. Configurar Firestore Database

1. En el menú lateral, ir a **Build > Firestore Database**
2. Clic en "Crear base de datos"
3. Seleccionar ubicación (recomendado: us-central1 o southamerica-east1)
4. Iniciar en **modo de producción** (las reglas se configurarán después)

## 4. Configurar Security Rules

1. En Firestore Database, ir a la pestaña **Reglas**
2. Copiar y pegar el contenido del archivo `firestore.rules`
3. Clic en "Publicar"

## 5. Obtener Credenciales del Proyecto

1. Ir a **Configuración del proyecto** (ícono de engranaje)
2. En la sección "Tus apps", clic en el ícono **</>** (Web)
3. Registrar app con el nombre "Sistema Procesos Sumariales Web"
4. Copiar las credenciales que aparecen

Las credenciales se verán así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

## 6. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto con:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
```

## 7. Crear Usuarios Iniciales

### Crear usuario en Authentication

1. Ir a **Authentication > Users**
2. Clic en "Agregar usuario"
3. Ingresar email y contraseña
4. Copiar el **UID** del usuario creado

### Asignar rol en Firestore

1. Ir a **Firestore Database**
2. Crear colección llamada `users`
3. Crear documento con ID = **UID del usuario**
4. Agregar campos:
   ```
   email: "admin@ejemplo.com"
   role: "admin"  (o "viewer")
   ```

Ejemplo de documento:

```
Documento ID: 8kJ2mP9xQsT4vW1yN5bR7cF3h (UID del usuario)
Campos:
  email: string = "admin@ejemplo.com"
  role: string = "admin"
```

## 8. Usuarios de Ejemplo

Crear al menos dos usuarios para probar roles:

**Usuario Administrador:**
```
Email: admin@ejemplo.com
Password: admin123456
Role: admin
```

**Usuario Visualizador:**
```
Email: viewer@ejemplo.com
Password: viewer123456
Role: viewer
```

## 9. Estructura de Firestore

Firebase creará automáticamente las colecciones cuando el sistema guarde datos.

La estructura esperada es:

```
firestore/
├── users/
│   └── [uid]
│       ├── email: string
│       └── role: "admin" | "viewer"
│
└── procesos_sumariales/
    └── [procesoId]
        ├── sirh: boolean
        ├── numero_resolucion: string
        ├── fecha_resolucion: timestamp
        ├── fiscal_actual: object
        ├── activo: boolean
        ├── ... (otros campos)
        │
        ├── ciclos_fiscal/  (subcollection)
        │   └── [cicloId]
        │       ├── fiscal: string
        │       ├── fecha_inicio: timestamp
        │       ├── plazos: object
        │       └── activo: boolean
        │
        └── recusaciones/  (subcollection)
            └── [recusacionId]
                ├── fiscal: string
                ├── fecha: timestamp
                ├── ha_lugar: boolean
                └── ... (otros campos)
```

## 10. Verificar Configuración

1. Iniciar el proyecto: `npm run dev`
2. Intentar hacer login con usuarios creados
3. Verificar que el Dashboard carga correctamente
4. Probar crear un proceso (solo con usuario admin)

## 11. Configuración en Vercel (Deploy)

En el dashboard de Vercel, configurar las variables de entorno:

```
VITE_FIREBASE_API_KEY = [tu valor]
VITE_FIREBASE_AUTH_DOMAIN = [tu valor]
VITE_FIREBASE_PROJECT_ID = [tu valor]
VITE_FIREBASE_STORAGE_BUCKET = [tu valor]
VITE_FIREBASE_MESSAGING_SENDER_ID = [tu valor]
VITE_FIREBASE_APP_ID = [tu valor]
```

## Solución de Problemas Comunes

### Error: "Missing or insufficient permissions"
- Verificar que las Security Rules estén publicadas correctamente
- Verificar que el usuario tenga un documento en la colección `users` con el campo `role`

### Error: "Firebase: Error (auth/invalid-email)"
- Verificar formato del email
- Verificar que el método de autenticación Email/Password esté habilitado

### Usuario no puede ver datos
- Verificar que el usuario esté autenticado
- Verificar que exista documento en `users/[uid]` con el rol correspondiente
- Revisar las Security Rules en Firebase Console

### No se pueden crear procesos
- Verificar que el usuario tenga rol `admin`
- Verificar las Security Rules
- Revisar la consola del navegador para errores

## Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
