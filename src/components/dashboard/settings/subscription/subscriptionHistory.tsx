'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';

interface SubscriptionHistoryEntry {
    id: number;
    created_at: string;
    plan_id: number;
    status: string;
    stripe_subscription_id?: string;
    hosted_invoice_url?: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const getPlanName = (planId: number): string => {
    switch (planId) {
        case 1: return 'Free';
        case 2: return 'Pro';
        case 3: return 'Premium';
        default: return 'Unknown Plan';
    }
};

const SubscriptionHistory = () => {
    const [history, setHistory] = useState<SubscriptionHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("User not authenticated.");

                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
                if (!backendUrl) throw new Error("Backend URL is not configured.");

                const response = await fetch(`${backendUrl}/subscription/invoices`, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch subscription history.');
                }

                const data = await response.json();
                setHistory(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'paid':
                return 'default';
            case 'free':
            case 'free_trial':
                return 'secondary';
            case 'canceling':
            case 'past_due':
                return 'destructive';
            case 'canceled':
                return 'outline';
            default:
                return 'secondary';
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subscription History</CardTitle>
                <CardDescription>Below is a list of your past subscription changes.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                     <Skeleton className="h-40 w-full" />
                ) : error ? (
                    <p className="text-sm text-red-500">{error}</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Subscription ID</TableHead>
                                <TableHead className="text-right">Invoice</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length > 0 ? (
                                history.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{formatDate(entry.created_at)}</TableCell>
                                        <TableCell>{getPlanName(entry.plan_id)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(entry.status)} className="capitalize">
                                                {entry.status?.replace(/_/g, ' ') || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {entry.stripe_subscription_id || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {entry.hosted_invoice_url && (
                                                <Button asChild variant="outline" size="sm">
                                                    <a href={entry.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                                                        View Invoice
                                                    </a>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        You have no subscription history yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default SubscriptionHistory;
