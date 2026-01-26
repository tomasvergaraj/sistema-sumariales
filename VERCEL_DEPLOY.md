# Guía de Deploy en Vercel

Esta guía te ayudará a desplegar el Sistema de Procesos Sumariales en Vercel.

## Requisitos Previos

- Cuenta en [Vercel](https://vercel.com)
- Proyecto de Firebase configurado (ver FIREBASE_SETUP.md)
- Código del proyecto en un repositorio Git (GitHub, GitLab, o Bitbucket)

## Opción 1: Deploy desde la Interfaz Web

### Paso 1: Importar Proyecto

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Clic en "Add New..." > "Project"
3. Importar tu repositorio Git
4. Seleccionar el repositorio del proyecto

### Paso 2: Configurar Proyecto

Vercel detectará automáticamente que es un proyecto Vite. Si no lo hace:

- **Framework Preset**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Paso 3: Configurar Variables de Entorno

En la sección "Environment Variables", agregar:

```
VITE_FIREBASE_API_KEY = tu_valor_aquí
VITE_FIREBASE_AUTH_DOMAIN = tu_valor_aquí
VITE_FIREBASE_PROJECT_ID = tu_valor_aquí
VITE_FIREBASE_STORAGE_BUCKET = tu_valor_aquí
VITE_FIREBASE_MESSAGING_SENDER_ID = tu_valor_aquí
VITE_FIREBASE_APP_ID = tu_valor_aquí
```

**IMPORTANTE**: Copiar los valores exactos desde tu archivo `.env` o desde Firebase Console.

### Paso 4: Deploy

1. Clic en "Deploy"
2. Esperar a que termine el proceso (2-3 minutos)
3. Una vez completado, recibirás una URL como: `https://tu-proyecto.vercel.app`

## Opción 2: Deploy desde CLI

### Paso 1: Instalar Vercel CLI

```bash
npm i -g vercel
```

### Paso 2: Login en Vercel

```bash
vercel login
```

Seguir las instrucciones en el navegador.

### Paso 3: Deploy

Desde la raíz del proyecto:

```bash
vercel
```

El CLI te hará algunas preguntas:

- **Set up and deploy**: Yes
- **Which scope**: Seleccionar tu cuenta
- **Link to existing project**: No (primera vez)
- **Project name**: sistema-sumariales (o el que prefieras)
- **Directory**: ./ (dejar por defecto)

### Paso 4: Configurar Variables de Entorno

```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
```

Para cada comando, te pedirá:
1. El valor de la variable
2. Para qué entornos (seleccionar Production, Preview, Development)

### Paso 5: Deploy a Producción

```bash
vercel --prod
```

## Configuración Adicional

### Dominio Personalizado

1. En Vercel Dashboard, ir a tu proyecto
2. Ir a "Settings" > "Domains"
3. Agregar tu dominio personalizado
4. Seguir las instrucciones para configurar DNS

### Configuración de Build

En `vercel.json` (crear si no existe):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Redirects para SPA

Crear archivo `vercel.json` en la raíz:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Esto asegura que todas las rutas de React Router funcionen correctamente.

## Verificación Post-Deploy

### 1. Verificar que el sitio carga

Abrir la URL de Vercel y verificar que carga la página de login.

### 2. Probar autenticación

Intentar iniciar sesión con un usuario creado en Firebase.

### 3. Verificar conexión a Firebase

En la consola del navegador (F12), no deberían aparecer errores de Firebase.

### 4. Probar funcionalidades

- Login/Logout
- Dashboard
- Listar procesos
- Crear proceso (usuario admin)

## Actualizar el Deploy

### Deploy automático desde Git

Vercel hace deploy automático cuando haces push a la rama principal:

```bash
git add .
git commit -m "Actualización del sistema"
git push origin main
```

### Deploy manual

```bash
vercel --prod
```

## Gestión de Entornos

Vercel ofrece tres entornos:

1. **Production**: URL principal del sitio
2. **Preview**: Deploy de cada branch/PR
3. **Development**: Para desarrollo local

Puedes configurar variables de entorno diferentes para cada uno.

## Monitoreo y Logs

### Ver logs en tiempo real

```bash
vercel logs [deployment-url] --follow
```

### Ver logs en el Dashboard

1. Ir a tu proyecto en Vercel
2. Seleccionar un deployment
3. Ver la pestaña "Logs"

## Solución de Problemas

### Error 404 al navegar

**Problema**: Las rutas de React Router no funcionan en producción.

**Solución**: Agregar el archivo `vercel.json` con las rewrites (ver arriba).

### Variables de entorno no funcionan

**Problema**: Firebase no se conecta en producción.

**Solución**: 
1. Verificar que las variables tengan el prefijo `VITE_`
2. Verificar en Vercel Dashboard > Settings > Environment Variables
3. Re-deployar después de agregar variables

### Build falla

**Problema**: El build no se completa.

**Solución**:
1. Verificar que `package.json` tenga todos los scripts necesarios
2. Verificar que no haya errores de TypeScript
3. Ejecutar `npm run build` localmente para ver errores

### Sitio muy lento

**Problema**: El sitio carga lentamente.

**Solución**:
1. Verificar la ubicación del servidor de Firebase (debe estar cerca)
2. Optimizar imágenes y assets
3. Verificar que no haya requests innecesarios

## Seguridad en Producción

### 1. Proteger variables de entorno

- Nunca commitear el archivo `.env`
- Usar solo variables de Vercel en producción
- Rotar claves si se comprometen

### 2. HTTPS

Vercel proporciona HTTPS automáticamente para todos los dominios.

### 3. Firestore Security Rules

Asegurarse de tener las Security Rules configuradas correctamente (ver FIREBASE_SETUP.md).

### 4. CORS

Si usas dominios personalizados, configurar CORS en Firebase:

1. Firebase Console > Authentication > Settings
2. Agregar dominios autorizados

## Límites de Vercel (Plan Gratuito)

- **Bandwidth**: 100 GB/mes
- **Builds**: 6000 minutos/mes
- **Deployments**: Ilimitados
- **Funciones Serverless**: 100 GB-hours/mes

Para este proyecto, el plan gratuito debería ser suficiente para uso interno.

## Backup y Rollback

### Hacer rollback a un deploy anterior

1. En Vercel Dashboard, ir a tu proyecto
2. Ir a "Deployments"
3. Seleccionar un deployment anterior
4. Clic en "..." > "Promote to Production"

### Backup de código

Mantener el código en Git es tu backup. Además:

- Hacer tags de versiones importantes
- Documentar cambios significativos
- Considerar un repositorio privado

## Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Deployment de Vite en Vercel](https://vercel.com/guides/deploying-vite-with-vercel)

## Soporte

Si tienes problemas:
1. Revisar logs de Vercel
2. Revisar consola del navegador
3. Verificar Firebase Console
4. Contactar a Vercel Support (si es necesario)
