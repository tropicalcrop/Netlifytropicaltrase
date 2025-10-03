
'use client'

// Importa las funciones necesarias de Firebase para autenticación y gestión de la app.
import { initializeApp, getApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, type UserCredential, updatePassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
// Importa la configuración de Firebase desde el archivo centralizado.
import { firebaseConfig } from "@/lib/firebase";

/**
 * Crea un nuevo usuario en Firebase Authentication sin iniciar sesión con él.
 * Esto es útil para que un administrador cree cuentas para otros.
 * Utiliza una instancia temporal y secundaria de la app de Firebase para evitar
 * conflictos con la sesión del usuario actual.
 * @param {string} email - El correo del nuevo usuario.
 * @param {string} password - La contraseña del nuevo usuario.
 * @returns {Promise<UserCredential>} La credencial del usuario recién creado.
 * @throws {Error} Si la creación del usuario falla.
 */
export const createUserWithoutSignIn = async (email: string, password: string): Promise<UserCredential> => {
    // Genera un nombre único para la instancia temporal de la app.
    const tempAppName = `temp-auth-app-${Date.now()}`;
    
    // Intenta obtener la app si ya existe; si no, la inicializa.
    let tempApp;
    try {
      tempApp = getApp(tempAppName);
    } catch (e) {
      tempApp = initializeApp(firebaseConfig, tempAppName);
    }
    
    try {
        // Obtiene el servicio de autenticación para la app temporal.
        const tempAuth = getAuth(tempApp);
        
        // Crea el usuario usando el servicio de autenticación temporal.
        const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
        
        return userCredential;
    } catch (error) {
        // Propaga el error para que sea manejado por el código que llamó a esta función.
        throw error;
    } finally {
        // En el bloque `finally`, se asegura de limpiar y eliminar la app temporal.
        if (tempApp) {
            await deleteApp(tempApp);
        }
    }
};

/**
 * Actualiza la contraseña del usuario actualmente autenticado.
 * @param {string} newPassword - La nueva contraseña.
 * @throws {Error} Si no hay un usuario autenticado o si la actualización falla.
 */
export const updateUserPassword = async (newPassword: string): Promise<void> => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error("No hay un usuario autenticado para actualizar la contraseña.");
    }

    try {
        await updatePassword(user, newPassword);
    } catch (error: any) {
        console.error("Error updating password:", error);
        // Firebase requiere que el inicio de sesión sea reciente para operaciones sensibles.
        // Si no lo es, lanza este error.
        if (error.code === 'auth/requires-recent-login') {
            throw new Error('Por seguridad, debe cerrar sesión y volver a iniciarla antes de cambiar la contraseña.');
        }
        throw new Error('No se pudo actualizar la contraseña.');
    }
}

/**
 * Permite a un administrador actualizar la contraseña de cualquier usuario a través de una API segura.
 * @param {string} userId - El ID del usuario a modificar.
 * @param {string} newPassword - La nueva contraseña.
 * @returns {Promise<{success: boolean, message: string}>} Un objeto indicando el éxito de la operación.
 * @throws {Error} Si la llamada a la API falla.
 */
export const updateUserPasswordByAdmin = async (userId: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    try {
        // Realiza una petición POST al endpoint de la API interna.
        const response = await fetch('/api/users/update-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, newPassword }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Falló la actualización de la contraseña.');
        }

        return { success: true, message: result.message };
    } catch (error: any) {
        console.error('Error al llamar a la API de actualización de contraseña:', error);
        throw new Error(error.message || 'Ocurrió un error en el servidor al intentar actualizar la contraseña.');
    }
};

/**
 * Envía un correo de restablecimiento de contraseña a un email específico.
 * @param {string} email - El correo al que se enviará el enlace de restablecimiento.
 * @throws {Error} Si ocurre un error inesperado al enviar el correo.
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
    const auth = getAuth();
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        // Por seguridad, no se revela al usuario si un correo existe o no en la base de datos.
        // Se captura el error 'auth/user-not-found' pero no se lanza al usuario.
        console.error("Password reset error:", error.code);
        if(error.code !== 'auth/user-not-found'){
           throw new Error("No se pudo enviar el correo de restablecimiento. Por favor, inténtelo de nuevo.");
        }
    }
};
