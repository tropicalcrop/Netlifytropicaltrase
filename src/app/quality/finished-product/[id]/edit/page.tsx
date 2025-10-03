
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditFinishedProductPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="finished-product" logId={params.id} />;
}
