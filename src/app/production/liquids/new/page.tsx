

import { getAll } from '@/services/firestoreService';
import { type Formulation } from '@/app/formulations/client-page';
import LiquidProductionFormClientPage from '../form-client';

export const revalidate = 0;

export default async function NewLiquidProductionPage() {
    return <LiquidProductionFormClientPage />;
}
