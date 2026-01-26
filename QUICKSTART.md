# 🚀 Guía Rápida de Inicio

## Instalación y Configuración Rápida

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Firebase

Crear archivo `.env` en la raíz:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

Ver **FIREBASE_SETUP.md** para instrucciones detalladas.

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

Abrir http://localhost:5173

### 4. Crear usuarios de prueba

En Firebase Console > Authentication, crear usuarios:

- **Admin**: admin@test.com / admin123456
- **Viewer**: viewer@test.com / viewer123456

Luego en Firestore, colección `users`:

```
Documento: [UID del usuario admin]
{
  email: "admin@test.com",
  role: "admin"
}

Documento: [UID del usuario viewer]
{
  email: "viewer@test.com",
  role: "viewer"
}
```

### 5. Login y probar

Ir a http://localhost:5173/login e ingresar con los usuarios creados.

## Deploy en Vercel

### Opción rápida: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Ver **VERCEL_DEPLOY.md** para instrucciones completas.

## Estructura del Proyecto

```
src/
├── pages/          # Páginas principales
├── components/     # Componentes reutilizables
├── layouts/        # Layouts de página
├── hooks/          # Custom hooks
├── context/        # Estado global (Zustand)
├── services/       # Firebase y otros servicios
├── types/          # Tipos TypeScript
└── styles/         # Estilos globales
```

## Comandos Útiles

```bash
npm run dev      # Desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # Linter
```

## Características Principales

✅ Dashboard con estadísticas en tiempo real
✅ Gestión completa de procesos (CRUD)
✅ Control automático de plazos (20, 40, 60 días)
✅ Cambio de fiscal con reinicio de plazos
✅ Roles de usuario (Admin / Viewer)
✅ Interfaz moderna y amigable
✅ Responsive design
✅ Trazabilidad completa

## Próximos Pasos

1. Personalizar colores en `tailwind.config.js`
2. Agregar más validaciones según necesidades
3. Implementar exportación a Excel
4. Agregar notificaciones de plazos próximos a vencer

## Soporte

Para dudas o problemas:
- Revisar README.md completo
- Revisar FIREBASE_SETUP.md
- Revisar VERCEL_DEPLOY.md
