
'use client'

import React, { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from './ui/button'

interface SignaturePadProps {
    onSave: (signature: string) => void;
    disabled?: boolean;
    initialSignature?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, disabled, initialSignature }) => {
    const sigPad = useRef<SignatureCanvas>(null)

    useEffect(() => {
        if (sigPad.current && initialSignature) {
            // Asegúrese de que el lienzo esté listo antes de intentar cargar datos. 
            // Utilice un pequeño tiempo de espera para permitir que se represente el elemento de lienz
            setTimeout(() => {
                if (sigPad.current) {
                    sigPad.current.fromDataURL(initialSignature);
                }
            }, 100);
        }
    }, [initialSignature]);

    const handleClear = () => {
        if (sigPad.current) {
            sigPad.current.clear();
            onSave("");
        }
    }

    const handleSave = () => {
        if (sigPad.current && !sigPad.current.isEmpty()) {
            onSave(sigPad.current.toDataURL('image/png'))
        }
    }

    return (
        <div className="relative w-full aspect-[2/1] border rounded-md bg-white">
            <SignatureCanvas
                ref={sigPad}
                penColor="black"
                canvasProps={{ className: 'w-full h-full rounded-md' }}
                onBegin={() => { if(disabled && sigPad.current) sigPad.current.clear() }}
                onEnd={handleSave}
            />
            {!disabled && (
                <div className="absolute bottom-2 right-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleClear}>
                        Limpiar
                    </Button>
                </div>
            )}
        </div>
    )
}

export default SignaturePad;
