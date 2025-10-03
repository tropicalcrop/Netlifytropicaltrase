

// Importa los tipos necesarios de Next.js para manejar peticiones y respuestas de API.
import { type NextRequest, NextResponse } from 'next/server';
// Importa el SDK de Admin de Firebase para realizar operaciones con privilegios de administrador.
import * as admin from 'firebase-admin';

/**
 * Helper para inicializar el SDK de Admin de Firebase, asegurando que solo se haga una vez (patrón singleton).
 * @returns {admin.app.App} La instancia de la aplicación de Firebase Admin.
 */
function getFirebaseAdmin() {
    // Si ya hay instancias de la app, devuelve la primera para evitar reinicializaciones.
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }
    // En un backend desplegado en App Hosting, las credenciales se configuran automáticamente a través de variables de entorno.
    // `initializeApp()` sin argumentos usará estas credenciales.
    return admin.initializeApp();
}

/**
 * Manejador para la petición POST que actualiza la contraseña de un usuario.
 * Este es un endpoint de API seguro que solo debe ser llamado desde el backend.
 * @param {NextRequest} request - El objeto de la petición entrante.
 * @returns {Promise<NextResponse>} La respuesta JSON, ya sea de éxito o de error.
 */
export async function POST(request: NextRequest) {
    try {
        // Parsea el cuerpo de la petición para obtener el ID del usuario y la nueva contraseña.
        const { userId, newPassword } = await request.json();

        // Valida que los datos requeridos estén presentes y que la contraseña cumpla con el mínimo de longitud.
        if (!userId || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'ID de usuario y contraseña (mínimo 6 caracteres) son requeridos.' }, { status: 400 });
        }

        // Obtiene la instancia del SDK de Admin y llama al método para actualizar el usuario.
        // `auth()` es llamado sobre la instancia de la app.
        await getFirebaseAdmin().auth().updateUser(userId, {
            password: newPassword,
        });

        // Devuelve una respuesta de éxito.
        return NextResponse.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error: any) {
        console.error('Error updating password:', error);

        // Manejo de errores específicos del SDK de Admin de Firebase.
        if (error.code === 'app/no-app' || error.code === 'app/duplicate-app') {
             return NextResponse.json({ error: 'El servidor de Firebase Admin no pudo inicializarse correctamente.' }, { status: 500 });
        }
        
        // Prepara un mensaje de error genérico para la respuesta.
        const errorMessage = error.message || 'Ocurrió un error desconocido al actualizar la contraseña.';
        const errorCode = error.code || 'unknown-error';
        return NextResponse.json({ error: `Error del servidor: ${errorMessage} (código: ${errorCode})` }, { status: 500 });
    }
}
