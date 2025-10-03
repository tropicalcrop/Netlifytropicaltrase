
'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    ClipboardCheck,
    ClipboardList,
    Wrench,
    Magnet,
    Lock
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCurrentUser } from '@/context/UserContext'
import { getAll } from '@/services/firestoreService'
import { type QualityData } from '../quality/types'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const pccTabs = [
    { href: "/pcc/inspection", label: "Inspección (Inicio)", icon: ClipboardCheck, collectionName: 'pcc' },
    { href: "/pcc/endowment", label: "Dotación", icon: ClipboardList, collectionName: 'endowment' },
    { href: "/pcc/utensils", label: "Utensilios", icon: Wrench, collectionName: 'utensils' },
    { href: "/pcc/final-inspection", label: "Inspección (Final)", icon: ClipboardCheck, collectionName: 'quality_pcc_final_inspection' },
    { href: "/pcc/magnet-inspection", label: "Inspección de Imán", icon: Magnet, collectionName: 'quality_magnet_inspection' },
];

const getApprovalStatusesForPcc = (collectionName: string): string[] => {
    const map: Record<string, string[]> = {
        'pcc': ['Conforme'],
        'endowment': ['Conforme'],
        'utensils': ['Conforme'],
        'quality_pcc_final_inspection': ['Conforme'],
        'quality_magnet_inspection': ['Conforme'],
    };
    return map[collectionName] || ['Conforme'];
};

const isModuleFullyApproved = (module: {collectionName: string}, allRecords: QualityData[]): boolean => {
    const recordsForModule = allRecords.filter(r => r.id.startsWith(module.collectionName));

    if (recordsForModule.length === 0) {
        return false;
    }

    return recordsForModule.every(record => {
        const recordStatus = record.status || record.result;
        const approvalStatuses = getApprovalStatusesForPcc(module.collectionName);
        return recordStatus && approvalStatuses.includes(recordStatus);
    });
};


export default function PccLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const currentUser = useCurrentUser();
    const [moduleStatuses, setModuleStatuses] = useState<Record<string, 'locked' | 'unlocked' | 'completed'>>({});
    const [isSubPage, setIsSubPage] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsSubPage(pathname.includes('/new') || pathname.includes('/edit'));
    }, [pathname]);

    const fetchStatuses = useCallback(async () => {
        setIsLoading(true);
        if (!currentUser) return;

        if (currentUser.role === 'Administrator') {
            const adminStatuses = pccTabs.reduce((acc, tab) => ({ ...acc, [tab.href]: 'unlocked' }), {});
            setModuleStatuses(adminStatuses);
            setIsLoading(false);
            return;
        }

        const statuses: Record<string, 'locked' | 'unlocked' | 'completed'> = {};
        let firstUnlockedFound = false;

        for (const tab of pccTabs) {
            const records = await getAll<QualityData>(tab.collectionName);
            
            if (records.length === 0) {
                if (!firstUnlockedFound) {
                    statuses[tab.href] = 'unlocked';
                    firstUnlockedFound = true;
                } else {
                    statuses[tab.href] = 'locked';
                }
                continue;
            }

            const approvalStatuses = getApprovalStatusesForPcc(tab.collectionName);
            const allApproved = records.every(r => approvalStatuses.includes(r.status || r.result || ''));

            if (allApproved) {
                statuses[tab.href] = 'completed';
            } else if (!firstUnlockedFound) {
                statuses[tab.href] = 'unlocked';
                firstUnlockedFound = true;
            } else {
                statuses[tab.href] = 'locked';
            }
        }
        
        if (!firstUnlockedFound) {
            const firstTab = pccTabs[0].href;
            if (statuses[firstTab] !== 'unlocked') {
                statuses[firstTab] = 'unlocked';
                pccTabs.slice(1).forEach(tab => {
                     if (statuses[tab.href] === 'unlocked') statuses[tab.href] = 'locked';
                });
            }
        }


        setModuleStatuses(statuses);
        setIsLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchStatuses();
    }, [fetchStatuses]);


    const activeTabValue = pccTabs.find(tab => pathname.startsWith(tab.href))?.href;


    return (
        <div className="flex flex-col gap-6">
            <div>{children}</div>
        </div>
    )
}
