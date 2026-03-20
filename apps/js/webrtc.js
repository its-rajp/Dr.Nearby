
const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

if (window.TURN_SERVER_URL) {
    const turnConfig = {
        urls: window.TURN_SERVER_URL
    };
    if (window.TURN_USERNAME) {
        turnConfig.username = window.TURN_USERNAME;
    }
    if (window.TURN_CREDENTIAL) {
        turnConfig.credential = window.TURN_CREDENTIAL;
    }
    iceServers.push(turnConfig);
}

const rtcConfig = {
    iceServers
};

let localStream;
let peerConnection;
let socket;
let currentRoomId;

function initSignaling(roomId, onRemoteStream) {
    currentRoomId = roomId;
    // Add skip browser warning for ngrok free tier
    socket = io(window.SIGNALING_SERVER_URL || 'http://localhost:5506', {
        extraHeaders: {
            "ngrok-skip-browser-warning": "true"
        }
    });

    socket.on('connect', () => {
        console.log('[WebRTC] Connected to signaling server');
        socket.emit('join-room', roomId);
    });

    socket.on('user-connected', async (userId) => {
        console.log('[WebRTC] Remote user connected:', userId);
        await startCall(userId);
    });

    socket.on('receive-offer', async ({ sender, offer }) => {
        console.log('[WebRTC] Received offer from:', sender);
        await handleOffer(sender, offer, onRemoteStream);
    });

    socket.on('receive-answer', async ({ answer }) => {
        console.log('[WebRTC] Received answer');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('receive-ice-candidate', async ({ candidate }) => {
        console.log('[WebRTC] Received ICE candidate');
        if (candidate && peerConnection) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('[WebRTC] Error adding received ICE candidate', e);
            }
        }
    });

    socket.on('user-disconnected', (userId) => {
        console.log('[WebRTC] User disconnected:', userId);
        if (onRemoteStream) onRemoteStream(null);
    });
}

async function getLocalMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user"
            }, 
            audio: true 
        });
        return localStream;
    } catch (e) {
        console.error('[WebRTC] Error accessing media devices.', e);
        throw e;
    }
}

function createPeerConnection(targetId, onRemoteStream) {
    if (peerConnection) {
        peerConnection.close();
    }

    peerConnection = new RTCPeerConnection(rtcConfig);

    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('send-ice-candidate', { 
                target: targetId, 
                candidate: event.candidate 
            });
        }
    };

    peerConnection.ontrack = (event) => {
        console.log('[WebRTC] Received remote track');
        if (onRemoteStream) {
            onRemoteStream(event.streams[0]);
        }
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE Connection State:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'disconnected') {
            if (onRemoteStream) onRemoteStream(null);
        }
    };

    return peerConnection;
}

async function startCall(targetId) {
    console.log('[WebRTC] Starting call to:', targetId);
    peerConnection = createPeerConnection(targetId, window.onRemoteStreamHandler);
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    socket.emit('send-offer', { target: targetId, offer });
}

async function handleOffer(senderId, offer, onRemoteStream) {
    console.log('[WebRTC] Handling offer from:', senderId);
    peerConnection = createPeerConnection(senderId, onRemoteStream);
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.emit('send-answer', { target: senderId, answer });
}

function toggleMic(enabled) {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = enabled;
        });
    }
}

function toggleCamera(enabled) {
    if (localStream) {
        localStream.getVideoTracks().forEach(track => {
            track.enabled = enabled;
        });
    }
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (socket) {
        socket.disconnect();
    }
}

window.initSignaling = initSignaling;
window.getLocalMedia = getLocalMedia;
window.endCall = endCall;
window.toggleMic = toggleMic;
window.toggleCamera = toggleCamera;
