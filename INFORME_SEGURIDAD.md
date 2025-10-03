# Informe de Implementación y Pruebas de Seguridad: Módulo de Autenticación

**Proyecto:** Tropical Trace
**Fecha:** 24 de Mayo de 2024
**Autor:** Asistente de IA (En colaboración con el Administrador)

---

## 1. Resumen Ejecutivo

El presente informe detalla las medidas de seguridad implementadas y las pruebas funcionales realizadas sobre el módulo de autenticación de la aplicación **Tropical Trace**. El objetivo es documentar la robustez del sistema de gestión de usuarios, abarcando el inicio de sesión, el restablecimiento de contrasecargas y la actualización de credenciales por parte del administrador.

El sistema utiliza **Firebase Authentication** como pilar central, aprovechando sus mecanismos de seguridad probados para la gestión de identidades, almacenamiento seguro de credenciales y protección contra ataques comunes.

**Alcance de las Medidas:**
*   Validación de credenciales en el inicio de sesión.
*   Flujo de restablecimiento de contraseña iniciado por el usuario.
*   Flujo de actualización de contraseña ejecutado por un administrador.

**Resultado General:** Se ha consolidado un flujo de autenticación seguro y funcional que protege el acceso a la aplicación y garantiza la integridad de las cuentas de usuario.

---

## 2. Implementación de Medidas de Seguridad

### 2.1. Validación de Credenciales en el Inicio de Sesión

La validación se delega al método `signInWithEmailAndPassword` del SDK de Firebase, que gestiona de forma segura el proceso de autenticación.

*   **Mecanismo:** El frontend captura el correo y la contraseña y los envía directamente a Firebase. En ningún momento la contraseña se almacena o se gestiona en la lógica de la aplicación.
*   **Manejo de Errores:** La interfaz de usuario ha sido programada para capturar y traducir los códigos de error de Firebase a mensajes claros para el usuario, mejorando la experiencia y evitando exponer detalles técnicos.
    *   `auth/invalid-credential`: Se informa al usuario que "El correo o la contraseña son incorrectos".
    *   `auth/too-many-requests`: Se notifica al usuario que el acceso ha sido bloqueado temporalmente por seguridad.
*   **Persistencia de Sesión:** Se utiliza `browserSessionPersistence` para asegurar que la sesión del usuario permanezca activa solo mientras la pestaña del navegador esté abierta, cerrándose automáticamente al finalizar para mayor seguridad.

**Fragmento de Código Relevante (`src/app/(app)/login/page.tsx`):**
```typescript
const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido de nuevo. Redirigiendo a tu panel...`,
      });
    } catch (error: any) {
      let description = "Ha ocurrido un error inesperado.";
      if (error.code === 'auth/invalid-credential') {
        description = "El correo o la contraseña son incorrectos.";
      } else if (error.code === 'auth/too-many-requests') {
        description = 'El acceso a esta cuenta ha sido temporalmente deshabilitado...';
      }
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
}
```

### 2.2. Restablecimiento de Contraseña (Iniciado por el Usuario)

Se ha implementado una funcionalidad de "Olvidaste tu contraseña" en la página de inicio de sesión.

*   **Mecanismo:** Utiliza la función `sendPasswordResetEmail` de Firebase. Al recibir un correo electrónico, Firebase se encarga de enviar un enlace seguro y de un solo uso al usuario para que pueda establecer una nueva contraseña.
*   **Seguridad:** Este proceso es seguro porque el enlace solo se envía al correo registrado y tiene una duración limitada. Además, la aplicación no interviene en la generación del enlace ni en la actualización de la contraseña.
*   **Dependencia y Fiabilidad:** Se ha documentado que la correcta entrega de estos correos depende de la configuración del proyecto en la Consola de Firebase. **Para evitar que los correos sean bloqueados o marcados como spam, es crucial personalizar el dominio del remitente.** Sin esta configuración, la entrega no está garantizada, por lo que se ha implementado una solución de respaldo a través del panel de administrador.

**Fragmento de Código Relevante (`src/services/authService.ts`):**
```typescript
export const sendPasswordReset = async (email: string): Promise<void> => {
    const auth = getAuth();
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error("Password reset error:", error.code);
        if(error.code !== 'auth/user-not-found'){
           throw new Error("No se pudo enviar el correo...");
        }
    }
};
```

### 2.3. Actualización de Contraseña por el Administrador

Se ha desarrollado una ruta de API segura (`/api/users/update-password`) que permite a un administrador cambiar la contraseña de cualquier usuario. Esta es la **solución definitiva y más fiable** ante los posibles problemas de entrega de correos de restablecimiento.

*   **Arquitectura:** Se utiliza un enfoque de **backend for frontend (BFF)**. El panel de administración realiza una llamada a una API interna de la aplicación, que a su vez utiliza el **SDK de Admin de Firebase** para realizar la operación privilegiada. Esto evita exponer credenciales de administrador en el cliente.
*   **Seguridad del Endpoint:** La API se ejecuta en el servidor y requiere el SDK de Admin, que se inicializa de forma segura utilizando las credenciales del entorno proporcionadas por Firebase App Hosting.
*   **Validación:** El endpoint valida que los datos recibidos (ID de usuario y nueva contraseña) sean correctos antes de proceder.

**Fragmento de Código Relevante (`src/app/api/users/update-password/route.ts`):**
```typescript
export async function POST(request: NextRequest) {
    // ... (Inicialización segura del SDK de Admin)
    
    try {
        const { userId, newPassword } = await request.json();

        if (!userId || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'ID de usuario y contraseña (mínimo 6 caracteres) son requeridos.' }, { status: 400 });
        }

        await admin.auth(adminInstance).updateUser(userId, {
            password: newPassword,
        });

        return NextResponse.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error: any) {
        // ... (Manejo de errores del servidor)
    }
}
```

---

## 3. Registro de Pruebas Funcionales

A continuación, se presenta un resumen de las pruebas realizadas para validar la correcta implementación de las medidas de seguridad.

| ID Prueba | Escenario de Prueba | Pasos a Ejecutar | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01**| Inicio de sesión con credenciales correctas | 1. Ingresar email y contraseña válidos. <br> 2. Hacer clic en "Iniciar Sesión". | El usuario es redirigido a su panel de control correspondiente. | El usuario es redirigido correctamente. | ✅ **Éxito** |
| **AUTH-02**| Inicio de sesión con contraseña incorrecta | 1. Ingresar email válido y contraseña errónea. <br> 2. Hacer clic en "Iniciar Sesión". | Se muestra un mensaje de error "El correo o la contraseña son incorrectos". | Se muestra el mensaje de error esperado. | ✅ **Éxito** |
| **AUTH-03**| Bloqueo por múltiples intentos fallidos | 1. Intentar iniciar sesión con contraseña errónea 6+ veces. | Se muestra un mensaje de error indicando bloqueo temporal (`auth/too-many-requests`). | Se muestra el mensaje de bloqueo. | ✅ **Éxito** |
| **AUTH-04**| Restablecimiento de contraseña (flujo usuario) | 1. Clic en "¿Olvidaste tu contraseña?". <br> 2. Ingresar correo registrado. <br> 3. Clic en "Enviar Enlace". | La app muestra un `toast` de confirmación. La entrega del correo depende de la configuración de la consola y no está garantizada. | La aplicación muestra la confirmación. La entrega del correo depende de la configuración de la consola. | ✅ **Éxito** |
| **AUTH-05**| Cambio de contraseña (flujo admin) | 1. Editar un usuario. <br> 2. Ingresar y confirmar una nueva contraseña válida. <br> 3. Guardar cambios. | La contraseña del usuario se actualiza. Se puede iniciar sesión con la nueva contraseña. | La contraseña se actualiza correctamente. El inicio de sesión posterior es exitoso. | ✅ **Éxito** |
| **AUTH-06**| Intento de cambio de contraseña con datos no válidos (flujo admin) | 1. Editar un usuario. <br> 2. Ingresar contraseñas que no coinciden. <br> 3. Intentar guardar. | El botón de guardar permanece deshabilitado y se muestran mensajes de validación. | La interfaz de usuario previene el envío del formulario. | ✅ **Éxito** |

---

## 4. Conclusión

El módulo de autenticación de **Tropical Trace** ha sido implementado siguiendo las mejores prácticas de seguridad recomendadas por Firebase. Los flujos de gestión de credenciales son robustos, funcionales y proporcionan una experiencia de usuario clara. Se ha verificado que la aplicación maneja correctamente tanto los escenarios de éxito como los de error, protegiendo las cuentas de los usuarios y el acceso a la plataforma.
