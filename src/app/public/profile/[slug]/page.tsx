import { notFound } from 'next/navigation';
import { Metadata } from 'next';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Github, Globe } from 'lucide-react';

interface PublicProfile {
  name?: string;
  title?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  skills?: Array<{ name: string }>;
  experience?: Array<{
    company: string;
    role: string;
    duration?: string;
    timeline?: string;
    description: string;
  }>;
  projects?: Array<{
    name: string;
    role: string;
    description: string;
    impact?: string;
    timeline?: string;
    technologies?: string[];
    links?: { demo?: string; repo?: string };
  }>;
  achievements?: Array<{
    title: string;
    description: string;
    date: string;
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

async function getProfile(slug: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL}/profile/public/${slug}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;

    // API returns { profile: { … } }
    const raw = await res.json();
    const data = raw.profile ?? raw;

    // Basic normalisation – map snake_case keys we use in UI
    const mapped: PublicProfile = {
      name: data.name,
      title: data.title,
      bio: data.bio,
      avatar: data.avatar || data.avatar_url,
      location: data.location,
      linkedin: data.linkedin || data.linkedin_url,
      github: data.github || data.github_url,
      website: data.website,
      experience: Array.isArray(data.experience) ? data.experience : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      education: Array.isArray(data.education) ? data.education : [],
      achievements: Array.isArray(data.achievements) ? data.achievements : [],
      certificates: Array.isArray(data.certifications) ? data.certifications : [],
      skills: Array.isArray(data.skills)
        ? data.skills.map((s: { name?: string } | string) => ({ name: typeof s === 'string' ? s : s.name ?? '' }))
        : [],
    };

    return mapped;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getProfile(params.slug);
  if (!data) return {};
  return {
    title: `${data.name || 'Profile'} | Prepzo`,
    description: data.bio || `${data.name}'s public profile on Prepzo`,
  };
}

export default async function PublicProfilePage({ params }: { params: { slug: string } }) {
  const profile = await getProfile(params.slug);
  if (!profile) notFound();

  const initials = profile.name ? profile.name.split(' ').map(p => p[0]).join('').slice(0, 2) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-prepzo-50 via-white to-prepzo-100/50 flex flex-col items-center py-10 px-4">
      {/* Header card */}
      <div className="w-full max-w-3xl bg-white/80 backdrop-blur-md shadow-xl rounded-xl p-6 md:p-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
            <AvatarImage src={profile.avatar || ''} alt={profile.name || 'avatar'} />
            <AvatarFallback className="bg-prepzo-200 text-prepzo-700 text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {profile.name && (
            <h1 className="text-2xl md:text-3xl font-bold text-prepzo-900">{profile.name}</h1>
          )}
          {profile.title && (
            <p className="text-prepzo-600 text-sm md:text-base">{profile.title}</p>
          )}
          {profile.location && (
            <p className="text-prepzo-500 text-xs md:text-sm">{profile.location}</p>
          )}
          {profile.bio && (
            <p className="text-prepzo-700 mt-3 max-w-xl text-sm md:text-base whitespace-pre-line">
              {profile.bio}
            </p>
          )}

          {/* Social links */}
          <div className="flex gap-3 mt-4">
            {profile.linkedin && (
              <a
                href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full border border-prepzo-200 hover:bg-prepzo-50 transition"
              >
                <Linkedin className="w-4 h-4 text-prepzo-700" />
              </a>
            )}
            {profile.github && (
              <a
                href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full border border-prepzo-200 hover:bg-prepzo-50 transition"
              >
                <Github className="w-4 h-4 text-prepzo-700" />
              </a>
            )}
            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full border border-prepzo-200 hover:bg-prepzo-50 transition"
              >
                <Globe className="w-4 h-4 text-prepzo-700" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Skills section */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="w-full max-w-3xl bg-white/70 mt-8 p-6 md:p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-prepzo-800 text-lg font-semibold mb-4 text-center">Skills</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {profile.skills.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="bg-prepzo-200 text-prepzo-800 px-3 py-1 text-xs">
                {skill.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Experience section */}
      {profile.experience && profile.experience.length > 0 && (
        <div className="w-full max-w-3xl bg-white/70 mt-8 p-6 md:p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-prepzo-800 text-lg font-semibold mb-4 text-center">Experience</h2>
          <div className="space-y-6">
            {profile.experience.map((exp, idx) => (
              <div key={idx} className="border-l-2 border-prepzo-300 pl-4">
                <h3 className="text-prepzo-900 font-semibold text-base md:text-lg">{exp.role}</h3>
                <p className="text-prepzo-600 text-sm md:text-base mb-1">{exp.company}</p>
                <p className="text-prepzo-500 text-xs md:text-sm mb-2">{exp.duration || exp.timeline}</p>
                <p className="text-prepzo-700 text-sm md:text-base whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects section */}
      {profile.projects && profile.projects.length > 0 && (
        <div className="w-full max-w-3xl bg-white/70 mt-8 p-6 md:p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-prepzo-800 text-lg font-semibold mb-4 text-center">Projects</h2>
          <div className="space-y-6">
            {profile.projects.map((project, idx) => (
              <div key={idx} className="border border-prepzo-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-prepzo-900 font-semibold text-base md:text-lg">{project.name}</h3>
                    <p className="text-prepzo-600 text-sm md:text-base">{project.role}</p>
                    {project.timeline && <p className="text-prepzo-500 text-xs md:text-sm">{project.timeline}</p>}
                  </div>
                </div>
                <p className="text-prepzo-700 text-sm md:text-base my-2 whitespace-pre-line">{project.description}</p>
                {project.impact && <p className="text-prepzo-600 text-xs md:text-sm mb-2">Impact: {project.impact}</p>}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.technologies.map((tech, tIdx) => (
                      <Badge key={tIdx} variant="secondary" className="bg-prepzo-100 text-prepzo-800 px-2 py-0.5 text-xs">{tech}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education section */}
      {profile.education && profile.education.length > 0 && (
        <div className="w-full max-w-3xl bg-white/70 mt-8 p-6 md:p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-prepzo-800 text-lg font-semibold mb-4 text-center">Education</h2>
          <div className="space-y-6">
            {profile.education.map((edu, idx) => (
              <div key={idx} className="border-l-2 border-prepzo-300 pl-4">
                <h3 className="text-prepzo-900 font-semibold text-base md:text-lg">{edu.degree}</h3>
                <p className="text-prepzo-600 text-sm md:text-base mb-1">{edu.institution}</p>
                <p className="text-prepzo-500 text-xs md:text-sm mb-2">{edu.year}</p>
                <p className="text-prepzo-700 text-sm md:text-base whitespace-pre-line">{edu.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements section */}
      {profile.achievements && profile.achievements.length > 0 && (
        <div className="w-full max-w-3xl bg-white/70 mt-8 p-6 md:p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-prepzo-800 text-lg font-semibold mb-4 text-center">Achievements</h2>
          <div className="space-y-6">
            {profile.achievements.map((ach, idx) => (
              <div key={idx} className="border border-prepzo-200 rounded-lg p-4">
                <h3 className="text-prepzo-900 font-semibold text-base md:text-lg">{ach.title}</h3>
                <p className="text-prepzo-500 text-xs md:text-sm mb-1">{ach.date}</p>
                <p className="text-prepzo-700 text-sm md:text-base whitespace-pre-line">{ach.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates section */}
      {profile.certificates && profile.certificates.length > 0 && (
        <div className="w-full max-w-3xl bg-white/70 mt-8 p-6 md:p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-prepzo-800 text-lg font-semibold mb-4 text-center">Certificates</h2>
          <div className="space-y-6">
            {profile.certificates.map((cert, idx) => (
              <div key={idx} className="border border-prepzo-200 rounded-lg p-4">
                <h3 className="text-prepzo-900 font-semibold text-base md:text-lg">{cert.name}</h3>
                <p className="text-prepzo-600 text-sm md:text-base mb-1">{cert.issuer}</p>
                <p className="text-prepzo-500 text-xs md:text-sm mb-1">Issued: {cert.issueDate}</p>
                {cert.expiryDate && <p className="text-prepzo-500 text-xs md:text-sm mb-1">Expires: {cert.expiryDate}</p>}
                {cert.credentialId && <p className="text-prepzo-500 text-xs md:text-sm mb-1">ID: {cert.credentialId}</p>}
                {cert.verificationUrl && (
                  <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs md:text-sm">Verify</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}