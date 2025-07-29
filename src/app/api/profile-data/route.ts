import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Tell Next.js this route is dynamic (uses cookies)
export const dynamic = 'force-dynamic';

interface ProfileData {
  id: string;
  username: string;
  name?: string;
  title?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  skills?: Array<{
    name: string;
    level: number;
    category: string;
  }>;
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
    description: string;
  }>;
  certificates?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    verificationUrl?: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required.' 
      }, { status: 401 });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ 
        error: 'Failed to fetch profile data' 
      }, { status: 500 });
    }

    // Fetch user skills
    const { data: skills, error: skillsError } = await supabase
      .from('user_skills')
      .select('skill_name, proficiency_level, category')
      .eq('user_id', user.id)
      .order('skill_name');

    if (skillsError) {
      console.error('Error fetching skills:', skillsError);
    }

    // Fetch user experience
    const { data: experience, error: experienceError } = await supabase
      .from('user_experience')
      .select('company, role, duration, description')
      .eq('user_id', user.id)
      .order('sort_order');

    if (experienceError) {
      console.error('Error fetching experience:', experienceError);
    }

    // Fetch user education
    const { data: education, error: educationError } = await supabase
      .from('user_education')
      .select('institution, degree, year, description')
      .eq('user_id', user.id)
      .order('sort_order');

    if (educationError) {
      console.error('Error fetching education:', educationError);
    }

    // Fetch user certificates
    const { data: certificates, error: certificatesError } = await supabase
      .from('user_certificates')
      .select('name, issuer, issue_date, expiry_date, credential_id, verification_url')
      .eq('user_id', user.id)
      .order('issue_date DESC');

    if (certificatesError) {
      console.error('Error fetching certificates:', certificatesError);
    }

    // Transform data to match the expected ProfileData interface
    const profileData: ProfileData = {
      id: user.id,
      username: user.email?.split('@')[0] || 'user',
      name: profile?.name || '',
      title: profile?.title || '',
      bio: profile?.bio || '',
      avatar: profile?.avatar_url || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400`,
      location: profile?.location || '',
      email: profile?.email || user.email || '',
      phone: profile?.phone || '',
      linkedin: profile?.linkedin_url || '',
      website: profile?.website || '',
      
      // Transform skills data
      skills: skills?.map(skill => ({
        name: skill.skill_name,
        level: skill.proficiency_level,
        category: skill.category
      })) || [],
      
      // Transform experience data
      experience: experience?.map(exp => ({
        company: exp.company,
        role: exp.role,
        duration: exp.duration,
        description: exp.description
      })) || [],
      
      // Transform education data
      education: education?.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        year: edu.year,
        description: edu.description
      })) || [],
      
      // Transform certificates data
      certificates: certificates?.map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        issueDate: cert.issue_date,
        expiryDate: cert.expiry_date,
        credentialId: cert.credential_id,
        verificationUrl: cert.verification_url
      })) || []
    };

    return NextResponse.json({ 
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Profile data API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required.' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { profileData } = body;

    if (!profileData) {
      return NextResponse.json({ 
        error: 'Profile data is required' 
      }, { status: 400 });
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        name: profileData.name,
        title: profileData.title,
        bio: profileData.bio,
        location: profileData.location,
        email: profileData.email,
        phone: profileData.phone,
        linkedin_url: profileData.linkedin,
        website: profileData.website,
        avatar_url: profileData.avatar,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json({ 
        error: 'Failed to update profile' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 