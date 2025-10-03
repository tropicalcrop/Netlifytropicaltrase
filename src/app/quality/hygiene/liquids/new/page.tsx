import HygieneFormPage from '@/app/hygiene/form-page';

export const revalidate = 0;

export default async function NewHygieneLiquidsPage() {
    return <HygieneFormPage collectionName="hygiene_liquids"/>;
}
