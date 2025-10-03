
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '../client-page';
import { type QualityData } from '../types';

export const revalidate = 0;

export default async function LuminometryPage() {
    const qualityData = await getAll<QualityData>('quality_luminometry');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Luminometría"
        pageDescription="Medición cuantitativa de la limpieza en superficies."
        formType="luminometry"
        collectionName='quality_luminometry'
     />;
}
