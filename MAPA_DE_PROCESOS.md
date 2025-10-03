# Mapa de Funcionamiento: El Viaje de la Información en Tropical Trace

## 1. Visión General
Este documento proporciona una representación visual de alto nivel sobre cómo fluye la información y cómo interactúan los diferentes roles (Producción, Calidad, Administrador) dentro de la aplicación **Tropical Trace**. El objetivo es ofrecer una comprensión rápida y clara de los procesos clave del negocio que el software digitaliza, como el ciclo de vida de un lote de producción y el proceso de verificación de limpieza.

---

## 2. ¿Cómo funciona el sistema?

Este mapa muestra cómo viaja la información y cómo cada miembro del equipo juega un papel clave. El objetivo es simple: ver de forma clara cómo nuestras tareas diarias se conectan para lograr la máxima calidad y eficiencia.

| Rol | Su Misión Principal |
| :--- | :--- |
| **Administrador** | Supervisa todo, gestiona usuarios y genera reportes. Tiene control total. |
| **Calidad** | Es el guardián de la calidad. Verifica procesos, realiza inspecciones y aprueba productos. |
| **Producción** | Son los creadores. Fabrican los productos y registran cada paso del proceso. |

---

## 3. Diagramas de Flujo: ¿Cómo nos conectamos?

### El Viaje de un Lote de Producción

```mermaid
graph TD
    subgraph Producción
        A[1. Inicia la fabricación y registra el lote] --> B[2. Establece el estado a "En Progreso"];
    end

    subgraph Calidad
        C[3. Revisa la mezcla durante el proceso] --> D{4. ¿Cumple?};
        D -- Sí --> E[5. Inspecciona el producto terminado];
        E --> F{6. ¿Lote OK?};
    end
    
    subgraph Sistema
        G[7. Notifica a todos sobre el estado final 📣];
    end

    %% Conexiones
    B --> C;
    D -- No --> H[🔴 Acción Correctiva];
    F -- Sí --> I[✅ Lote Aprobado];
    F -- No --> J[🔵 Lote Retenido];
    I --> G;
    J --> G;

    classDef rolProduccion fill:#E6F4EA,stroke:#2E944B,stroke-width:2px;
    classDef rolCalidad fill:#e6f4f4,stroke:#0d9488,stroke-width:2px;
    classDef rolSistema fill:#f3e8ff,stroke:#8b5cf6,stroke-width:2px;
    
    class A,B rolProduccion;
    class C,D,E,F,H,I,J rolCalidad;
    class G rolSistema;
```

### El Ciclo de la Limpieza

```mermaid
graph TD
    subgraph Producción
        P1[1. Realiza la limpieza] --> P2[2. Registra en el sistema];
        P2 --> P3[Estado: "Pendiente" 🟡];
    end

    subgraph Calidad
        Q1[4. Revisa las limpiezas pendientes] --> Q2{5. ¿Correcta?};
        Q2 -- Sí --> Q3[6. Marca como "Verificada" ✅];
        Q2 -- No --> Q4[7. Solicita nueva limpieza 🔴];
    end

    subgraph Sistema
        S1[3. Notifica a Calidad para que revise 📣]
        S2[8. Avisa a todos el resultado]
    end

    %% Conexiones
    P3 --> S1;
    S1 --> Q1;
    Q3 --> S2;
    Q4 --> S2;
    
    classDef rolProduccion fill:#E6F4EA,stroke:#2E944B,stroke-width:2px;
    classDef rolCalidad fill:#e6f4f4,stroke:#0d9488,stroke-width:2px;
    classDef rolSistema fill:#f3e8ff,stroke:#8b5cf6,stroke-width:2px;
    
    class P1,P2,P3 rolProduccion;
    class Q1,Q2,Q3,Q4 rolCalidad;
    class S1,S2 rolSistema;
```

---

**Tropical Trace** es nuestro centro de operaciones digital, diseñado para que colaboremos de forma fácil, rápida y sin errores.
