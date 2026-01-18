# Guía Definitiva: Conectar GitHub a Vercel para Producción (Halador V2)

Sigue estos pasos en orden. Esta es la forma profesional de hacerlo y garantiza que tu link `halador.vercel.app` funcione siempre y se actualice cada vez que guardes cambios.

## FASE 1: Asegurar que el código está en GitHub

Antes de ir a Vercel, tu código debe estar en la nube de GitHub.
Visita tu repositorio: **[https://github.com/luiscandela19/halador](https://github.com/luiscandela19/halador)**

*   **¿Ves tus archivos ahí?** (Como `src`, `package.json`, etc.)
    *   **SÍ:** Salta a la FASE 2.
    *   **NO (Está vacío):** Tienes que subir el código. La forma más fácil si la terminal falla es usar **GitHub Desktop**:
        1.  Descarga [GitHub Desktop](https://desktop.github.com/).
        2.  Inicia sesión con tu cuenta `luiscandela19`.
        3.  Ve a **File** > **Add Local Repository**.
        4.  Busca y selecciona la carpeta de tu proyecto: `.../halador-v2`.
        5.  Haz clic en **"Push origin"** (botón azul arriba).

---

## FASE 2: Conectar y Desplegar en Vercel

1.  Ve a **[vercel.com/new](https://vercel.com/new)**.
2.  En la sección "Import Git Repository", verás tu cuenta de GitHub.
3.  Busca el repositorio **`halador`** y haz clic en el botón **Import**.

### Configuración del Proyecto (¡MUY IMPORTANTE!)

En la pantalla "Configure Project", haz lo siguiente con cuidado:

1.  **Project Name:**
    *   Escribe **`halador`**.
    *   *Nota: Si Vercel dice que ya existe, es porque lo creamos antes con la terminal. Para sobrescribirlo o tomar control, Vercel te pedirá confirmación o tendrás que borrar el viejo primero en Settings > Delete.*

2.  **Framework Preset:**
    *   Debe decir **Next.js**.

3.  **Root Directory:**
    *   Déjalo como está (`./`).

4.  **Environment Variables (Variables de Entorno):**
    *   Despliega esta sección. **ESTO ES CRÍTICO**. Si no lo haces, la app dará Error 500 o se quedará cargando.
    *   Añade estas dos variables una por una:

    | Nombre (Key) | Valor (Value) |
    | :--- | :--- |
    | `NEXT_PUBLIC_SUPABASE_URL` | `https://sgglwpcjeirbnrwgqney.supabase.co` |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZ2x3cGNqZWlyYm5yd2dxbmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjg4MDIsImV4cCI6MjA4MjY0NDgwMn0.Z5cYYoJlFsbTx9zNGHWjQgWkirllx3MeRqPsHUo6t_g` |

5.  Haz clic en **Deploy**.

---

## FASE 3: Verificación

Vercel tardará unos 2 minutos construyendo la app.
*   Si todo sale bien, verás una pantalla de "Congratulations!".
*   Tu link será: **`https://halador.vercel.app`** (si conseguiste el nombre) o algo similar.

### ¿Qué hago si actualizo el código?
Solo tienes que hacer un "Push" desde tu computadora (terminal o GitHub Desktop) a GitHub. Vercel detectará el cambio y actualizará la página web automáticamente.
