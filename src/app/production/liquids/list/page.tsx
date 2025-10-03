
import { getAll } from '@/services/firestoreService';
import { type ProductionData } from '../../page';
import ProductionLiquidsClientPage from '../client-page';

export const revalidate = 0;

export default async function ProductionLiquidsListPage() {
    const allLogs = await getAll<ProductionData>('production');
    return <ProductionLiquidsClientPage initialData={allLogs} />;
}
