export type CallSignalType = "OFFER" | "ANSWER" | "ICE_CANDIDATE" | "END" | "REJECT" | "BUSY";
export type CallKind = "AUDIO" | "VIDEO";

export interface CallSignal {
    type: CallSignalType;
    from?: string;
    to: string;
    sdp?: string;
    candidate?: string;
    callId: string;
    callType?: CallKind;
}

export type CallStatus = "idle" | "calling" | "ringing" | "connected";