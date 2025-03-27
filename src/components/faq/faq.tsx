import { chakra, SimpleGrid } from '@chakra-ui/react'
import { Section, SectionProps, SectionTitle } from '@/components/section'

interface FaqProps extends Omit<SectionProps, 'title' | 'children'> {
  title?: React.ReactNode
  description?: React.ReactNode
  items: { q: React.ReactNode; a: React.ReactNode }[]
}

export const Faq: React.FC<FaqProps> = (props) => {
  const {
    title = 'Frequently asked questions',
    description,
    items = [],
  } = props
  return (
    <Section id="faq">
      <SectionTitle title={title} description={description} />

      <SimpleGrid columns={[1, null, 2]} spacingY={10} spacingX="20">
        {items?.map(({ q, a }, i) => {
          return <FaqItem key={i} question={q} answer={a} />
        })}
      </SimpleGrid>
    </Section>
  )
}

export interface FaqItemProps {
  question: React.ReactNode
  answer: React.ReactNode
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  return (
    <chakra.dl 
      transition="all 0.3s ease"
      
      _hover={{
        bg: {
          light: "gray.100",
          dark: "gray.700"
        },
        transform: "scale(1.02)",
        boxShadow: {
          light: "md",
          dark: "dark-lg"
        },
        borderRadius: "md",
        p: "2"
      }}
    >
      <chakra.dt 
        fontWeight="semibold" 
        mb="2"
        color={{
          light: "gray.800",
          dark: "white"
        }}
      >
        {question}
      </chakra.dt>
      <chakra.dd 
        color={{
          light: "gray.600",
          dark: "gray.300"
        }}
      >
        {answer}
      </chakra.dd>
    </chakra.dl>
  )
}
