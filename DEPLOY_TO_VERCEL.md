# Guía de Despliegue en Vercel - Halador V2

Para presentar el proyecto a tus inversionistas con el enlace `halador.vercel.app`, sigue estos pasos exactos. 

**Nota importante:** Vercel usa la extensión `.app` para sus subdominios gratuitos (ej. `halador.vercel.app`). La extensión `.com` es propiedad de Vercel Inc. y no se asigna a proyectos de usuarios.

## Paso 1: Preparar tu Repositorio (GitHub)

Vercel necesita leer tu código desde GitHub para construir el sitio.

1.  **Crea una cuenta en GitHub** (si no tienes una) en [github.com](https://github.com).
2.  **Crea un Nuevo Repositorio** llamado `halador-v2`.
3.  **Sube tu código** actual a ese repositorio.
    *   Si tienes Git instalado en tu PC, ejecuta esto en la terminal de tu proyecto:
        ```bash
        git init
        git add .
        git commit -m "Halador V2 Release"
        git branch -M main
        git remote add origin https://github.com/TU_USUARIO/halador-v2.git
        git push -u origin main
        ```
    *   *(Si no estás familiarizado con la terminal, puedes usar GitHub Desktop para arrastrar la carpeta y publicarla).*

## Paso 2: Conectar con Vercel

1.  Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de **GitHub**.
2.  En el Dashboard, haz clic en **"Add New..."** -> **"Project"**.
3.  Verás una lista de tus repositorios de GitHub. Busca `halador-v2` y haz clic en **"Import"**.

## Paso 3: Configuración del Proyecto (CRÍTICO)

En la pantalla de configuración de Vercel ("Configure Project"):

1.  **Project Name (Nombre del Proyecto)**:
    *   Aquí es donde defines la URL.
    *   Escribe: `halador`
    *   *Si Vercel te dice que ya está tomado (es muy probable porque es un nombre común), intenta variaciones profesionales como `halador-app`, `halador-oficial` o `halador-v2`.*

2.  **Environment Variables (Variables de Entorno)**:
    *   Despliega esta sección. Debes copiar las claves de tu archivo `.env.local` aquí.
    *   **NO OLVIDES ESTO** o la app no funcionará.
    *   Añade:
        *   `NEXT_PUBLIC_SUPABASE_URL`: (Tu URL de Supabase)
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Tu Clave Anon de Supabase)

3.  Haz clic en **"Deploy"**.

## Paso 4: Finalización

Vercel construirá tu aplicación (tardará 1-2 minutos). Cuando termine, verás fuegos artificiales.

*   Tu link será: `https://halador.vercel.app` (o el nombre que hayas logrado asegurar).
*   Envíale este link a tus inversionistas.

---

### ¿Quieres un dominio .com real? (Opcional para Inversionistas)

Si quieres impresionar aún más y tener `www.halador.com`:

1.  Compra el dominio en Namecheap o GoDaddy (aprox $10 USD).
2.  En Vercel, ve a **Settings** -> **Domains**.
3.  Escribe `halador.com` y sigue las instrucciones para conectar los DNS.
