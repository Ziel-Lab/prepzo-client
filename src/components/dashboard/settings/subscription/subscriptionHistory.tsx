'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';

interface StripeInvoice {
    id: string;
    created: number;
    total: number;
    status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
    invoice_pdf: string;
    number: string;
    currency: string;
}

const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100);
};

const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const SubscriptionHistory = () => {
    const { isPro } = useSubscription();
    const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isPro) {
            setIsLoading(false);
            return;
        }

        const fetchInvoices = async () => {
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
                    throw new Error(errorData.error || 'Failed to fetch invoices.');
                }

                const data = await response.json();
                setInvoices(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoices();
    }, [isPro]);

    if (!isPro) {
        return (
           <Card>
               <CardHeader>
                   <CardTitle>Billing History</CardTitle>
                   <CardDescription>Your payment and subscription history will appear here when you upgrade.</CardDescription>
               </CardHeader>
               <CardContent>
                   <p className="text-sm text-muted-foreground">You do not have any billing history yet.</p>
               </CardContent>
           </Card>
       );
   }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>Below is a list of your past payments.</CardDescription>
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
                                <TableHead>Number</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length > 0 ? (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell>{formatDate(invoice.created)}</TableCell>
                                        <TableCell>{invoice.number}</TableCell>
                                        <TableCell>{formatAmount(invoice.total, invoice.currency)}</TableCell>
                                        <TableCell>
                                            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {invoice.invoice_pdf && (
                                                <Button asChild variant="outline" size="sm">
                                                    <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                                                        Download PDF
                                                    </a>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        You have no past invoices.
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
