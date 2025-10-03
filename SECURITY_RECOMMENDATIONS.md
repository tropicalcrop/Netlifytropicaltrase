# Recomendaciones de Seguridad para Tropical Trace

Esta es una guía con las mejores prácticas de seguridad recomendadas para fortalecer la aplicación y prepararla para un entorno de producción.

## 1. Implementación de Reglas de Seguridad de Firestore (Prioridad Alta)

Esta es la medida de seguridad más importante que se debe implementar. Las reglas de seguridad se ejecutan en los servidores de Firebase y protegen tus datos del acceso no autorizado, independientemente de la lógica de tu aplicación cliente.

**Ubicación del archivo:** Debes crear un archivo llamado `firestore.rules` en la raíz de tu proyecto.

**Ejemplo de `firestore.rules`:**

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Función auxiliar para verificar si un usuario está autenticado.
    function isSignedIn() {
      return request.auth != null;
    }

    // Función para obtener los datos del perfil del usuario que realiza la solicitud.
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    // Función para verificar si el usuario tiene un rol específico.
    function hasRole(role) {
      return isSignedIn() && getUserData().role == role;
    }

    // --- REGLAS PARA USUARIOS ---
    match /users/{userId} {
      // Solo los administradores pueden crear, ver o eliminar usuarios.
      allow read, delete: if hasRole('Administrator');
      // Un usuario puede actualizar su propia información. Un admin puede actualizar la de cualquiera.
      allow create, update: if hasRole('Administrator') || request.auth.uid == userId;
    }

    // --- REGLAS PARA PRODUCCIÓN, HIGIENE, CALIDAD, ETC. ---
    // Estas colecciones requieren que el usuario sea del rol de Producción, Calidad o Administrador.
    match /{collection}/{docId} where collection in ['production', 'hygiene', 'formulations', 'quality_luminometry', 'quality_sensory', 'quality_allergens', 'quality_area_inspection', 'quality_in_process', 'quality_finished_product', 'endowment', 'pcc', 'scales', 'utensils'] {
      
      // Quién puede leer: Cualquier rol autorizado.
      allow read: if hasRole('Administrator') || hasRole('Quality') || hasRole('Production');

      // Quién puede crear: Producción y Administradores.
      allow create: if hasRole('Administrator') || hasRole('Production');

      // Quién puede actualizar:
      // - El usuario que creó el registro (si es de Producción).
      // - Cualquier usuario de Calidad.
      // - Cualquier Administrador.
      allow update: if hasRole('Administrator') || hasRole('Quality') || (hasRole('Production') && resource.data.responsible.id == request.auth.uid);
      
      // Quién puede eliminar: Solo Administradores.
      allow delete: if hasRole('Administrator');
    }
    
    // --- REGLAS PARA REPORTES (si se guardaran en la BD) ---
    // Por ahora, los reportes se generan al vuelo, pero si hubiera una colección:
    match /reports/{reportId} {
      // Solo los administradores pueden gestionar reportes.
      allow read, write, create, delete: if hasRole('Administrator');
    }

    // --- REGLAS PARA NOTIFICACIONES ---
    match /notifications/{notificationId} {
        // Cualquiera puede crear una notificación (ej. Administrador enviando, o usuario respondiendo)
        allow create: if isSignedIn();
        // Un usuario puede leer una notificación si es el destinatario, si es para su rol, si es para todos, o si es el emisor.
        allow read: if isSignedIn() && 
                      (resource.data.recipient == request.auth.uid || 
                       resource.data.recipient == getUserData().role ||
                       resource.data.recipient == 'all' ||
                       resource.data.senderId == request.auth.uid);
        // Un usuario puede actualizar una notificación (ej. para marcarla como leída o eliminarla lógicamente) si es el destinatario.
        allow update: if isSignedIn() && 
                      (resource.data.recipient == request.auth.uid || 
                       resource.data.recipient == getUserData().role ||
                       resource.data.recipient == 'all');
    }
  }
}
```

## 2. Validación de Datos en el Lado del Servidor (Server-Side)

Aunque ya se usa `zod` y `react-hook-form` en el cliente, esto puede ser omitido. La validación en el servidor es la fuente de verdad.

*   **Sugerencia:** Implementar **Firebase Functions** que se activen antes de escribir en la base de datos (`onWrite` trigger). Estas funciones pueden usar `zod` para validar que la estructura y los tipos de datos son correctos, rechazando cualquier escritura que no cumpla con el esquema. Esto previene la corrupción de datos y ataques de inyección.

## 3. Registro de Auditoría (Audit Log)

Para una trazabilidad completa y por requerimientos de normativas de la industria alimentaria, es crucial saber quién hizo qué y cuándo.

*   **Sugerencia:** Crear una nueva colección en Firestore llamada `audit_log`. Usando Firebase Functions, se puede registrar automáticamente un documento por cada acción crítica:
    *   **Ejemplo de evento a registrar:** Creación de usuario, eliminación de un lote de producción, cambio de estado de un lote a "Retenido", modificación de una formulación.
    *   **Datos a guardar:** `userId`, `actionType` (ej. 'DELETE_LOT'), `timestamp`, `details` (ej. `{ lotId: 'P2024-101' }`).

## 4. Encabezados de Seguridad y Políticas de Contenido (CSP)

Next.js permite configurar encabezados HTTP personalizados para añadir una capa extra de seguridad a nivel de navegador.

*   **Sugerencia:** En el archivo `next.config.ts`, puedes añadir encabezados como:
    *   `Content-Security-Policy`: Para restringir de dónde se pueden cargar recursos (scripts, imágenes), previniendo ataques XSS.
    *   `X-Content-Type-Options: nosniff`: Evita que el navegador interprete archivos con un tipo MIME diferente al declarado.
    *   `X-Frame-Options: DENY`: Previene que tu aplicación sea incrustada en un `<iframe>` en otro sitio (ataques de clickjacking).

```javascript
// en next.config.ts
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  // ... resto de tu configuración
};

export default nextConfig;
```
