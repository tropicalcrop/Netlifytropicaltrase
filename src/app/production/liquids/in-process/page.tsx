import { redirect } from 'next/navigation';

// This page is obsolete, redirect to the new location
export default function ObsoleteInProcessLiquidsPage() {
    redirect('/quality/in-process/liquids');
}
