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
      width="100%"
      maxW="500px"
      display="flex"
      flexDirection="column"
      minH="240px"
      boxShadow="md"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      bg="gray.50"
      _dark={{
        bg: "rgba(17, 17, 17, 0.75)",
        borderColor: "whiteAlpha.100"
      }}
      transition="all 0.3s ease-in-out"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "0 0 30px -5px rgba(122, 55, 230, 0.5)",
        borderColor: "#7A37E6",
        bg: "white",
        _dark: {
          bg: "rgba(25, 25, 25, 0.85)",
          borderColor: "purple.400"
        }
      }}
      {...rest}
    >
      <CardHeader display="flex" flexDirection="row" alignItems="center">
        <Avatar name={name} src={avatar} size="lg" bg="transparent" />
        <Stack spacing="1" ms="4">
          <Heading size="md">{name}</Heading>
          <Text color="muted" size="lg">
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
