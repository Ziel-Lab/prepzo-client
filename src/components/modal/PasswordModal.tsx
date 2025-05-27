"use client";
import React, { useState } from 'react';

// Define backend URL (make sure NEXT_PUBLIC_BACKEND_URL is set in your .env.local)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const PasswordModal: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setError(null);
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setIsVerifying(true);
    setError(null);
    try {
      // Target the Flask backend URL and include credentials
      const response = await fetch(`${BACKEND_URL}/api/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include', // <-- Crucial: Send/Receive cookies for Flask session
      });

      if (!response.ok) {
         let errorMsg = 'Invalid password. Please try again.';
         try {
           // Try to parse error from Flask response
           const errorData = await response.json(); 
           errorMsg = errorData.message || errorMsg;
         } catch (e) { /* Ignore JSON parsing error if Flask sends plain text error */ }
         setError(errorMsg);
         throw new Error(errorMsg);
      }


    } catch (err: any) {
      console.error("Password verification error:", err);
      if (!error) { 
         setError(err.message || 'An error occurred during verification. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };


    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-card text-card-foreground rounded-lg shadow-xl w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3 p-0 flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-border text-center">
            <h2 className="text-lg font-semibold">Enter Password</h2>
          </div>

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
                <button type="submit" style={{ display: 'none' }} aria-hidden="true" disabled={isVerifying}></button>
              </div>
            </form>
          </div>

          <div className="flex justify-end items-center p-4 border-t border-border">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isVerifying}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    );
  }


export default PasswordModal; 