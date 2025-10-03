
'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
// Importa la definición del tipo UserData para asegurar consistencia en los datos del usuario.
import { type UserData } from '@/app/users/page';

/**
 * Crea un Contexto de React para almacenar los datos del usuario.
 * Este contexto permitirá acceder a la información del usuario autenticado
 * desde cualquier componente descendiente sin necesidad de pasar props manualmente (prop drilling).
 * El valor por defecto es `null`, indicando que no hay usuario autenticado inicialmente.
 */
const UserContext = createContext<UserData | null>(null);

/**
 * Componente Proveedor (Provider) para el UserContext.
 * Este componente envuelve a las partes de la aplicación que necesitan acceso
 * a los datos del usuario. Recibe los datos del usuario a través de la prop `value`.
 * @param {ReactNode} children - Los componentes hijos que tendrán acceso al contexto.
 * @param {UserData | null} value - Los datos del usuario autenticado o null si no hay ninguno.
 */
export const UserProvider = ({ children, value }: { children: ReactNode, value: UserData | null }) => {
    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

/**
 * Hook personalizado (custom hook) para consumir el UserContext.
 * Simplifica el acceso a los datos del usuario desde cualquier componente funcional.
 * En lugar de usar `useContext(UserContext)`, los componentes pueden simplemente llamar a `useCurrentUser()`.
 * @returns {UserData | null} Los datos del usuario autenticado o null si no hay sesión activa.
 */
export const useCurrentUser = () => {
    return useContext(UserContext);
};
