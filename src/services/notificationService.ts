// Importa las funciones necesarias de Firestore para interactuar con la base de datos.
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
// Importa la instancia de la base de datos desde la configuración de Firebase.
import { db } from '@/lib/firebase';

// Define el nombre de la colección donde se guardarán las notificaciones.
const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Define la estructura de una respuesta a una notificación.
 */
export interface Reply {
    message: string;        // Contenido del mensaje de respuesta.
    senderId: string;       // ID del usuario que envía la respuesta.
    senderName: string;     // Nombre del usuario que envía la respuesta.
    createdAt: Timestamp;   // Marca de tiempo de cuándo se creó la respuesta.
    imageUrl?: string;
}

/**
 * Define la estructura de una notificación.
 */
export interface Notification {
    id?: string;                        // ID del documento (opcional, asignado por Firestore).
    title: string;                      // Título de la notificación.
    message: string;                    // Mensaje principal de la notificación.
    imageUrl?: string;
    senderId: string;                   // ID del usuario que envía la notificación.
    senderName: string;                 // Nombre del usuario que envía.
    recipient: string;                  // Destinatario: 'all', un rol ('Quality', 'Administrator'), o un ID de usuario específico.
    link?: string;                      // Enlace opcional para redirigir al usuario al hacer clic.
    readBy?: string[];                  // Array de IDs de usuarios que han leído la notificación.
    deletedBy?: string[];               // Array de IDs de usuarios que han eliminado la notificación.
    createdAt?: Timestamp;              // Marca de tiempo de la creación (manejada por el servidor).
    replies?: Reply[];                  // Array de respuestas a la notificación.
}

/**
 * Crea y guarda una nueva notificación en Firestore.
 * @param {Omit<Notification, ...>} notification - El objeto de notificación sin los campos autogenerados.
 * @throws {Error} Si falla la escritura en la base de datos.
 */
export const sendNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'readBy' | 'deletedBy' | 'replies'>) => {
    try {
        // Prepara el objeto de datos a guardar, incluyendo campos autogenerados.
        const notificationData: any = {
            ...notification,
            createdAt: serverTimestamp(), // Usa la marca de tiempo del servidor para la creación.
            readBy: [],                   // Inicializa como un array vacío.
            deletedBy: [],                // Inicializa como un array vacío.
            replies: [],                  // Inicializa como un array vacío.
        };

        // Elimina el campo 'link' si no se proporcionó para no guardarlo como `undefined`.
        if (!notification.link) {
            delete notificationData.link;
        }

        // Añade el nuevo documento a la colección de notificaciones.
        await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
    } catch (error) {
        console.error("Error sending notification: ", error);
        throw error; // Propaga el error para que el llamador pueda manejarlo.
    }
};

/**
 * Envía una notificación desde el "Sistema".
 */
export const sendSystemNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'readBy' | 'deletedBy' | 'replies' | 'senderId' | 'senderName'>) => {
    await sendNotification({
        ...notification,
        senderId: 'system',
        senderName: 'Sistema'
    });
};


/**
 * Devuelve un icono de emoji basado en el estado de una operación.
 * @param {string} status - El texto del estado (ej. "Aprobado", "Falla").
 * @returns {'🔴' | '✅' | '🔄️'} Un emoji representando el estado.
 */
export const getStatusIcon = (status: string) => {
    const negativeStatus = ['Falla', 'No Conforme', 'Retenido', 'No Cumple', 'Rechazado'];
    const positiveStatus = ['Pasa', 'Aprobado', 'Conforme', 'Cumple', 'Verificado', 'Aprobado para Envasar', 'Completado'];

    if(negativeStatus.includes(status)) return '🔴'; // Estado negativo
    if(positiveStatus.includes(status)) return '✅'; // Estado positivo
    return '🔄️'; // Estado neutro o en progreso
}
    
