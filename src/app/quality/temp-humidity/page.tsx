
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function TempHumidityPage() {
    const qualityData = await getAll<QualityData>('quality_temp_humidity');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Temperatura y Humedad"
        pageDescription="Verificación de las condiciones ambientales antes del inicio de la fabricación."
        formType="temp-humidity"
        collectionName='quality_temp_humidity'
     />;
}
