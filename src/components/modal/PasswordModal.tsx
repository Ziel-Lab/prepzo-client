"use client";
import React, { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onVerify: (password: string) => Promise<boolean>; // Returns true on success, false on failure
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onVerify }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const toast = useToast(); // Chakra UI Toast removed

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
        // Optional: Show a toast notification for feedback (using a Tailwind-compatible library)
        // toast({ title: 'Incorrect Password', status: 'error', duration: 3000 }); // Chakra UI Toast removed
      }
      // If successful, the parent component will handle closing
    } catch (err) {
      console.error("Password verification error:", err);
      setError('An error occurred during verification. Please try again.');
      // toast({ title: 'Verification Error', status: 'error', duration: 3000 }); // Chakra UI Toast removed
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null; // Don't render anything if the modal is not open
  }

  return (
    // Modal Overlay - Fixed position, full screen, background with opacity
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      {/* Modal Content - Background, padding, rounded corners, shadow, width */}
      <div className="bg-card text-card-foreground rounded-lg shadow-xl w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3 p-0 flex flex-col max-h-[90vh]">
        {/* Modal Header - Padding, border bottom, text styles */}
        <div className="p-4 border-b border-border text-center">
          <h2 className="text-lg font-semibold">Enter Password</h2>
        </div>

        {/* Modal Body - Padding, flex-grow for scrolling */}
        <div className="p-6 pb-4 flex-grow overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter the password to access this page"
                  required
                  // Input styling: border, focus ring, padding, rounded
                  className={`block w-full rounded-md border px-3 py-2 shadow-sm 
                            ${error ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-primary'} 
                            focus:outline-none focus:ring-1 sm:text-sm 
                            bg-background text-foreground placeholder-muted-foreground`}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'password-error' : undefined}
                />
                {error && (
                  <p id="password-error" className="mt-1 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer - Padding, border top, flex for button alignment */}
        <div className="flex justify-end items-center p-4 border-t border-border">
          <button
            type="button" // Changed to type="button" to prevent accidental form submission
            onClick={handleSubmit} // Explicitly call handleSubmit
            disabled={isLoading}
            // Button styling: background, text color, padding, rounded, hover, focus, disabled states
            className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
          {/* No Cancel button */}
        </div>
      </div>
    </div>
  );
};

export default PasswordModal; 