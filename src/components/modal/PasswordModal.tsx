import React, { useState } from 'react';
import {
  Modal,
  InputGroup,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  VStack,
  useToast,
} from '@chakra-ui/react';

interface PasswordModalProps {
  isOpen: boolean;
  onVerify: (password: string) => Promise<boolean>; // Returns true on success, false on failure
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onVerify }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setError(null); // Clear error when user types
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const success = await onVerify(password);
      if (!success) {
        setError('Invalid password. Please try again.');
        // Optional: Show a toast notification for feedback
        // toast({ title: 'Incorrect Password', status: 'error', duration: 3000 });
      }
      // If successful, the parent component will close the modal by changing isOpen
    } catch (err) {
      console.error("Password verification error:", err);
      setError('An error occurred during verification. Please try again.');
      toast({ title: 'Verification Error', status: 'error', duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-modal-wrapper">
      <Modal
        isOpen={isOpen}
        onClose={() => {}} // Intentionally empty: cannot close via overlay click
        isCentered
        closeOnOverlayClick={false} // Prevent closing by clicking overlay
        closeOnEsc={false} // Prevent closing by pressing Esc
        size="2xl" // Keeping size hint
      >
        <ModalOverlay bg='blackAlpha.800' /> {/* Darker overlay */}
        {/* Apply display flex and column direction for better control over spacing */}
        {/* Let height be determined by content to remove excess whitespace */}
        <ModalContent
          width="60vw" // Attempt to force 60% width
          // Note: Fixed vh/vw can cause overflow or empty space issues
        >
          <ModalHeader textAlign="center">Enter Password</ModalHeader>
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!error}>
                  <FormLabel htmlFor='password'>Password</FormLabel>
                  <InputGroup size='md'>
                    <Input
                      id='password'
                      type={'password'}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder='Enter the password to access this page'
                      isRequired
                    />
                  </InputGroup>
                  {error && <FormErrorMessage>{error}</FormErrorMessage>}
                </FormControl>
              </VStack>
            </form>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme='blue'
              mr={3}
              onClick={handleSubmit} // Trigger submit handler
              isLoading={isLoading}
              type="submit" // Ensures form submission works correctly
            >
              Verify
            </Button>
            {/* No Cancel button to enforce password entry */}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PasswordModal; 