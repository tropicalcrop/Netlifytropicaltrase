
import { redirect } from 'next/navigation';

// This page is obsolete, redirect to the new location
export default function ObsoleteEditFinishedProductPage({ params }: { params: { id: string } }) {
    redirect(`/quality/finished-product/${params.id}/edit`);
}
