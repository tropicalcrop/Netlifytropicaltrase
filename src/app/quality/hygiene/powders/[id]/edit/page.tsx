import HygieneFormPage from '@/app/hygiene/form-page';

export const revalidate = 0;

export default async function EditHygienePowdersPage({ params }: { params: { id: string } }) {
    return <HygieneFormPage logId={params.id} collectionName="hygiene"/>;
}
