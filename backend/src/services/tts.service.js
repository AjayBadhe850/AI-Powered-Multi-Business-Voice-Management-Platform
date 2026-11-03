import crypto from 'crypto';

// In-memory audio buffer cache (avoids re-generating audio for identical sentences like greetings)
const audioCache = new Map();
const MAX_CACHE_SIZE = 100;

export const synthesizeSpeech = async (text) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return { available: false, reason: 'NO_API_KEY' };
  }

  const cleanText = (text || '').trim();
  if (!cleanText) {
    return { available: false, reason: 'EMPTY_TEXT' };
  }

  // Check in-memory audio cache
  const cacheKey = crypto.createHash('md5').update(cleanText).digest('hex');
  if (audioCache.has(cacheKey)) {
    return {
      available: true,
      audioBuffer: audioCache.get(cacheKey),
      contentType: 'audio/mpeg',
      cached: true,
    };
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=3&output_format=mp3_22050_32`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4-second safety abort

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_turbo_v2_5', // ElevenLabs lowest latency model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.warn('ElevenLabs API returned error status:', response.status, errText);
      return { available: false, reason: `HTTP_${response.status}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cache the audio buffer
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = audioCache.keys().next().value;
      audioCache.delete(oldestKey);
    }
    audioCache.set(cacheKey, buffer);

    return {
      available: true,
      audioBuffer: buffer,
      contentType: 'audio/mpeg',
      cached: false,
    };
  } catch (err) {
    console.warn('ElevenLabs speech generation error or timeout:', err.message);
    return { available: false, reason: err.message };
  }
};

