

// Importa las instancias de Firestore y Storage inicializadas desde la configuración de Firebase.
import { db, storage } from '@/lib/firebase';
// Importa todas las funciones necesarias de Firestore y Storage para interactuar con los servicios.
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, query, getDoc, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Obtiene todos los documentos de una colección específica en Firestore.
 * @template T - El tipo de dato esperado de los documentos.
 * @param {string} collectionName - El nombre de la colección a consultar.
 * @returns {Promise<T[]>} Una promesa que se resuelve con un array de documentos.
 */
export const getAll = async <T>(collectionName: string): Promise<T[]> => {
    // Realiza una consulta para obtener todos los documentos de la colección.
    const querySnapshot = await getDocs(collection(db, collectionName));
    // Mapea sobre los documentos obtenidos, añadiendo el ID de cada documento a su objeto de datos.
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

/**
 * Obtiene un único documento por su ID de una colección específica.
 * @template T - El tipo de dato esperado del documento.
 * @param {string} collectionName - El nombre de la colección.
 * @param {string} id - El ID del documento a obtener.
 * @returns {Promise<T | null>} Una promesa que se resuelve con el documento o null si no se encuentra.
 */
export const getById = async <T>(collectionName: string, id: string): Promise<T | null> => {
    // Crea una referencia al documento específico.
    const docRef = doc(db, collectionName, id);
    // Obtiene la instantánea (snapshot) del documento.
    const docSnap = await getDoc(docRef);
    // Si el documento existe, devuelve sus datos junto con su ID.
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
        // Si no existe, devuelve null.
        return null;
    }
};

/**
 * Añade un nuevo documento o actualiza uno existente en una colección.
 * Si el objeto `data` tiene un `id`, actualiza el documento. Si no, crea uno nuevo.
 * @template T - El tipo de dato, que debe extender de un objeto con un `id` opcional.
 * @param {string} collectionName - El nombre de la colección.
 * @param {T} data - Los datos a guardar.
 * @returns {Promise<T>} Una promesa que se resuelve con los datos guardados, incluyendo el ID.
 */
export const addOrUpdate = async <T extends { id?: string | number }>(collectionName: string, data: T): Promise<T> => {
    // Si el `data` tiene un `id`, crea una referencia a ese documento para actualizarlo.
    // Si no, crea una referencia a un nuevo documento con un ID autogenerado.
    const docRef = data.id ? doc(db, collectionName, String(data.id)) : doc(collection(db, collectionName));
    
    // Asegura que el objeto de datos final incluye el ID del documento, especialmente crucial para documentos nuevos.
    // También se asegura de que el campo `cycleId` exista si es relevante, inicializándolo a `null` si no está presente.
    const finalData = { ...data, id: docRef.id, cycleId: data.hasOwnProperty('cycleId') ? (data as any).cycleId : null };
    
    // Guarda los datos en Firestore. `merge: true` evita sobrescribir todo el documento,
    // permitiendo actualizaciones parciales si no todos los campos están presentes en `finalData`.
    await setDoc(docRef, finalData, { merge: true });
    
    // Devuelve los datos finales con el ID asegurado.
    return finalData as T;
};


/**
 * Elimina un documento de una colección por su ID.
 * @param {string} collectionName - El nombre de la colección.
 * @param {string | number} id - El ID del documento a eliminar.
 * @returns {Promise<void>} Una promesa que se resuelve cuando el documento ha sido eliminado.
 */
export const remove = async (collectionName: string, id: string | number): Promise<void> => {
    // Crea una referencia al documento y lo elimina.
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
};

/**
 * Archiva todos los registros de calidad activos (aquellos sin `cycleId`) asignándoles un nuevo ID de ciclo.
 * Esto se usa para "cerrar" un ciclo de producción y empezar uno nuevo.
 * @param {string[]} collectionNames - Un array con los nombres de las colecciones a archivar.
 * @param {string} cycleId - El nuevo ID del ciclo que se asignará a los registros.
 * @returns {Promise<void>} Una promesa que se resuelve cuando todos los registros han sido actualizados.
 */
export const archiveQualityRecords = async (collectionNames: string[], cycleId: string): Promise<void> => {
    // Inicia una operación de escritura por lotes (batch) para realizar múltiples actualizaciones de forma atómica.
    const batch = writeBatch(db);
    
    // Itera sobre cada nombre de colección proporcionado.
    for (const collectionName of collectionNames) {
        // Crea una consulta para encontrar solo los documentos activos (cycleId es null).
        const q = query(collection(db, collectionName), where('cycleId', '==', null));
        const snapshot = await getDocs(q);
        
        // Añade una operación de actualización al lote por cada documento encontrado.
        snapshot.docs.forEach(document => {
            const docRef = doc(db, collectionName, document.id);
            batch.update(docRef, { cycleId });
        });
    }
    
    // Ejecuta todas las operaciones en el lote.
    await batch.commit();
};


/**
 * Siembra datos iniciales en una colección solo si está vacía.
 * @param {string} collectionName - El nombre de la colección.
 * @param {any[]} initialData - Un array de objetos con los datos iniciales.
 */
export const seedInitialData = async (collectionName: string, initialData: any[]) => {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    // Solo procede si la colección no tiene documentos.
    if (snapshot.empty) {
        const batch = writeBatch(db);
        initialData.forEach((item) => {
            // Permite el uso de un ID personalizado si se provee en `customId`, sino, genera uno nuevo.
            const docRef = item.customId ? doc(db, collectionName, item.customId) : doc(collection(db, collectionName));
            
            const { customId, ...itemData } = item;
            // Asegura que los datos sembrados tengan `id` y `cycleId: null`.
            const finalData = { ...itemData, id: docRef.id, cycleId: null };

            batch.set(docRef, finalData);
        });
        await batch.commit();
        console.log(`Seeded ${collectionName} with ${initialData.length} documents.`);
    }
};

/**
 * Sube un archivo a Firebase Storage y devuelve su URL de descarga.
 * @param {File} file - El archivo a subir.
 * @param {string} path - La ruta completa (incluyendo nombre de archivo) donde se guardará en Storage.
 * @returns {Promise<string>} La URL de descarga pública del archivo.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
    // Crea una referencia a la ubicación del archivo en Firebase Storage.
    const storageRef = ref(storage, path);
    // Sube el archivo.
    const snapshot = await uploadBytes(storageRef, file);
    // Obtiene la URL de descarga del archivo recién subido.
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};
