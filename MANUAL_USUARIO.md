# Manual de Usuario: Tropical Trace

## 1. Introducción

¡Bienvenido a **Tropical Trace**!

Este manual es tu guía completa para usar la aplicación que transformará la manera en que gestionamos nuestros procesos de producción. Aquí aprenderás a usar cada herramienta que hemos creado para ti, desde registrar un lote de producción hasta verificar la calidad de nuestros productos.

**Nuestro Objetivo:** Hacer tu trabajo más fácil, rápido y seguro, eliminando el papel y asegurando que tengamos la mejor calidad y trazabilidad posibles.

---

## 2. Primeros Pasos: Iniciar Sesión

Para comenzar a usar Tropical Trace, necesitas tus credenciales de acceso (correo electrónico y contraseña), que te serán proporcionadas por el administrador del sistema.

1.  Abre la aplicación en tu navegador web.
2.  Introduce tu **correo electrónico**.
3.  Introduce tu **contraseña**.
4.  Haz clic en el botón **"Iniciar Sesión"**.

Una vez dentro, el sistema te reconocerá y te mostrará el panel de control correspondiente a tu rol.

---

## 3. Entendiendo tu Rol

En Tropical Trace, cada usuario tiene un rol específico que define qué puede ver y hacer. Esto asegura que cada persona tenga acceso únicamente a las herramientas que necesita para su trabajo.

| Rol | Tu Misión en el Sistema |
| :--- | :--- |
| **Administrador** | Tienes una visión completa de todo el sistema. Tu misión es supervisar las operaciones, gestionar los usuarios y acceder a todos los datos y reportes para la toma de decisiones. |
| **Personal de Calidad** | Eres el guardián de nuestros estándares. Tu misión es realizar inspecciones, verificar que los procesos de limpieza se cumplan y aprobar o retener los lotes de producción para garantizar la máxima calidad. |
| **Personal de Producción**| Eres el corazón de la operación. Tu misión es registrar la fabricación de nuevos lotes, seguir las formulaciones y documentar los procesos de limpieza para asegurar la trazabilidad. |

---

## 4. Guía de Módulos: ¿Cómo Usar Cada Herramienta?

A continuación, te explicamos paso a paso cómo usar cada módulo de la aplicación.

### 4.1. Panel de Control (Dashboard)

El panel de control es tu página de inicio personalizada. Al iniciar sesión, verás un resumen de las tareas más importantes y accesos directos a los módulos que más utilizas.

*   **Para Producción:** Verás un resumen de los lotes en los que estás trabajando y las formulaciones disponibles.
*   **Para Calidad:** Verás alertas sobre pruebas de calidad pendientes o fallidas y registros de higiene que necesitan tu verificación.
*   **Para Administrador:** Tendrás una vista global de la actividad reciente, el número de usuarios y alertas críticas del sistema.

### 4.2. Módulo de Formulaciones

Aquí es donde comienza la magia de la producción. En este módulo, puedes ver las "recetas" o plantillas para cada uno de nuestros productos.

**¿Cómo usarlo?**
1.  Navega a la sección **"Formulaciones"** desde el menú.
2.  Verás una tarjeta por cada producto (ej. "Sabor Carne en Polvo").
3.  **Para ver los detalles:** Haz clic en **"Ver Detalles"** en la tarjeta de una formulación para ver todos los ingredientes y sus cantidades estándar.
4.  **Para iniciar una fabricación:** Haz clic en el botón **"Distribuir Producción"** en la parte superior. Esto te llevará a un formulario para crear un nuevo lote, ¡y puedes precargarlo con los datos de una formulación existente!
5.  **(Solo Admin/Producción) Para crear o editar:** Usa los botones de **"+"** o el lápiz en cada tarjeta para subir un nuevo archivo de Excel con una formulación o actualizar uno existente.

### 4.3. Módulo de Producción

En este módulo llevas el control de todos los lotes de fabricación.

**¿Cómo registrar un nuevo lote?**
1.  Desde el módulo de **Formulaciones** o **Producción**, haz clic en **"Crear Lote"** o **"Distribuir Producción"**.
2.  Se abrirá un formulario detallado. Si lo iniciaste desde una formulación, muchos campos ya estarán llenos.
3.  **Completa la Información:**
    *   **Producto, Item y Lote:** Define el producto que estás fabricando.
    *   **Fechas y Horas:** El sistema registrará automáticamente las horas de inicio y fin.
    *   **Ingredientes:** Añade cada ingrediente, su lote, y marca si el chequeo fue Conforme (C) o No Conforme (NC).
    *   **Producto Final:** Registra los pesos teóricos y el peso real obtenido para calcular el rendimiento.
    *   **Firmas:** ¡No olvides firmar digitalmente en el recuadro correspondiente! Esto es crucial para la trazabilidad.
4.  Haz clic en **"Guardar Fabricación"**.

Desde la página principal de "Producción", podrás ver todos los productos. Al hacer clic en uno, irás a una página donde verás todos los lotes fabricados para ese producto, con la opción de editarlos o ver sus detalles.

### 4.4. Módulo de Higiene

Aquí se registran todas las actividades de limpieza para asegurar que nuestras áreas y equipos estén siempre en perfectas condiciones.

**¿Cómo registrar una limpieza? (Rol: Producción)**
1.  Ve al módulo de **"Higiene"** y haz clic en **"Registrar Actividad de Limpieza"**.
2.  Completa el formulario:
    *   **Área/Equipo:** Especifica qué se limpió (ej. "Mezcladora #1").
    *   **Última Fabricación:** Selecciona el último producto que se procesó en esa área para controlar alérgenos.
    *   **Detergente y Concentración:** Registra los productos de limpieza utilizados.
    *   **Firma:** Firma digitalmente para validar tu trabajo.
3.  Al guardar, el registro quedará como **"Pendiente Verificación"**.

**¿Cómo verificar una limpieza? (Rol: Calidad)**
1.  En la tabla del módulo de **"Higiene"**, busca los registros con la etiqueta amarilla "Pendiente Verificación".
2.  Revisa el área o equipo físicamente.
3.  Si todo está correcto, simplemente **haz clic en la etiqueta amarilla**. Cambiará a "Verificado" (verde), y quedará registrado quién y cuándo se hizo la verificación.

### 4.5. Módulo de Calidad

Este es el centro de todas las inspecciones. Está organizado en pestañas para cada tipo de prueba.

**¿Cómo realizar una inspección?**
1.  Ve al módulo de **"Calidad"**.
2.  Selecciona la pestaña de la prueba que quieres realizar (ej. "Luminometría", "Sensorial", "PCC", etc.).
3.  Haz clic en el botón **"Añadir Prueba"** (o el nombre correspondiente).
4.  Completa el formulario específico para esa prueba:
    *   **Luminometría:** Ingresa el valor URL que te dio el equipo. El sistema te dirá si "Pasa" o "Falla" automáticamente.
    *   **Sensorial:** Evalúa el producto según su olor, color y apariencia.
    *   **Producto Terminado:** Decide si un lote está **"Aprobado para Envasar"** o si debe ser **"Retenido"**.
    *   **Dotación, PCC, Básculas, Utensilios:** Sigue los campos de cada formulario para registrar las verificaciones correspondientes.
5.  Firma digitalmente y guarda el registro.

### 4.6. Módulo de Usuarios (Solo Administradores)

Desde aquí puedes gestionar quién tiene acceso a Tropical Trace.

*   **Crear Usuario:** Haz clic en "Crear Usuario", llena sus datos (nombre, correo, rol, etc.), y asígnale una contraseña.
*   **Editar Usuario:** Haz clic en el ícono de lápiz en la fila de un usuario para cambiar su nombre, rol o foto de perfil.
*   **Eliminar Usuario:** Selecciona uno o más usuarios marcando la casilla a la izquierda y usa el botón "Eliminar" que aparecerá.

### 4.7. Módulo de Reportes (Solo Administradores)

Esta es tu herramienta para obtener una visión completa de todos los datos del sistema.

1.  Ve al módulo de **"Reportes"**.
2.  Usa los filtros en la parte superior:
    *   **Módulo:** Elige de qué parte del sistema quieres los datos (ej. "Producción", "Calidad - Sensorial").
    *   **Usuario:** Filtra para ver los registros de una persona específica.
    *   **Fechas:** Define un rango de fechas para tu consulta.
3.  Haz clic en **"Generar Reporte"**. Los datos aparecerán en una tabla en la parte inferior.
4.  Si quieres descargar los datos, haz clic en **"Exportar a Excel"**.

---

## 5. Preguntas Frecuentes

**P: ¿Qué pasa si olvido mi contraseña?**
R: Por favor, contacta al administrador del sistema para que te ayude a restablecerla.

**P: ¿Puedo cambiar mi rol?**
R: No, los roles son asignados por el administrador para garantizar la seguridad e integridad de los datos.

**P: ¿La firma digital es segura?**
R: ¡Sí! Cada firma queda vinculada a tu usuario y a la hora en que se realizó, creando un registro auditable y confiable.

**P: ¿Puedo usar la aplicación en mi tablet o celular?**
R: Sí, Tropical Trace está diseñado para funcionar en diferentes tamaños de pantalla, facilitando su uso directamente en la planta de producción.

---
*¡Gracias por usar Tropical Trace y por ayudarnos a llevar nuestra producción al siguiente nivel!*
