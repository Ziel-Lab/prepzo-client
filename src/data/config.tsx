import { NextSeoProps } from 'next-seo'
import { FaTwitter } from 'react-icons/fa'
import { CgMail } from "react-icons/cg";
import { CiLinkedin } from "react-icons/ci";
import { FiCheck } from 'react-icons/fi'
import { Logo } from './logo'
import { RiDiscordFill } from "react-icons/ri";

const siteConfig = {
  logo: Logo,
  seo: {
    title: 'perpzo.',
    description: '',
  } as NextSeoProps,
  termsUrl: '#',
  privacyUrl: '#',
  header: {
    links: [
      {
        id: 'features',
        label: 'Features',
      },
      {
        id: 'faq',
        label: 'FAQ',
      },
      {
        label: 'Login',
        href: '/login',
      },
      {
        label: 'Sign Up',
        href: '/signup',
        variant: 'primary',
      },
    ],
  },
  footer: {
    copyright: (
      <>
        © {new Date().getFullYear()} CareerAI Coach. All rights reserved.
      </>
    ),
    links: [
      {
        href: 'mailto:hello@prepzo.co',
        label: <CgMail size="22" />,
      },
      {
        href: 'https://discord.gg/prepzo',
        label: <RiDiscordFill size="20"/>,
      },
      {
        href: 'https://twitter.com/saas_js',
        label: <FaTwitter size="20" />,
      },
      {
        href: 'https://www.linkedin.com/company/prepzo-ai/',
        label: <CiLinkedin size="22" />,
      },
    ],
  },
  signup: {
    title: 'Start building with Saas UI',
    features: [
      {
        icon: FiCheck,
        title: 'Accessible',
        description: 'All components strictly follow WAI-ARIA standards.',
      },
      {
        icon: FiCheck,
        title: 'Themable',
        description:
          'Fully customize all components to your brand with theme support and style props.',
      },
      {
        icon: FiCheck,
        title: 'Composable',
        description:
          'Compose components to fit your needs and mix them together to create new ones.',
      },
      {
        icon: FiCheck,
        title: 'Productive',
        description:
          'Designed to reduce boilerplate and fully typed, build your product at speed.',
      },
    ],
  },
}

export default siteConfig
