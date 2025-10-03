
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function UtensilsPage() {
    const qualityData = await getAll<QualityData>('utensils');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Inspección de Utensilios"
        pageDescription="Registro de entrada y salida de utensilios del área de producción."
        formType="utensils"
        collectionName='utensils'
     />;
}
