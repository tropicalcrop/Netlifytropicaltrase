
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditInProcessPowdersPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="in-process" logId={params.id} />;
}
