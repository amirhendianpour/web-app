import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '../context/CallContext';
import { useUserDirectory } from '../context/UserDirectoryContext';
import { startRingtone, stopRingtone } from '../utils/ringtone';

const CallOverlay: React.FC = () => {
  const {
    callStatus, callType, remoteUser, isMuted, isCameraOff,
    localStream, remoteStream,
    acceptCall, rejectCall, endCall, toggleMute, toggleCamera
  } = useCall();

  const { getDisplayName, ensureLoaded } = useUserDirectory();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);

  const isVideo = callType === "VIDEO";

  useEffect(() => {
    if (remoteUser) ensureLoaded([remoteUser]);
  }, [remoteUser, ensureLoaded]);

  const displayName = remoteUser ? getDisplayName(remoteUser) : "";

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (isVideo && remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (!isVideo && remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideo]);

  useEffect(() => {
    if (callStatus === "connected" && remoteVideoRef.current) {
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === "ringing") {
      startRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [callStatus]);

  useEffect(() => {
    if (callStatus !== "connected") { setDuration(0); return; }
    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  if (callStatus === "idle") return null;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const showRemoteVideo = isVideo && callStatus === "connected";
  const showLocalPreview = isVideo && !!localStream && !isCameraOff;

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">

      {/* ویدیوی طرف مقابل — همیشه در DOM می‌ماند، فقط نمایشش با CSS کنترل می‌شود */}
      {isVideo && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover bg-black ${showRemoteVideo ? "" : "hidden"}`}
        />
      )}

      {!showRemoteVideo && (
        <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm" />
      )}

      {!isVideo && <audio ref={remoteAudioRef} autoPlay />}

      {/* پیش‌نمایش دوربین خودم — همیشه در DOM می‌ماند، فقط نمایشش با CSS کنترل می‌شود */}
      {isVideo && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`absolute bottom-28 left-4 w-28 h-40 object-cover rounded-xl border-2 border-white/40 shadow-lg z-10 -scale-x-100 ${showLocalPreview ? "" : "hidden"}`}
        />
      )}

      {/* آواتار و اسم */}
      {!showRemoteVideo && (
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-600 rounded-full mb-6 flex items-center justify-center text-3xl shadow-lg border-4 border-gray-500">
            {displayName?.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold mb-2">{displayName}</h2>
        </div>
      )}

      <p className="relative z-10 text-gray-200 mb-12 mt-2 drop-shadow">
        {callStatus === "calling" && (isVideo ? "در حال تماس تصویری..." : "در حال تماس...")}
        {callStatus === "ringing" && (isVideo ? "تماس تصویری ورودی..." : "تماس ورودی...")}
        {callStatus === "connected" && formatDuration(duration)}
      </p>

      {callStatus === "ringing" ? (
        <div className="relative z-10 flex gap-6">
          <button onClick={acceptCall} className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-xl hover:bg-green-600 transition shadow-lg">
            {isVideo ? "🎥" : "📞"}
          </button>
          <button onClick={rejectCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-xl hover:bg-red-600 transition shadow-lg shadow-red-500/30">☎️</button>
        </div>
      ) : (
        <div className="relative z-10 flex gap-6">
          <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${isMuted ? "bg-gray-400" : "bg-gray-700 hover:bg-gray-600"}`}>
            {isMuted ? "🔇" : "🎤"}
          </button>

          {isVideo && (
            <button onClick={toggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${isCameraOff ? "bg-gray-400" : "bg-gray-700 hover:bg-gray-600"}`}>
              {isCameraOff ? "📷" : "🎥"}
            </button>
          )}

          <button onClick={endCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-xl hover:bg-red-600 transition shadow-lg shadow-red-500/30">☎️</button>
        </div>
      )}
    </div>
  );
};

export default CallOverlay;