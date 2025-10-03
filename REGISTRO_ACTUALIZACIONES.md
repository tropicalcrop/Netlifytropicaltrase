# Registro de Actualizaciones y Funcionalidades

**Proyecto:** Tropical Trace
**Fecha:** 24 de Mayo de 2024
**Autor:** Asistente de IA

---

## 1. Actualización del Sistema de Notificaciones

Se ha implementado y mejorado el sistema de notificaciones en tiempo real para optimizar la comunicación y la capacidad de respuesta entre los diferentes roles de la aplicación.

### 1.1. Propósito y Funcionamiento

El sistema de notificaciones tiene como objetivo principal alertar a los usuarios sobre eventos importantes que ocurren en la aplicación. Esto se logra mediante un ícono de campana (`NotificationBell`) en la barra de navegación que muestra un indicador visual cuando hay mensajes nuevos.

**Componentes Técnicos Clave:**
*   **`NotificationBell.tsx`:** Un componente de cliente (`'use client'`) que se encarga de:
    *   Consultar en tiempo real la colección `notifications` de Firestore.
    *   Filtrar las notificaciones que corresponden al usuario actual (por ID de usuario, por rol o notificaciones para 'todos').
    *   Mostrar un contador de notificaciones no leídas.
    *   Marcar las notificaciones como leídas cuando el usuario abre el panel.
    *   Ofrecer una vista de conversación (chat) para responder a las notificaciones.
*   **`notificationService.ts`:** Un servicio que centraliza la lógica para crear y enviar nuevas notificaciones a la base de datos de Firestore.

### 1.2. Flujo de Interacción del Usuario

1.  **Recepción:** Cuando ocurre un evento relevante (ej. un administrador envía un mensaje), se crea un nuevo documento en la colección `notifications`.
2.  **Visualización:** El componente `NotificationBell` detecta el nuevo documento y muestra un indicador rojo.
3.  **Lectura:** Al hacer clic en la campana, el panel se despliega y las notificaciones se marcan automáticamente como leídas para el usuario actual.
4.  **Interacción:** El usuario puede hacer clic en una notificación para ser redirigido a la sección correspondiente de la aplicación (si se proveyó un enlace) o para abrir una vista de detalle tipo chat donde puede responder.

---

## 2. Documentación de la Asignación de Rutas en la Distribución (Notificaciones Dinámicas)

Para mejorar la experiencia de usuario, se ha implementado una función de **asignación de rutas inteligente** que detecta palabras clave en los mensajes de las notificaciones para generar enlaces dinámicos. Esto permite a los usuarios navegar directamente a la sección relevante de la aplicación con un solo clic.

### 2.1. Proceso de Detección de Enlaces

La lógica reside en la función `detectInternalLink` dentro del archivo `src/app/(app)/dashboard/administrator/client-page.tsx`.

**Orden de Prioridad de Detección:**

1.  **Términos Específicos de Calidad:** Se buscan primero palabras clave muy específicas relacionadas con los módulos de calidad para asegurar la máxima precisión.
    *   *Ejemplos:* `luminometria`, `sensorial`, `alergenos`, `pcc`, `basculas`.
    *   *Resultado:* Si se encuentra "Revisar ATP", se genera el enlace `/quality/luminometry`.

2.  **Lotes o Items de Producción:** A continuación, se compara el mensaje con los números de lote (`lot`) e identificadores de producto (`item`) existentes en la base de datos de producción.
    *   *Ejemplo:* Si el mensaje es "El lote P202405-101 tiene un problema", se genera un enlace a la página de detalle de ese producto: `/production/PROD-SK-100`.

3.  **Términos Generales de Módulos:** Finalmente, si no se encuentran coincidencias más específicas, se buscan palabras clave generales que correspondan a los módulos principales de la aplicación.
    *   *Ejemplos:* `higiene`, `usuarios`, `produccion`, `calidad`, `reportes`.
    *   *Resultado:* Un mensaje como "Revisar el último reporte de producción" generará el enlace `/reports`.

### 2.2. Ejemplo de Flujo en la "Distribución"

1.  Un **Administrador** utiliza el formulario de "Enviar Notificación" desde su panel.
2.  Escribe el mensaje: "Por favor, el equipo de Calidad debe revisar urgentemente el **producto terminado** del lote **P202405-101**".
3.  El sistema `detectInternalLink` procesa el texto:
    *   Detecta la palabra clave `producto terminado` y la asocia con la ruta `/quality/finished-product`.
    *   Detecta el `lote` y podría asociarlo a `/production/PROD-SK-100`.
4.  Debido al orden de prioridad, el enlace más específico (`/quality/finished-product`) es seleccionado.
5.  Se envía la notificación al rol "Calidad".
6.  Cuando un usuario de Calidad hace clic en la notificación, es redirigido instantáneamente a la sección de "Producto Terminado" para tomar acción.

### 2.3. Conclusión

Este sistema de enrutamiento dinámico reduce la fricción y el tiempo necesario para que los usuarios encuentren la información relevante, mejorando significativamente la eficiencia operativa y la comunicación dentro de **Tropical Trace**.
