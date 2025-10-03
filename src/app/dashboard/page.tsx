
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function DashboardRedirectPage() {
    // This is a server component, we can check cookies to get the role
    // For simplicity, we'll just redirect to the main login, 
    // which will then redirect to the correct dashboard.
    // This page acts as a catch-all for anyone navigating to just "/dashboard"
    redirect('/login');
}
