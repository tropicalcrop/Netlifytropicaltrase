
import HygieneFormPage from '../../form-page';

export const revalidate = 0;

export default async function EditHygienePage({ params }: { params: { id: string } }) {
    return <HygieneFormPage logId={params.id} />;
}
