// utils/transcribe.js

export async function transcribeAudio(uri) {
  const apiKey = 'YOUR_OPENAI_API_KEY';
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'speech.m4a',
    type: 'audio/m4a',
  });
  formData.append('model', 'whisper-1');

  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Transcription error: ${err}`);
  }

  const { text } = await resp.json();
  return text;
}
