import HygieneFormPage from '@/app/hygiene/form-page';

export const revalidate = 0;

export default async function NewHygienePowdersPage() {
    return <HygieneFormPage collectionName="hygiene"/>;
}
