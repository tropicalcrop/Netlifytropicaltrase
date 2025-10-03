
import { redirect } from 'next/navigation'

export default function LuminometryPage() {
    // Redirect to the first tab by default
    redirect('/luminometry/powders')
}
