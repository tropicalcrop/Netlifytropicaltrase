
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditScalesLiquidsPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="scales-liquids" logId={params.id} />;
}
