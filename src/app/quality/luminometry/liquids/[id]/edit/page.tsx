
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditLuminometryLiquidsPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="luminometry-liquids" logId={params.id} />;
}
