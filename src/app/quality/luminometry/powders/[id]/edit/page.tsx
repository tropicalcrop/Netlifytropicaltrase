
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditLuminometryPowdersPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="luminometry" logId={params.id} />;
}
