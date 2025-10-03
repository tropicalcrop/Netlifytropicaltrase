
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function AreaClearancePowdersPage() {
    const qualityData = await getAll<QualityData>('quality_area_clearance_powders');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Despeje de Área para Polvos"
        pageDescription="Verificación de limpieza e inspección de equipos antes de la producción de polvos."
        formType="area-clearance-powders"
        collectionName='quality_area_clearance_powders'
     />;
}
