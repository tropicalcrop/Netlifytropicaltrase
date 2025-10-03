import { getAll } from '@/services/firestoreService';
import ProductionPowdersClientPage from '../client-page';
import { type ProductionData } from '../../page';

export const revalidate = 0;

export default async function ProductionPowdersListPage() {
    const allLogs = await getAll<ProductionData>('production');
    return <ProductionPowdersClientPage initialData={allLogs} />;
}
