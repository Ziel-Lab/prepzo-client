import {
  Avatar,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link } from "@saas-ui/react";
import { FaTwitter } from "react-icons/fa";

export interface TestimonialProps extends CardProps {
  name: string;
  description: React.ReactNode;
  avatar: string;
  href?: string;
  children?: React.ReactNode;
}

export const Testimonial = ({
  name,
  description,
  avatar,
  href,
  children,
  ...rest
}: TestimonialProps) => {
  return (
    <Card 
      position="relative" 
      height="100%" 
      display="flex"
      flexDirection="column"
      minH="200px"
      boxShadow="md"
      borderRadius="lg"
      {...rest}
    >
      <CardHeader display="flex" flexDirection="row" alignItems="center">
        <Avatar name={name} src={avatar} size="sm" bg="transparent" />
        <Stack spacing="1" ms="4">
          <Heading size="sm">{name}</Heading>
          <Text color="muted" size="xs">
            {description}
          </Text>
        </Stack>
      </CardHeader>
      <CardBody 
        flex="1" 
        display="flex" 
        flexDirection="column" 
        justifyContent="center"
      >
        <Text fontSize="md" fontStyle="italic">
          {children}
        </Text>

        {href && (
          <Link href={href} position="absolute" top="4" right="4">
            <FaTwitter />
          </Link>
        )}
      </CardBody>
    </Card>
  );
};
