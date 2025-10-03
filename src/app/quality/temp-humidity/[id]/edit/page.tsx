
import { type QualityFormType } from '../../../types';
import QualityFormPage from '../../../form-client';

export const revalidate = 0;

export default function EditTempHumidityPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType='temp-humidity' logId={params.id} />;
}
