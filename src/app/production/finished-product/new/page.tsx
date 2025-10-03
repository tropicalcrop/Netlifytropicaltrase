
import { redirect } from 'next/navigation';

// This page is obsolete, redirect to the new location
export default function ObsoleteNewFinishedProductPage() {
    redirect('/quality/finished-product/new');
}
