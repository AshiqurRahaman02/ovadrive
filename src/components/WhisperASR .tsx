import React, { useState } from 'react';

const WhisperASR = () => {
  const [audioChunks, setAudioChunks] =  useState<Blob[]>([]);
  const [transcription, setTranscription] = useState('');

  let mediaRecorder:any = null;

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event:any) => {
          if (event.data.size > 0) {
            setAudioChunks([...audioChunks, event.data]);
          }
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.wav');

          // Send the formData to your transcription service here

          // Reset audioChunks
          setAudioChunks([]);
        };

        mediaRecorder.start();
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  const handleTranscribe = () => {
    // Implement transcription logic using your API or service
  };

  return (
    <div>
      <h2>Whisper ASR</h2>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      <button onClick={handleTranscribe}>Transcribe Audio</button>

      {transcription && <div>Transcription: {transcription}</div>}
    </div>
  );
};

export default WhisperASR;
