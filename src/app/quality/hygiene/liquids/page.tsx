import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function QualityHygieneLiquidsPage() {
    const qualityData = await getAll<QualityData>('hygiene_liquids');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Higiene y Saneamiento (Líquidos)"
        pageDescription="Registro y verificación de los procesos de limpieza para el área de líquidos."
        formType="hygiene_liquids"
        collectionName='hygiene_liquids'
     />;
}
