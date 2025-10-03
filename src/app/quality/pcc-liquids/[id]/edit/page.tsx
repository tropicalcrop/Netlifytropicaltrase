
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditPccLiquidsPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="pcc_liquids" logId={params.id} />;
}
