"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function QueryProvider({ children }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minuto
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    }));

    useEffect(() => {
        let prevUserId = null;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUserId = session?.user?.id || null;
            if (event === 'SIGNED_OUT' || (prevUserId && currentUserId && prevUserId !== currentUserId)) {
                queryClient.clear();
            }
            prevUserId = currentUserId;
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
