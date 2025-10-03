
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function PccInspectionPage() {
    const qualityData = await getAll<QualityData>('pcc');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Inspección PCC (Inicio Fabricación)"
        pageDescription="Verificación de mallas y filtros en la línea de producción antes de iniciar."
        formType="pcc"
        collectionName='pcc'
     />;
}
