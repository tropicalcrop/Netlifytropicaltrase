
'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
    Factory,
    LayoutDashboard,
    MessageSquare,
    Archive,
    Beaker,
    Users,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useCurrentUser } from '@/context/UserContext';
import { type UserData } from '@/app/users/page';

type Role = 'Administrator' | 'Quality' | 'Production';

const allMenuItems: {
    href?: string;
    label: string;
    icon?: React.ElementType;
    roles: Role[];
    isSection?: boolean;
}[] = [
    { href: '/dashboard', label: 'Panel', icon: LayoutDashboard, roles: ['Administrator', 'Quality', 'Production'] },
    { href: '/chat', label: 'Chat', icon: MessageSquare, roles: ['Administrator', 'Quality', 'Production'] },
    { href: '/production', label: 'Producción', icon: Factory, roles: ['Production', 'Administrator', 'Quality'] },
    { href: '/quality?flow=powder', label: 'Producción de Polvos', icon: Archive, roles: ['Quality', 'Administrator', 'Production'] },
    { href: '/quality?flow=liquid', label: 'Producción de Líquidos', icon: Beaker, roles: ['Quality', 'Administrator', 'Production'] },
    { isSection: true, label: 'Administración', roles: ['Administrator'] },
    { href: '/users', label: 'Usuarios', icon: Users, roles: ['Administrator'] },
];

export function AppSidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentUserData = useCurrentUser() as UserData;

    const getDashboardPath = (role?: Role) => {
        if (!role) return '/login';
        const rolePath = role.toLowerCase();
        return `/dashboard/${rolePath}`;
    };

    const currentUserRole = currentUserData.role;

    const getRoleBasedPath = (basePath: string) => {
        if (basePath === '/dashboard') {
            return getDashboardPath(currentUserRole);
        }
        return `${basePath}`;
    };

    const currentMenuItems = allMenuItems.filter(item => item.roles.includes(currentUserRole));

    return (
        <Sidebar>
            <SidebarHeader className="flex items-center justify-center">
                <Link href={getRoleBasedPath('/dashboard')}>
                    <Logo />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {currentMenuItems.map((item) => {
                        if (item.isSection || !item.href || !item.icon) {
                            return <SidebarSeparator key={item.label} className="my-1" />;
                        }
                        const RoleIcon = item.icon;
                        let isActive = false;

                        const isFinishedProductPage = pathname.startsWith('/production/finished-product');
                        const isScalesPage = pathname.startsWith('/quality/scales');

                        if (item.href.includes('flow=powder') && (isFinishedProductPage || (isScalesPage && pathname.includes('/powders')))) {
                            isActive = true;
                        } else if (item.href === '/production' && (isFinishedProductPage || isScalesPage)) {
                            isActive = false;
                        } else if (item.href.startsWith('/quality')) {
                            const flow = searchParams.get('flow');
                            isActive = pathname.startsWith('/quality') && item.href.includes(`flow=${flow}`);
                        } else if (item.href === '/production') {
                            isActive = pathname.startsWith('/production') || pathname.startsWith('/formulations');
                        } else {
                            isActive = pathname.startsWith(item.href);
                        }

                        return (
                            <SidebarMenuItem key={item.label}>
                                <Link href={getRoleBasedPath(item.href)} className="w-full">
                                    <SidebarMenuButton
                                        isActive={isActive}
                                        icon={<RoleIcon />}
                                        tooltip={item.label}
                                    >
                                        {item.label}
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="hidden group-data-[state=expanded]:block">
                <Separator className="mb-2" />
                <p className="px-2 text-xs text-muted-foreground">© 2024 Tropical Trace</p>
            </SidebarFooter>
        </Sidebar>
    );
}
