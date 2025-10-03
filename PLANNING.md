# Plan de Desarrollo de Software: Tropical Trace

## 1. Resumen del Proyecto

**Nombre de la Aplicación:** Tropical Trace

**Objetivo:** Desarrollar una aplicación web integral para digitalizar y optimizar los procesos clave de una empresa de producción de alimentos. La plataforma se centrará en la gestión de la producción, el control de calidad, la higiene y la trazabilidad, asegurando el cumplimiento de los estándares de la industria y mejorando la eficiencia operativa.

**Público Objetivo:**
*   **Administradores:** Supervisan todas las operaciones, gestionan usuarios y acceden a informes consolidados.
*   **Personal de Producción:** Registran y actualizan los lotes de producción y el uso de equipos.
*   **Personal de Calidad:** Realizan y registran inspecciones, verificaciones y aprueban productos.

## 2. Arquitectura y Pila Tecnológica

El sistema está diseñado con una arquitectura moderna, escalable y mantenible, utilizando las siguientes tecnologías:

*   **Framework Frontend:** **Next.js 15** con **App Router**. Se utilizan **React Server Components** por defecto para obtener datos de forma eficiente y **Client Components** para la interactividad del usuario.
*   **Lenguaje:** **TypeScript** para garantizar un código robusto, seguro y fácil de mantener a través de un sistema de tipos estricto.
*   **UI y Estilos:**
    *   **ShadCN UI:** Biblioteca de componentes reutilizables, accesibles y personalizables que forman la base de la interfaz.
    *   **Tailwind CSS:** Framework de CSS "utility-first" para un estilizado rápido, consistente y responsivo directamente en el JSX.
    *   **Lucide Icons:** Biblioteca de iconos limpios y consistentes para mejorar la usabilidad.
*   **Gestión de Formularios:** Se utilizan formularios controlados con los hooks de React (`useState`) para la captura de datos. Se planea la integración de `react-hook-form` con `zod` para validaciones complejas.
*   **Persistencia de Datos:** **Firebase Firestore** se utiliza como base de datos NoSQL en tiempo real, con acceso gestionado a través de un servicio centralizado (`src/services/firestoreService.ts`).
*   **Hosting:** **Firebase App Hosting**, configurado para un despliegue sencillo y escalable.

## 3. Módulos y Características Detalladas

### 3.1. Autenticación y Gestión de Roles
*   **Login:** Página de inicio de sesión para acceder al sistema (actualmente simulada).
*   **Roles de Usuario:** El sistema soporta tres roles (Administrador, Calidad, Producción). La interfaz y las funcionalidades se adaptan dinámicamente según el rol del usuario activo.
*   **Simulador de Roles:** Un menú desplegable permite cambiar de rol fácilmente para fines de desarrollo y demostración.

### 3.2. Paneles (Dashboards)
*   Paneles personalizados para cada rol que muestran información relevante y accesos directos a las tareas más comunes.
    *   **Administrador:** Visión global de usuarios, alertas del sistema, lotes de producción y actividad reciente.
    *   **Producción:** Resumen de lotes activos, tareas pendientes de higiene y formulaciones.
    *   **Calidad:** Indicadores de pruebas pendientes y fallidas, alertas y accesos a los módulos de inspección.

### 3.3. Módulo de Producción
*   **Seguimiento de Lotes:** Creación, edición y seguimiento de lotes de producción.
*   **Campos Registrados:** N.º de lote, producto, fecha, responsable, estado (Pendiente, En Progreso, Completado), y horas de inicio/fin.
*   **Permisos:** Creación y edición disponibles para Producción y Administradores.

### 3.4. Módulo de Higiene
*   **Registro de Limpieza:** Documentación de actividades de limpieza por área.
*   **Verificación de Calidad:** El rol de Calidad puede verificar las limpiezas pendientes directamente desde la tabla, cambiando el estado de "Pendiente" a "Verificado".
*   **Trazabilidad:** Se registra producto anterior, presencia de alérgenos, detergente utilizado, y horas de inicio/fin.
*   **Permisos:** Producción registra, Calidad verifica, Administrador gestiona.

### 3.5. Módulo de Calidad (Inspecciones)
*   **Secciones Tabuladas:** Organizado en pestañas para diferentes tipos de inspección:
    1.  **Luminometría (ATP):** Control de limpieza en superficies.
    2.  **Sensorial:** Evaluación de olor, color y apariencia.
    3.  **Alérgenos:** Verificación de ausencia de alérgenos.
    4.  **Inspección de Áreas:** Chequeo del estado de la infraestructura y equipos.
    5.  **En Proceso:** Verificación de mezclas (Grados Brix para líquidos, color/textura para polvos) con validación automática de cumplimiento.
    6.  **Producto Terminado:** Control final donde Calidad aprueba o retiene un lote para su envasado.
*   **Permisos de Edición:** Administrador puede editar todos los registros. Calidad solo puede editar registros en la pestaña "Producto Terminado".

### 3.6. Módulos Complementarios
*   **Dotación:** Verificación del equipo de protección personal de los empleados.
*   **Inspección PCC:** Control de Puntos Críticos (mallas y filtros).
*   **Básculas:** Registro de pruebas de excentricidad y repetitividad.
*   **Utensilios:** Conteo de entrada y salida de utensilios.
*   **Formulaciones:** Gestión de plantillas de ingredientes (actualmente visualización).
*   **Usuarios:** Creación, edición y eliminación de usuarios (solo Administradores).
*   **Reportes:** Interfaz para generar reportes filtrados (solo Administradores).

## 4. Diseño de la Interfaz y Experiencia de Usuario (UI/UX)

*   **Diseño Responsivo:** La interfaz se adapta a dispositivos de escritorio, tabletas y móviles. Las tablas complejas se transforman en un formato de lista vertical en pantallas pequeñas para evitar el desplazamiento horizontal.
*   **Tema de Color:** Se utiliza una paleta de colores profesional y consistente, con el verde como color primario para reflejar la identidad de la marca.
*   **Interacción Intuitiva:**
    *   Uso extensivo de modales (diálogos) para la creación y edición, manteniendo al usuario en el contexto de la página actual.
    *   Notificaciones (`Toast`) para confirmar acciones o mostrar errores.
    *   Diálogos de confirmación para acciones destructivas como la eliminación de registros.
*   **Tipografía:** Se utiliza la fuente "Inter" para garantizar una excelente legibilidad en titulares y cuerpo de texto.
*   **Accesibilidad:** Se aprovechan los componentes de ShadCN, que están construidos siguiendo las mejores prácticas de accesibilidad (WAI-ARIA).

## 5. Hoja de Ruta y Futuras Mejoras

*   **Conexión a Base de Datos:** Reemplazar los datos en memoria con **Firebase Firestore** para una persistencia real.
*   **Autenticación Real:** Implementar **Firebase Authentication** para gestionar usuarios y sesiones de forma segura.
*   **Funcionalidad Completa de Reportes:** Desarrollar la lógica para filtrar datos y exportarlos a PDF y Excel.
*   **Notificaciones en Tiempo Real:** Alertar a los usuarios sobre tareas pendientes o resultados críticos.
*   **Integración de Firma Digital:** Capturar firmas digitales en los registros que lo requieran para una mayor validez.
*   **Módulo de Formulaciones Avanzado:** Permitir la creación y edición detallada de formulaciones con control de versiones.
