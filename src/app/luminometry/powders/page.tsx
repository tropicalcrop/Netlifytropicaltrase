
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function LuminometryPage() {
    const qualityData = await getAll<QualityData>('quality_luminometry');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Luminometría para Polvos"
        pageDescription="Medición cuantitativa de la limpieza en superficies para producción de polvos."
        formType="luminometry"
        collectionName='quality_luminometry'
     />;
}
