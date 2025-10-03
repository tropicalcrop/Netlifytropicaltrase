# Manual de Módulos: Flujo de Producción de Líquidos

## 1. Visión General

Este documento detalla el propósito y el flujo de trabajo de los módulos específicamente diseñados para la **producción de líquidos** en Tropical Trace. El sistema está organizado para garantizar un proceso secuencial, trazable y que cumple con los más altos estándares de calidad.

El flujo se divide en varias etapas clave, cada una representada por un módulo en la aplicación:

1.  **Formulaciones (Líquidos):** El punto de partida donde se definen las recetas.
2.  **Despeje de Área (Líquidos):** La preparación y verificación del entorno de producción.
3.  **Verificación de Básculas (Líquidos):** Aseguramiento de la precisión de los equipos de pesaje.
4.  **Producción de Lotes (Líquidos):** El registro detallado de la fabricación.
5.  **Control en Proceso (Líquidos):** La supervisión de la calidad durante la mezcla.

---

## 2. Guía Detallada de Módulos

### 2.1. Módulo de Formulaciones (Líquidos)

*   **Ubicación:** `Producción` > `Formulaciones` > `Líquidos`
*   **Propósito:** Este módulo es la base de datos de las "recetas maestras" para todos los productos líquidos. Aunque actualmente se encuentra en construcción y no permite la creación de nuevas formulaciones líquidas, sirve como un marcador para la futura implementación de esta funcionalidad.
*   **Funcionamiento:**
    *   Visualización de las formulaciones líquidas existentes.
    *   Permite iniciar la fabricación de un nuevo lote basado en una plantilla preexistente.

### 2.2. Módulo de Despeje de Área (Líquidos)

*   **Ubicación:** `Controles de Calidad` > `Despeje de Área` > `Líquidos`
*   **Propósito:** Asegurar que el área de producción de líquidos y los equipos estén completamente limpios, desinfectados y en condiciones óptimas **antes** de iniciar cualquier fabricación. Este es un punto de control crítico para prevenir la contaminación.
*   **Funcionamiento:**
    *   El personal de Calidad utiliza una lista de verificación detallada para inspeccionar aspectos como la limpieza de tanques, tuberías, bombas, pisos y utensilios.
    *   Se verifica el correcto funcionamiento de equipos clave como agitadores, pHmetros y refractómetros.
    *   Se registra la temperatura y humedad del área para asegurar que estén dentro de los rangos permitidos.
    *   El módulo no se considera "completado" hasta que todos los ítems de la lista de verificación son marcados como `Conforme`.

### 2.3. Módulo de Verificación de Básculas (Líquidos)

*   **Ubicación:** `Controles de Calidad` > `Verificación de Básculas` > `Líquidos`
*   **Propósito:** Garantizar la precisión y fiabilidad de las básculas utilizadas en el pesaje de ingredientes líquidos. Una medición incorrecta puede afectar drásticamente la calidad y consistencia del producto final.
*   **Funcionamiento:**
    *   Se realizan dos pruebas clave:
        1.  **Prueba de Repetibilidad:** Se pesa una masa patrón varias veces para asegurar que la báscula da resultados consistentes.
        2.  **Prueba de Excentricidad:** Se coloca una masa patrón en diferentes puntos del plato de la báscula para verificar que la lectura no varía según la posición.
    *   Los resultados se registran y el sistema valida si el equipo `Cumple` o `No Cumple` con las tolerancias permitidas.
    *   Este paso debe completarse antes de que se pueda iniciar el registro de un lote de producción.

### 2.4. Módulo de Producción de Lotes (Líquidos)

*   **Ubicación:** `Producción` > `Lotes de Líquidos`
*   **Propósito:** Este es el corazón del proceso, donde el personal de Producción documenta cada detalle de la fabricación de un lote de producto líquido. Permite una trazabilidad completa desde el ingrediente crudo hasta el producto final.
*   **Funcionamiento:**
    *   **Creación de Lotes:** Se registra la información general del lote (producto, item, número de lote, cliente, orden de producción).
    *   **Registro por Etapas:** La fabricación se divide en etapas (ej. "Pre-Mezcla 1", "Mezcla Final"). En cada etapa, se añaden los ingredientes especificando:
        *   Referencia y Nombre del ingrediente.
        *   Cantidad teórica y lote de la materia prima.
        *   Ajustes de cantidad (+/-) si son necesarios.
        *   Firma del responsable que añade cada ingrediente.
    *   **Material de Empaque:** Se registra el tipo, cantidad y lote del material de empaque utilizado.
    *   **Firmas de Validación:** El formulario requiere firmas del formulador y del supervisor para validar el proceso.

### 2.5. Módulo de Control en Proceso (Líquidos)

*   **Ubicación:** `Producción` > `Lotes de Líquidos` > `Control en Proceso`
*   **Propósito:** Realizar controles de calidad **durante** la fabricación para asegurar que la mezcla cumple con las especificaciones antes de ser envasada. Esto permite realizar correcciones a tiempo.
*   **Funcionamiento:**
    *   El personal de Calidad toma muestras del producto en diferentes momentos del proceso (inicio, medio, final).
    *   Se miden y registran parámetros críticos como:
        *   Temperatura
        *   Densidad
        *   Grados Brix (concentración de azúcares)
        *   pH (nivel de acidez)
        *   Color y Apariencia
    *   El sistema compara los valores registrados con los estándares definidos para ese producto.
    *   Se genera un resultado final de `Cumple` o `No Cumple` para el lote en proceso.

---

## 3. Conclusión del Flujo

Cada uno de estos módulos representa un punto de control esencial. El sistema de bloqueos secuenciales de **Tropical Trace** asegura que no se pueda avanzar al siguiente módulo hasta que el anterior haya sido completado y aprobado, garantizando un proceso de producción de líquidos robusto, seguro y completamente trazable.