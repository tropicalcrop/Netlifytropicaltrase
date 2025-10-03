
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditScalesPowdersPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="scales" logId={params.id} />;
}
