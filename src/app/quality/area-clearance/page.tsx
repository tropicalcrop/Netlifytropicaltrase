
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { getAll } from '@/services/firestoreService';

export const revalidate = 0;

export default async function AreaClearancePowdersPage() {
    const qualityData = await getAll<QualityData>('quality_area_clearance_powders');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Despeje de Área"
        pageDescription="Verificación de limpieza e inspección de equipos antes de la producción."
        formType="area-clearance-powders"
        collectionName='quality_area_clearance_powders'
     />;
}
