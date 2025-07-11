import * as amplitude from '@amplitude/analytics-node';

let initialized = false;

function initAmplitude() {
  if (!initialized) {
    const apiKey = process.env.AMPLITUDE_API_KEY || process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
    
    if (!apiKey) {
      console.warn('Amplitude API key not configured. Analytics will be disabled.');
      return;
    }
    
    amplitude.init(apiKey, {
      serverZone: amplitude.Types.ServerZone.EU,
      flushIntervalMillis: 5_000,
    });
    initialized = true;
  }
}

export interface SignupEventPayload {
  user_uuid: string;
  user_email: string | null;
  user_name: string | null;
  source: 'Google' | 'Linkedin';
  subscription_status: 'Active' | 'Expired' | string;
  subscription_plan: string;
}

export async function sendSignupEvent(payload: SignupEventPayload) {
  initAmplitude();

  // If Amplitude is not initialized (no API key), skip analytics
  if (!initialized) {
    console.warn('Amplitude not initialized. Skipping signup event.');
    return;
  }

  const {
    user_uuid,
    user_email,
    user_name,
    source,
    subscription_status,
    subscription_plan,
  } = payload;

  try {
    // 1. Track the sign_up event
    await amplitude.track('sign_up', { source }, { user_id: user_uuid }).promise;

    // 2. Set / update user properties via Identify call
    const identifyObj = new amplitude.Identify();
    if (user_email) identifyObj.set('email', user_email);
    if (user_name) identifyObj.set('name', user_name);
    identifyObj.set('subscription_status', subscription_status);
    identifyObj.set('subscription_plan', subscription_plan);

    await amplitude.identify(identifyObj, { user_id: user_uuid }).promise;
  } catch (error) {
    console.error('Failed to send Amplitude signup event:', error);
    // Don't throw - analytics failures shouldn't break the application
  }
}
