
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function MagnetInspectionPage() {
    const qualityData = await getAll<QualityData>('quality_magnet_inspection');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Inspección de Imán (Final Fabricación)"
        pageDescription="Revisión del estado del imán al final de la fabricación."
        formType="magnet-inspection"
        collectionName='quality_magnet_inspection'
     />;
}
