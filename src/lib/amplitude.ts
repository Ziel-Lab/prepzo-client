// import amplitude from '@amplitude/analytics-browser';
import * as amplitude from '@amplitude/analytics-browser'; 


export const initAmplitude = () => {
    const apiKey = process.env.AMPLITUDE_API_KEY;
    if (!apiKey) {
        console.error('Amplitude API key is not set');
        return;
    }
    amplitude.init(apiKey); 
};

export default amplitude;