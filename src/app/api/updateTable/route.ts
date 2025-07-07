import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getMonthDateRange(date: Date): { start: Date, end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

export async function POST() {
    // 1. Get the current user using the server client from utils
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Create an admin client to interact with the database
    const supabaseAdmin = createAdminSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 3. Check if a subscription already exists
        const { count, error: checkError } = await supabaseAdmin
            .from('user_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (checkError) {
            console.error('Error checking for subscription:', checkError.message);
            throw new Error('Failed to check user subscription.');
        }

        // 4. If subscription exists, we're done.
        if (count !== null && count > 0) {
            return NextResponse.json({ message: 'User subscription and usage already initialized.' });
        }

       // a. Prepare record data
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'N/A';
        const today = new Date();
        const { start: period_start, end: period_end } = getMonthDateRange(today);
        const freePlanId = 1; // Default Free Plan ID

        // b. Insert into user_subscriptions
        const subscriptionData = {
            user_id: user.id,
            plan_id: freePlanId,
            status: 'free',
            display_name: displayName,
            started_at: today.toISOString(),
            current_period_start: period_start.toISOString().split('T')[0],
            current_period_end: period_end.toISOString().split('T')[0],
        };

        const { data: subInsertData, error: subInsertError } = await supabaseAdmin
            .from('user_subscriptions')
            .insert(subscriptionData)
            .select(); // Add select to return the inserted data

        if (subInsertError) {
            console.error(`Failed to insert subscription for user ${user.id}:`, subInsertError);
            console.error('Subscription insert error details:', {
                message: subInsertError.message,
                details: subInsertError.details,
                hint: subInsertError.hint,
                code: subInsertError.code
            });
            throw new Error('Could not create user subscription record.');
        }

        // c. Insert into feature_usage
        const usageData = {
            user_id: user.id,
            plan_id: freePlanId,
            display_name: displayName,
            period_start: period_start.toISOString().split('T')[0],
            period_end: period_end.toISOString().split('T')[0],
            resume_count: 0,
            cover_letter_count: 0,
            linkedin_optimize_count: 0,
            job_search_results_count: 0
        };

        const { data: usageInsertData, error: usageInsertError } = await supabaseAdmin
            .from('feature_usage')
            .insert(usageData)
            .select(); // Add select to return the inserted data

        if (usageInsertError) {
            console.error(`Failed to insert feature usage for user ${user.id}:`, usageInsertError);
            console.error('Usage insert error details:', {
                message: usageInsertError.message,
                details: usageInsertError.details,
                hint: usageInsertError.hint,
                code: usageInsertError.code
            });
            throw new Error('Could not create feature usage record.');
        }

        return NextResponse.json({ 
            message: 'Successfully initialized user subscription and usage.',
            subscription: subInsertData,
            usage: usageInsertData
        });

    } catch (e: any) {
        console.error(`An error occurred during subscription backfill for user ${user.id}:`, e.message);
        console.error('Full error details:', e);
        return NextResponse.json({ error: e.message || 'An unexpected error occurred during backfill.' }, { status: 500 });
    }
}
