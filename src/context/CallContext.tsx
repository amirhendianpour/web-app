import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";
import { useWebSocket } from "./WebSocketContext";
import type { CallSignal, CallStatus, CallKind } from "../types/Call";

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

interface CallContextType {
    callStatus: CallStatus;
    callType: CallKind | null;
    remoteUser: string | null;
    isMuted: boolean;
    isCameraOff: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    startCall: (recipient: string, callType?: CallKind) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider = ({ children }: { children: ReactNode }) => {
    const { onCallSignal, sendCallSignal } = useWebSocket();

    const [callStatus, setCallStatus] = useState<CallStatus>("idle");
    const [callType, setCallType] = useState<CallKind | null>(null);
    const [remoteUser, setRemoteUser] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const callIdRef = useRef<string>("");
    const pendingOfferRef = useRef<CallSignal | null>(null);
    const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
    const statusRef = useRef<CallStatus>("idle");
    const localStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => { statusRef.current = callStatus; }, [callStatus]);

    const cleanup = () => {
        pcRef.current?.close();
        pcRef.current = null;
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
        setRemoteUser(null);
        setCallStatus("idle");
        setCallType(null);
        setIsMuted(false);
        setIsCameraOff(false);
        callIdRef.current = "";
        pendingOfferRef.current = null;
        iceQueueRef.current = [];
    };

    const createPeerConnection = (peer: string) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendCallSignal({
                    type: "ICE_CANDIDATE",
                    to: peer,
                    candidate: JSON.stringify(event.candidate),
                    callId: callIdRef.current
                });
            }
        };

        pc.ontrack = (event) => setRemoteStream(event.streams[0]);

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") setCallStatus("connected");
            if (["disconnected", "failed", "closed"].includes(pc.connectionState)) cleanup();
        };

        pcRef.current = pc;
        return pc;
    };

    // withVideo مشخص می‌کند آیا track ویدیو هم گرفته شود یا فقط صدا
    const attachLocalStream = async (pc: RTCPeerConnection, withVideo: boolean) => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: withVideo ? { facingMode: "user" } : false
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        return stream;
    };

    const startCall = async (recipient: string, kind: CallKind = "AUDIO") => {
        if (statusRef.current !== "idle") return;

        callIdRef.current = crypto.randomUUID();
        setRemoteUser(recipient);
        setCallType(kind);
        setCallStatus("calling");

        const pc = createPeerConnection(recipient);
        await attachLocalStream(pc, kind === "VIDEO");

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendCallSignal({
            type: "OFFER",
            to: recipient,
            sdp: JSON.stringify(offer),
            callId: callIdRef.current,
            callType: kind
        });
    };

    const acceptCall = async () => {
        const offerSignal = pendingOfferRef.current;
        if (!offerSignal?.from || !offerSignal.sdp) return;

        const kind: CallKind = offerSignal.callType === "VIDEO" ? "VIDEO" : "AUDIO";

        const pc = createPeerConnection(offerSignal.from);
        await attachLocalStream(pc, kind === "VIDEO");
        await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerSignal.sdp)));

        for (const c of iceQueueRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        iceQueueRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendCallSignal({
            type: "ANSWER",
            to: offerSignal.from,
            sdp: JSON.stringify(answer),
            callId: callIdRef.current,
            callType: kind
        });

        setCallStatus("connected");
        pendingOfferRef.current = null;
    };

    const rejectCall = () => {
        if (pendingOfferRef.current?.from) {
            sendCallSignal({ type: "REJECT", to: pendingOfferRef.current.from, callId: callIdRef.current });
        }
        cleanup();
    };

    const endCall = () => {
        if (remoteUser) sendCallSignal({ type: "END", to: remoteUser, callId: callIdRef.current });
        cleanup();
    };

    const toggleMute = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
        setIsMuted(prev => !prev);
    };

    const toggleCamera = () => {
        if (!localStreamRef.current) return;
        const videoTracks = localStreamRef.current.getVideoTracks();
        if (videoTracks.length === 0) return;
        videoTracks.forEach(track => { track.enabled = !track.enabled; });
        setIsCameraOff(prev => !prev);
    };

    useEffect(() => {
        const unsubscribe = onCallSignal(async (signal: CallSignal) => {
            switch (signal.type) {
                case "OFFER":
                    if (statusRef.current !== "idle") {
                        sendCallSignal({ type: "BUSY", to: signal.from!, callId: signal.callId });
                        return;
                    }
                    callIdRef.current = signal.callId;
                    pendingOfferRef.current = signal;
                    setRemoteUser(signal.from || null);
                    setCallType(signal.callType === "VIDEO" ? "VIDEO" : "AUDIO");
                    setCallStatus("ringing");
                    break;

                case "ANSWER":
                    if (pcRef.current && signal.sdp) {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.sdp)));
                    }
                    break;

                case "ICE_CANDIDATE":
                    if (signal.candidate) {
                        const candidate = JSON.parse(signal.candidate);
                        if (pcRef.current?.remoteDescription) {
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                        } else {
                            iceQueueRef.current.push(candidate);
                        }
                    }
                    break;

                case "REJECT":
                case "END":
                case "BUSY":
                    cleanup();
                    break;
            }
        });

        return unsubscribe;
    }, []);

    return (
        <CallContext.Provider value={{
            callStatus, callType, remoteUser, isMuted, isCameraOff, localStream, remoteStream,
            startCall, acceptCall, rejectCall, endCall, toggleMute, toggleCamera
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const ctx = useContext(CallContext);
    if (!ctx) throw new Error("useCall must be used within CallProvider");
    return ctx;
};