export const profileData = {
  user: {
    name: 'John Doe',
    title: 'Full Stack Developer',
    location: 'New York, USA',
    avatarUrl: '',
  },
  activityData: [
    { month: 'Jan', interviews: 9, practice: 3 },
    { month: 'Feb', interviews: 14, practice: 2 },
    { month: 'Mar', interviews: 18, practice: 5 },
    { month: 'Apr', interviews: 24, practice: 8 },
    { month: 'May', interviews: 33, practice: 9 },
    { month: 'Jun', interviews: 26, practice: 7 },
  ],
  skills: [
    { name: 'React', progress: 85 },
    { name: 'TypeScript', progress: 70 },
    { name: 'Node.js', progress: 75 },
    { name: 'UI/UX Design', progress: 60 },
    { name: 'DevOps', progress: 45 },
  ],
  achievements: [
    {
      id: '1',
      title: 'Completed 10 Practice Interviews',
      date: 'June 15, 2024',
      type: 'achievement',
      icon: 'check',
    },
    {
      id: '2',
      title: 'Resume Master',
      date: 'May 28, 2024',
      type: 'badge',
      icon: 'trophy',
    },
    {
      id: '3',
      title: '30 Day Streak',
      date: 'April 10, 2024',
      type: 'milestone',
      icon: 'calendar',
    },
  ],
  upcomingInterviews: [
    {
      id: '1',
      company: 'TechCorp',
      position: 'Senior Frontend Developer',
      date: 'June 28, 2024',
      time: '10:00 AM',
      type: 'technical',
    },
    {
      id: '2',
      company: 'InnovateX',
      position: 'Full Stack Engineer',
      date: 'July 3, 2024',
      time: '2:30 PM',
      type: 'behavioral',
    },
  ],
} 