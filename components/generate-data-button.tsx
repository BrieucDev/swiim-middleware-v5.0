'use client';

import { generateNewTicketsAndClients } from '@/app/actions/demo';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function GenerateDataButton() {
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        startTransition(async () => {
            const result = await generateNewTicketsAndClients();
            if (result.success) {
                // Optionally show a toast notification
                console.log(result.message);
            } else {
                console.error(result.error);
            }
        });
    };

    return (
        <Button
            variant="outline"
            onClick={handleClick}
            disabled={isPending}
            className="rounded-full border-[#C7FF06] text-[#C7FF06] hover:bg-[#C7FF06] hover:text-gray-900"
        >
            <Plus className="h-4 w-4 mr-2" />
            {isPending ? 'Génération...' : 'Nouveaux tickets & clients'}
        </Button>
    );
}

