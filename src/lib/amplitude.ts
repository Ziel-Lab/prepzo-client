import * as amplitude from '@amplitude/analytics-node';

let initialized = false;

function initAmplitude() {
  if (!initialized) {
    const apiKey = process.env.AMPLITUDE_API_KEY || process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || 'f305ca2d29463ec9b3e855890722bf5';
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

  const {
    user_uuid,
    user_email,
    user_name,
    source,
    subscription_status,
    subscription_plan,
  } = payload;

  // 1. Track the sign_up event
  await amplitude.track('sign_up', { source }, { user_id: user_uuid }).promise;

  // 2. Set / update user properties via Identify call
  const identifyObj = new amplitude.Identify();
  if (user_email) identifyObj.set('email', user_email);
  if (user_name) identifyObj.set('name', user_name);
  identifyObj.set('subscription_status', subscription_status);
  identifyObj.set('subscription_plan', subscription_plan);

  await amplitude.identify(identifyObj, { user_id: user_uuid }).promise;
}
