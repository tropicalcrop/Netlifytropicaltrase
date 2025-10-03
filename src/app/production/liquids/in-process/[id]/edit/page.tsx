
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditInProcessLiquidsPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="in-process-liquids" logId={params.id} />;
}
