// Mock LinkedIn PDF data extractor for testing
// This simulates what the actual backend would return after processing a LinkedIn PDF

interface LinkedInExtractedData {
  name?: string;
  title?: string;
  bio?: string;
  location?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
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
  }>;
}

// Mock data that would be extracted from a LinkedIn PDF
export const mockExtractLinkedInData = (): Promise<LinkedInExtractedData> => {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      const mockData: LinkedInExtractedData = {
        name: "Sarah Johnson",
        title: "Senior Product Manager | AI & Machine Learning",
        bio: "Experienced product manager with 8+ years building AI-powered solutions that drive business growth. Passionate about creating user-centric products that solve real-world problems through innovative technology.",
        location: "Seattle, WA",
        email: "sarah.johnson@email.com",
        phone: "+1 (425) 555-0123",
        linkedin: "linkedin.com/in/sarahjohnson",
        website: "sarahjohnson.dev",
        
        skills: [
          { name: "Product Management", level: 95, category: "Product" },
          { name: "Machine Learning", level: 85, category: "Technical" },
          { name: "Data Analysis", level: 90, category: "Analytics" },
          { name: "User Experience Design", level: 80, category: "Design" },
          { name: "Python", level: 75, category: "Programming" },
          { name: "SQL", level: 85, category: "Database" },
          { name: "Agile Methodologies", level: 90, category: "Project Management" },
          { name: "Strategic Planning", level: 88, category: "Strategy" },
          { name: "Team Leadership", level: 92, category: "Leadership" },
          { name: "Market Research", level: 87, category: "Research" }
        ],
        
        experience: [
          {
            company: "TechCorp Inc.",
            role: "Senior Product Manager",
            duration: "2021 - Present",
            description: "Lead product strategy for AI-powered analytics platform serving 500K+ users. Increased user engagement by 45% and reduced churn by 30% through data-driven product improvements."
          },
          {
            company: "InnovateLabs",
            role: "Product Manager",
            duration: "2019 - 2021", 
            description: "Managed end-to-end product development for machine learning tools. Collaborated with engineering and design teams to deliver 3 major product releases ahead of schedule."
          },
          {
            company: "StartupXYZ",
            role: "Associate Product Manager",
            duration: "2017 - 2019",
            description: "Supported product development for mobile applications. Conducted user research and A/B testing that informed product roadmap decisions affecting 100K+ monthly active users."
          },
          {
            company: "Digital Solutions Co",
            role: "Business Analyst",
            duration: "2016 - 2017",
            description: "Analyzed market trends and user behavior to identify product opportunities. Created detailed business requirements and user stories for development teams."
          }
        ],
        
        education: [
          {
            institution: "University of Washington",
            degree: "Master of Science in Human-Computer Interaction",
            year: "2016",
            description: "Specialized in user experience research and design thinking methodologies. Thesis focused on AI interface design for improved user adoption."
          },
          {
            institution: "Stanford University", 
            degree: "Bachelor of Science in Computer Science",
            year: "2014",
            description: "Concentration in Artificial Intelligence. Graduated Magna Cum Laude. Active member of Women in Tech organization."
          }
        ],
        
        certificates: [
          {
            name: "Certified Scrum Product Owner (CSPO)",
            issuer: "Scrum Alliance",
            issueDate: "2023-03-15",
            expiryDate: "2025-03-15",
            credentialId: "CSPO-001234567"
          },
          {
            name: "Google Analytics Individual Qualification",
            issuer: "Google",
            issueDate: "2023-01-20",
            expiryDate: "2024-01-20", 
            credentialId: "IQ-987654321"
          },
          {
            name: "AWS Certified Cloud Practitioner",
            issuer: "Amazon Web Services",
            issueDate: "2022-11-10",
            expiryDate: "2025-11-10",
            credentialId: "AWS-CCP-789012345"
          },
          {
            name: "Product Management Certificate",
            issuer: "Product School",
            issueDate: "2022-08-05",
            credentialId: "PS-PM-456789012"
          }
        ]
      };
      
      resolve(mockData);
    }, 2000); // 2 second delay to simulate processing
  });
};

// Function to extract text patterns from PDF (this would be implemented in the actual backend)
export const extractProfilePatterns = (pdfContent: string): Partial<LinkedInExtractedData> => {
  // This is a simplified example of how text patterns might be extracted
  const patterns = {
    email: /[\w\.-]+@[\w\.-]+\.\w+/g,
    phone: /\+?[\d\s\-\(\)]{10,}/g,
    linkedin: /linkedin\.com\/in\/[\w\-]+/g,
    website: /(https?:\/\/)?([\w\.-]+\.\w+)/g
  };
  
  const extracted: Partial<LinkedInExtractedData> = {};
  
  // Extract email
  const emailMatch = pdfContent.match(patterns.email);
  if (emailMatch) {
    extracted.email = emailMatch[0];
  }
  
  // Extract phone
  const phoneMatch = pdfContent.match(patterns.phone);
  if (phoneMatch) {
    extracted.phone = phoneMatch[0];
  }
  
  // Extract LinkedIn URL
  const linkedinMatch = pdfContent.match(patterns.linkedin);
  if (linkedinMatch) {
    extracted.linkedin = linkedinMatch[0];
  }
  
  return extracted;
};

// Utility function to categorize skills (this would use ML in production)
export const categorizeSkill = (skillName: string): string => {
  const categories = {
    'Technical': ['python', 'java', 'javascript', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes'],
    'Design': ['figma', 'sketch', 'photoshop', 'ux design', 'ui design', 'user experience', 'design thinking'],
    'Product': ['product management', 'roadmap planning', 'user stories', 'requirements gathering'],
    'Analytics': ['google analytics', 'data analysis', 'tableau', 'power bi', 'excel', 'statistics'],
    'Project Management': ['agile', 'scrum', 'kanban', 'jira', 'project planning', 'risk management'],
    'Leadership': ['team leadership', 'mentoring', 'stakeholder management', 'communication'],
    'Marketing': ['seo', 'content marketing', 'social media', 'email marketing', 'branding']
  };
  
  const skillLower = skillName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => skillLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'General';
}; 