import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function QualityHygienePowdersPage() {
    const qualityData = await getAll<QualityData>('hygiene');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Higiene y Saneamiento (Polvos)"
        pageDescription="Registro y verificación de los procesos de limpieza para el área de polvos."
        formType="hygiene"
        collectionName='hygiene'
     />;
}
