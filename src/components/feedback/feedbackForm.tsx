"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

const FilledStar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={1.5}
    className="w-7 h-7"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 17.25l-6.16 3.73 1.64-7.03L2 9.77l7.19-.62L12 2.5l2.81 6.65 7.19.62-5.48 4.18 1.64 7.03z"
    />
  </svg>
);

interface FeedbackFormProps {
  roomId: string;
  onDone?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ roomId, onDone }) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars: rating, comments: comment, room_id: roomId, submit: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit feedback');
        setLoading(false);
        return;
      }
      setSubmitted(true);
      setLoading(false);
      if (onDone) onDone();
    } catch (err: any) {
      setError('Failed to submit feedback');
      setLoading(false);
    }
  };

  const handleSkip = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, submit: false }),
      });
      if (onDone) onDone();
    } catch (err: any) {
      if (onDone) onDone();
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center animate-fade-in">
        <div className="mb-4 flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) =>
            rating >= star ? (
              <FilledStar key={star} className="w-7 h-7 text-yellow-400" />
            ) : (
              <Star key={star} className="w-7 h-7 text-gray-300" />
            )
          )}
        </div>
        <h2 className="text-xl font-semibold mb-2 text-center">Thank you for your feedback!</h2>
        <p className="text-gray-500 text-center mb-2">We appreciate your input and will use it to improve your experience.</p>
        {comment && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mt-2 w-full text-center text-gray-700">
            <span className="font-medium">Your comment:</span>
            <div className="mt-1 text-base">{comment}</div>
          </div>
        )}
        {/* LinkedIn Share Button START */}
        <div className="mt-6 w-full flex justify-center">
          <button
            onClick={() => {
              const shareUrl = encodeURIComponent(window.location.origin + '/'); // URL to Prepzo homepage or a specific page
              const shareText = encodeURIComponent("I just had a valuable career coaching session with Prepzo! Check them out.");
              const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
              // LinkedIn also uses a Mini Profile plugin or a direct share URL with a text parameter that might be better for pre-filling text
              // For text prefill, this format is sometimes cited: https://www.linkedin.com/shareArticle?mini=true&url={url}&title={title}&summary={text}&source={source_name}
              // However, share-offsite is the more modern approach. We can also add a text to the share-offsite if needed and if it works consistently.
              // Let's try adding text to share-offsite first:
              // const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&text=${shareText}`;
              // For robust pre-filling of the user's share box, the shareArticle link might be more consistent, though deprecated for direct sharing in favor of share-offsite.
              // Given LinkedIn's API nuances, sticking to the simpler share-offsite (which prioritizes the URL for a preview) is often safer.
              // If complex prefill is needed, shareArticle might be tried with caution or an official SDK.
              // For now, let's use the standard share-offsite focusing on the URL.

              window.open(linkedInShareUrl, '_blank', 'noopener,noreferrer');
            }}
            className="mt-4 inline-flex items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            Share on LinkedIn
          </button>
        </div>
        {/* LinkedIn Share Button END */}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-lg w-full animate-fade-in flex flex-col items-center">
      <div className="mb-4">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="#FFF9E5"/>
          <path d="M24 14C19.03 14 15 18.03 15 23C15 27.97 19.03 32 24 32C28.97 32 33 27.97 33 23C33 18.03 28.97 14 24 14ZM24 30C20.13 30 17 26.87 17 23C17 19.13 20.13 16 24 16C27.87 16 31 19.13 31 23C31 26.87 27.87 30 24 30Z" fill="#FFD600"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-1 text-center">We Value Your Feedback</h2>
      <p className="text-gray-500 mb-6 text-center">We're a small startup with a big belief—that better career support can change lives. Your feedback helps, a lot.</p>
      <div className="flex justify-center space-x-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            className="transition-transform focus:outline-none"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            {rating >= star ? (
              <FilledStar className="w-7 h-7 text-yellow-400 drop-shadow-sm" />
            ) : (
              <Star className="w-7 h-7 text-gray-300" />
            )}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (optional)"
        className="w-full p-3 border border-gray-200 rounded-lg mb-6 focus:ring-2 focus:ring-yellow-200 focus:outline-none resize-none text-base"
        rows={3}
      />
      {error && <div className="text-red-500 mb-4 text-center w-full">{error}</div>}
      <button
        type="submit"
        className="group mx-auto w-full py-2 px-5 text-base bg-gradient-to-r from-green-800 to-green-950 text-white shadow-[0_0_15px_2px_rgba(200,200,255,0.3)] hover:shadow-[0_0_25px_5px_rgba(200,200,255,0.4)] transition-transform duration-300 ease-in-out hover:scale-105 font-semibold rounded-lg disabled:opacity-60 text-lg"
        disabled={rating === 0 || loading}
      >
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </button>
      <div className="mt-6 text-center w-full">
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-gray-400 hover:text-yellow-500 underline transition-colors"
        >
          Skip feedback
        </button>
        <div className="text-xs text-gray-400 mt-1 italic">
          Are you sure? Your feedback helps us make Prepzo better for everyone!
        </div>
      </div>
    </form>
  );
};

export default FeedbackForm;

// Add fade-in animation
// In your global CSS (e.g., styles/globals.css), add:
// .animate-fade-in { animation: fadeIn 0.5s ease; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
