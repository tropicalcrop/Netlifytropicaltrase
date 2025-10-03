
import { getAll } from '@/services/firestoreService';
import HygienePage from '@/app/hygiene/page';

export const revalidate = 0;

export default async function QualityHygienePage() {
    // This page can reuse the Hygiene component logic
    return <HygienePage />;
}
