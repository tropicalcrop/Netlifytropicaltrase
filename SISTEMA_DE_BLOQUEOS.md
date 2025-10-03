# Explicación del Sistema de Bloqueo de Módulos

## 1. Visión General
Este documento detalla la lógica de negocio detrás del sistema de bloqueo secuencial implementado en los flujos de control de calidad de **Tropical Trace**. El objetivo es forzar un orden riguroso en el proceso, asegurando que no se pueda avanzar a una nueva etapa sin haber completado y aprobado la anterior. Esta funcionalidad es crucial para garantizar la trazabilidad y el cumplimiento de los estándares de calidad.

---

## 2. El Principio Fundamental: Avance Secuencial

Todo el sistema de control de calidad funciona como una "ventana móvil", donde solo un módulo está activo (desbloqueado) a la vez. El avance depende únicamente del estado de los módulos, no de un lote de producción específico.

## 3. Lógica para Roles de "Calidad" y "Producción"

Para estos roles, el sistema sigue una secuencia estricta para mantener el orden del proceso.

### a. ¿Cómo se determina el paso activo?
1.  El sistema revisa los módulos de control en su orden predefinido (Higiene → Luminometría → Despeje de Área → etc.).
2.  Busca el **primer módulo** en esa secuencia que **aún no está 100% completado y aprobado**. Un módulo se considera "completo" solo cuando **todos sus registros** existentes en la base de datos tienen un estado positivo (ej: "Completado", "Verificado", "Pasa", "Conforme"). Un módulo sin registros se considera **no completado**.
3.  Este primer módulo incompleto se convierte en el **único paso activo (`unlocked`)** y es el único al que estos roles pueden acceder.

### b. ¿Qué pasa con los otros módulos?
-   **Módulos Anteriores (`completed_and_locked`):** Todos los módulos que ya fueron completados y aprobados (los que están antes del paso activo) se marcan como **completados y bloqueados**. Mostrarán un ícono de `CheckCircle` verde, pero no se podrán editar, garantizando la integridad de los datos de etapas ya superadas.
-   **Módulos Siguientes (`locked`):** Todos los módulos que vienen después del paso activo permanecen **bloqueados** y muestran un ícono de candado, inaccesibles hasta que se complete la etapa actual.

### Ejemplo de Flujo:
1.  **Inicio:** El módulo "Higiene" está `unlocked`. Todos los demás están `locked`.
2.  **Acción:** Se crean y aprueban todos los registros de Higiene necesarios.
3.  **Resultado:** El sistema detecta que el módulo "Higiene" está 100% completo. Automáticamente, lo marca como `completed_and_locked` (se bloquea) y desbloquea el siguiente módulo en la secuencia, "Luminometría", que ahora pasa a ser el único paso `unlocked`.

Este proceso se repite hasta que el último módulo del ciclo se completa.

## 4. Lógica para el Rol de "Administrador" (La "Llave Maestra")

El rol de Administrador funciona como un **superusuario** con privilegios especiales para garantizar la supervisión y la capacidad de intervención.

-   **Acceso Total:** Para un usuario con el rol de Administrador, la lógica de bloqueo secuencial **no aplica para su propia vista**. El administrador siempre verá todos los módulos como desbloqueados y podrá navegar y editar libremente en cualquier etapa.

-   **Anulación de Bloqueos para Otros Roles:** Un administrador puede anular el flujo secuencial para los roles de Calidad y Producción.
    -   **¿Cómo funciona?:** Desde su vista del panel de "Controles de Calidad", el administrador puede hacer clic en el icono de candado (`Lock`/`Unlock`) de cualquier módulo.
    -   **Efecto:** Al hacer clic, se fuerza el desbloqueo de ese módulo para **todos los usuarios**, permitiéndoles el acceso aunque no sea su turno en la secuencia. El administrador puede volver a bloquearlo en cualquier momento haciendo clic de nuevo en el icono, devolviéndolo al flujo automático.

Esta capacidad de "llave maestra" asegura que un administrador nunca quede bloqueado y pueda resolver cualquier cuello de botella o realizar correcciones en cualquier punto del ciclo de producción.
