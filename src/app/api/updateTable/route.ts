import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

async function handleSubscriptionChange(userId: string, planId: number) {
    const supabaseAdmin = createAdminSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  
    // Only update paid_user status based on plan_id, don't update plan_id
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        paid_user: planId !== 1  // true if plan_id is 2 or 3
      })
      .eq('user_id', userId);
  
    if (updateError) {
      console.error(`Failed to update paid_user status for user ${userId}:`, updateError);
      throw new Error('Could not update paid user status.');
    }
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
        // 3. Check if user records already exist (created by trigger or previous calls)
        const [subscriptionCheck, usageCheck, profileCheck] = await Promise.all([
            supabaseAdmin
                .from('user_subscriptions')
                .select('id, plan_id, status')
                .eq('user_id', user.id)
                .maybeSingle(),
            supabaseAdmin
                .from('feature_usage')
                .select('id, plan_id')
                .eq('user_id', user.id)
                .maybeSingle(),
            supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle()
        ]);

        const { data: subscriptionData } = await supabaseAdmin
            .from('user_subscriptions')
            .select('plan_id')
            .eq('user_id', user.id)
            .single();

        if (subscriptionData) {
        await handleSubscriptionChange(user.id, subscriptionData.plan_id);
        }
    
        // 4. If all records exist, return early
        if (subscriptionCheck.data && usageCheck.data && profileCheck.data && 
            !subscriptionCheck.error && !usageCheck.error && !profileCheck.error) {
            return NextResponse.json({ 
                message: 'User records already initialized.',
                subscription: subscriptionCheck.data,
                usage: usageCheck.data,
                profile: profileCheck.data,
                source: 'existing_records'
            });
        }
    
        // 5. Create missing records
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'N/A';
        const today = new Date();
        const freePlanId = 1; // Default Free Plan ID
    
        const results = [];
    
        // Create profile if missing
        if (!profileCheck.data) {
            const { data: profileData, error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    user_id: user.id,
                    display_name: displayName,
                    answered: false, // This ensures onboarding will show
                    paid_user: false
                })
                .select()
                .single();
    
            if (profileError) {
                console.error(`Failed to create profile for user ${user.id}:`, profileError);
                throw new Error('Could not create user profile record.');
            }
            results.push({ profile: profileData });
        }
    
        // Create subscription record if missing
        if (!subscriptionCheck.data) {
            const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
                .from('user_subscriptions')
                .insert({
                    user_id: user.id,
                    plan_id: freePlanId,
                    status: 'active',
                    display_name: displayName
                })
                .select()
                .single();
            
            if (subscriptionError) {
                console.error(`Failed to create subscription for user ${user.id}:`, subscriptionError);
                throw new Error('Could not create subscription record.');
            }
            results.push({ subscription: subscriptionData });
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
