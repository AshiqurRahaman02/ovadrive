import React, { useEffect, useState } from "react";

function Chat() {
	const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
	const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
	const [frequencyData, setFrequencyData] = useState<Uint8Array>(
		new Uint8Array(0)
	);
	const [isRecording, setIsRecording] = useState(false);
	const [userState, setUserState] = useState("Idle"); // "Idle", "Listening", "Speaking"

	const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
		null
	);
	const [audioUrls, setAudioUrls] = useState<string[]>([]);

	const [seconds, setSeconds] = useState(5);
	const [isRunning, setIsRunning] = useState(false);
	const [lastSpeechTime, setLastSpeechTime] = useState(0);

	useEffect(() => {
		const activityThreshold = 200; // Adjust this threshold as needed
		const silenceTimeout = 3000; // 3 seconds in milliseconds

		let silenceTimer: any = null;

		const initAudioContext = async () => {
			try {
				const audioCtx = new window.AudioContext();
				const analyserNode = audioCtx.createAnalyser();
				analyserNode.fftSize = 256;
				const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				const source = audioCtx.createMediaStreamSource(stream);
				source.connect(analyserNode);

				setAudioContext(audioCtx);
				setAnalyser(analyserNode);

				// Set up MediaRecorder for audio recording
				const mediaRecorder = new MediaRecorder(stream);
				mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						setAudioChunks([...audioChunks, event.data]);
					}
				};
				mediaRecorder.onstop = () => {
					setMediaRecorder(null);
				};
				setMediaRecorder(mediaRecorder);

				audioCtx.resume().then(() => {
					setIsRecording(true);
					const updateFrequencyData = () => {
						analyserNode.getByteFrequencyData(dataArray);
						setFrequencyData(new Uint8Array(dataArray));

						const isSpeaking = dataArray.some(
							(value) => value > activityThreshold
						);

						if (isSpeaking) {
                            setSeconds(0)
							if (!mediaRecorder || mediaRecorder.state === "inactive") {
								mediaRecorder?.start();
							}
						} else {
							if (mediaRecorder && mediaRecorder.state === "recording") {
								mediaRecorder.stop();
							}
						}
                        setIsRunning(true);
                        
						requestAnimationFrame(updateFrequencyData);
					};

					updateFrequencyData();
				});
			} catch (error) {
				console.error("Error accessing audio:", error);
			}
		};

		initAudioContext();

		return () => {
			if (audioContext && audioContext.state === "running") {
				audioContext.close().then(() => {
					setIsRecording(false);
					setUserState("Idle");
				});
			}
		};
	}, []);

	useEffect(() => {
		if (audioChunks.length > 0) {
			const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
			const audioUrl = URL.createObjectURL(audioBlob);
			audioUrls.push(audioUrl);
			setAudioUrls(audioUrls);

			// setAudioChunks([]);
		}
	}, [audioChunks]);

	useEffect(() => {
		if (seconds < 5 && userState !== "Speaking") {
            setUserState("Speaking");
        } else
        if(seconds >= 5 && userState !== "Listening") {
            setUserState("Listening");
        }
	}, [seconds]);

	useEffect(() => {
		let intervalId: any;

		if (isRunning) {
			intervalId = setInterval(() => {
				setSeconds((prevSeconds) => prevSeconds + 1);
                
			}, 1000); // Update the timer every 1000 milliseconds (1 second).
		} else {
			clearInterval(intervalId); // Clear the interval when the timer is not running.
		}

		return () => {
			clearInterval(intervalId); // Clear the interval when the component unmounts.
		};
	}, [isRunning]);


	return (
		<div>
			<h1>Audio Frequency Display</h1>
			{isRecording ? (
				<div>
					<h2>Recording...</h2>
					<div>
						<p>Frequency at Bin 0: {frequencyData[0]}</p>
					</div>
				</div>
			) : (
				<h2>Audio not recording. Please allow microphone access.</h2>
			)}
			<h1>Audio Activity Display</h1>
			<h2>User State: {userState}</h2>
			<p>Listening for: {seconds}</p>
			{audioUrls.map((audioUrl) => (
				<audio controls>
					<source src={audioUrl} type="audio/wav" />
				</audio>
			))}

		</div>
	);
}

export default Chat;
