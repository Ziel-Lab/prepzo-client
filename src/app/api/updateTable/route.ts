import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
        // 3. Check if user records already exist (created by trigger or previous calls)
        const [subscriptionCheck, usageCheck] = await Promise.all([
            supabaseAdmin
                .from('user_subscriptions')
                .select('id, plan_id, status')
                .eq('user_id', user.id)
                .maybeSingle(),
            supabaseAdmin
                .from('feature_usage')
                .select('id, plan_id')
                .eq('user_id', user.id)
                .maybeSingle()
        ]);

        // 4. If both records exist, return early (most common case for new users)
        if (subscriptionCheck.data && usageCheck.data && !subscriptionCheck.error && !usageCheck.error) {
            return NextResponse.json({ 
                message: 'User subscription and usage already initialized.',
                subscription: subscriptionCheck.data,
                usage: usageCheck.data,
                source: 'existing_records'
            });
        }

        // 5. Fallback: Create missing records (for users who signed up before trigger was added)
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'N/A';
        const today = new Date();
        const freePlanId = 1; // Default Free Plan ID

        const results = [];

        // Create subscription record if missing
        if (!subscriptionCheck.data) {
            const subscriptionData = {
                user_id: user.id,
                plan_id: freePlanId,
                status: 'free',
                display_name: displayName,
                started_at: today.toISOString(),
                current_period_start: today.toISOString().split('T')[0], // Actual signup date - NOT first of month
                // No current_period_end for new users - they're on free plan indefinitely
            };

            const { data: subInsertData, error: subInsertError } = await supabaseAdmin
                .from('user_subscriptions')
                .insert(subscriptionData)
                .select()
                .single();

            if (subInsertError) {
                console.error(`Failed to insert subscription for user ${user.id}:`, subInsertError);
                throw new Error('Could not create user subscription record.');
            }
            results.push({ subscription: subInsertData });
        }

        // Create usage record if missing
        if (!usageCheck.data) {
            const usageData = {
                user_id: user.id,
                plan_id: freePlanId,
                display_name: displayName,
                period_start: today.toISOString().split('T')[0], // Actual signup date - NOT first of month
                // No period_end for new users - usage tracking starts from signup date
                resume_period_count: 0,
                cover_letter_period_count: 0,
                linkedin_optimize_period_count: 0,
                job_search_results_period_count: 0
            };

            const { data: usageInsertData, error: usageInsertError } = await supabaseAdmin
                .from('feature_usage')
                .insert(usageData)
                .select()
                .single();

            if (usageInsertError) {
                console.error(`Failed to insert feature usage for user ${user.id}:`, usageInsertError);
                throw new Error('Could not create feature usage record.');
            }
            results.push({ usage: usageInsertData });
        }

        return NextResponse.json({ 
            message: 'Successfully backfilled missing user records.',
            ...results.reduce((acc, curr) => ({ ...acc, ...curr }), {}),
            source: 'backfill_created'
        });

    } catch (e: any) {
        console.error(`An error occurred during user record initialization for user ${user.id}:`, e.message);
        return NextResponse.json({ 
            error: e.message || 'An unexpected error occurred during record initialization.' 
        }, { status: 500 });
    }
}
