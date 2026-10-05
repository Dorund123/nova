"use client";

import { useRef, useState } from "react";

type FaceScanProps = {
  onComplete: (imageData: string) => void;
};

export default function FaceScan({ onComplete }: FaceScanProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: 640,
          height: 480,
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraOn(true);
    } catch (error) {
      console.error(error);
      alert("Camera access was denied.");
    }
  }

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    setLoading(true);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.85);

    onComplete(imageData);

    const stream = video.srcObject as MediaStream | null;

    stream?.getTracks().forEach((track) => track.stop());

    setCameraOn(false);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1220] p-5 shadow-2xl">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">
          Create your Avatar
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Scan your face to personalize your Nova avatar.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="h-80 w-full object-cover"
          playsInline
          muted
        />

        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-3 text-6xl">👤</div>
              <p className="text-sm text-gray-400">
                Camera is not active
              </p>
            </div>
          </div>
        )}

        {cameraOn && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-56 w-44 rounded-[50%] border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.5)]" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {!cameraOn ? (
        <button
          onClick={startCamera}
          className="mt-5 w-full rounded-2xl bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400"
        >
          📷 Start Face Scan
        </button>
      ) : (
        <button
          onClick={takePhoto}
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? "Scanning..." : "📸 Scan My Face"}
        </button>
      )}

      <p className="mt-4 text-center text-xs text-gray-500">
        You choose whether to use the camera. Your original photo
        should not be stored unless you explicitly choose to save it.
      </p>
    </div>
  );
}