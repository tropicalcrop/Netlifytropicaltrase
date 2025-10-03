
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditEndowmentPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="endowment" logId={params.id} />;
}
