import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  Send,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Copy,
  Circle
} from 'lucide-react';

interface ChatMessage {
  senderName: string;
  text: string;
  timestamp: string;
}

export const VideoRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Joined State
  const [hasJoined, setHasJoined] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState<string>(() => {
    const savedMeetings = JSON.parse(localStorage.getItem('user_created_meetings') || '[]');
    const match = savedMeetings.find((m: any) => m.id === roomId);
    return match?.title || 'Weekly Sync';
  });

  // Real-time Meeting Timer (seconds count up)
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // WebRTC & Media States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Devices & Permission states
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [mediaError, setMediaError] = useState(false);

  // Active Right Drawer Tab in room (chat vs people)
  const [activeTab, setActiveTab] = useState<'chat' | 'people'>('chat');

  // Real-time Chat
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`room_chat_${roomId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [messageText, setMessageText] = useState('');

  // Real-time Transcript
  const [transcript, setTranscript] = useState<{ speakerName: string; text: string; timestamp: string }[]>(() => {
    const saved = localStorage.getItem(`room_transcript_${roomId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<any>(null);

  const displayName = user?.name || 'Rakesh Tank';
  const userInitials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'RT';

  // Timer Effect once joined
  useEffect(() => {
    let timer: any;
    if (hasJoined) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasJoined]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initMedia = async () => {
    if (localStreamRef.current) return;
    setMediaError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === 'videoinput');
      const mics = devices.filter((d) => d.kind === 'audioinput');
      setCameraDevices(cams);
      setMicDevices(mics);
      if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
      if (mics.length > 0) setSelectedMic(mics[0].deviceId);
    } catch (err) {
      console.error('Media access blocked or failed:', err);
      setMediaError(true);
    }
  };

  // Web Speech API for Real-time Speech-to-Text Transcript
  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.trim();
        if (transcriptText) {
          const newSegment = {
            speakerName: displayName,
            text: transcriptText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setTranscript((prev) => {
            const updated = [...prev, newSegment];
            localStorage.setItem(`room_transcript_${roomId}`, JSON.stringify(updated));
            return updated;
          });
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
      };

      try {
        rec.start();
        recognitionRef.current = rec;
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    }
  };

  // Participant & WebRTC Peer Connections State
  const [participants, setParticipants] = useState<{ socketId: string; name: string }[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<{ [socketId: string]: MediaStream }>({});
  const peersRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const pendingCandidatesRef = useRef<{ [socketId: string]: RTCIceCandidateInit[] }>({});

  const processCandidateQueue = async (socketId: string, peer: RTCPeerConnection) => {
    const queue = pendingCandidatesRef.current[socketId];
    if (queue && queue.length > 0) {
      for (const cand of queue) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('[WebRTC] Error adding queued ICE candidate:', e);
        }
      }
      delete pendingCandidatesRef.current[socketId];
    }
  };

  // Helper to create WebRTC Peer Connection
  const createPeer = (targetSocketId: string, socket: Socket, stream: MediaStream | null) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    });

    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    } else {
      peer.addTransceiver('video', { direction: 'recvonly' });
      peer.addTransceiver('audio', { direction: 'recvonly' });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          meetingId: roomId,
          candidate: event.candidate,
          toSocketId: targetSocketId,
        });
      }
    };

    peer.ontrack = (event) => {
      console.log(`[WebRTC] Received remote stream track from ${targetSocketId}:`, event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetSocketId]: event.streams[0],
        }));
      } else {
        setRemoteStreams((prev) => {
          const current = prev[targetSocketId] || new MediaStream();
          current.addTrack(event.track);
          return {
            ...prev,
            [targetSocketId]: current,
          };
        });
      }
    };

    return peer;
  };

  useEffect(() => {
    initMedia();

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.PROD
        ? 'https://intellmeet-zidio-ff1v.onrender.com'
        : 'http://localhost:5000');
    const socket = io(socketUrl, { withCredentials: true });
    socketRef.current = socket;

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.text === msg.text && m.senderName === msg.senderName && m.timestamp === msg.timestamp);
        if (exists) return prev;
        const updated = [...prev, msg];
        localStorage.setItem(`room_chat_${roomId}`, JSON.stringify(updated));
        return updated;
      });
    });

    // Receive all existing participants who are already inside the room
    socket.on('room-users', (existingUsers: { socketId: string; name: string }[]) => {
      setParticipants((prev) => {
        const map = new Map<string, { socketId: string; name: string }>();
        prev.forEach((p) => map.set(p.socketId, p));
        existingUsers.forEach((u) => {
          if (u.socketId !== socket.id) map.set(u.socketId, u);
        });
        return Array.from(map.values());
      });
    });

    // Real-time participant join signal handling (WebRTC Mesh)
    socket.on('user-joined', async ({ userId, socketId, name }: { userId: string; socketId: string; name?: string }) => {
      const participantName = name || 'Participant';
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === socketId)) return prev;
        return [...prev, { socketId, name: participantName }];
      });

      let currentStream = localStreamRef.current;
      if (!currentStream) {
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = currentStream;
          setLocalStream(currentStream);
        } catch (e) {
          console.warn('[WebRTC] User-joined media fallback:', e);
        }
      }

      const peer = createPeer(socketId, socket, currentStream);
      peersRef.current[socketId] = peer;

      try {
        const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await peer.setLocalDescription(offer);

        socket.emit('offer', {
          meetingId: roomId,
          offer,
          toSocketId: socketId,
          fromName: displayName,
        });
      } catch (err) {
        console.error('[WebRTC] Error creating offer:', err);
      }
    });

    socket.on('offer', async ({ offer, fromSocketId, fromName }: { offer: any; fromSocketId: string; fromName?: string }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === fromSocketId)) return prev;
        return [...prev, { socketId: fromSocketId, name: fromName || 'Participant' }];
      });

      let currentStream = localStreamRef.current;
      if (!currentStream) {
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = currentStream;
          setLocalStream(currentStream);
        } catch (e) {
          console.warn('[WebRTC] Offer media fallback:', e);
        }
      }

      const peer = createPeer(fromSocketId, socket, currentStream);
      peersRef.current[fromSocketId] = peer;

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        await processCandidateQueue(fromSocketId, peer);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit('answer', {
          meetingId: roomId,
          answer,
          toSocketId: fromSocketId,
        });
      } catch (err) {
        console.error('[WebRTC] Error processing offer:', err);
      }
    });

    socket.on('answer', async ({ answer, fromSocketId }: { answer: any; fromSocketId: string }) => {
      const peer = peersRef.current[fromSocketId];
      if (peer) {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
          await processCandidateQueue(fromSocketId, peer);
        } catch (err) {
          console.error('[WebRTC] Error setting remote description for answer:', err);
        }
      }
    });

    socket.on('ice-candidate', async ({ candidate, fromSocketId }: { candidate: any; fromSocketId: string }) => {
      if (!candidate) return;
      const peer = peersRef.current[fromSocketId];
      if (peer && peer.remoteDescription && peer.remoteDescription.type) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] Error adding ICE candidate:', err);
        }
      } else {
        if (!pendingCandidatesRef.current[fromSocketId]) {
          pendingCandidatesRef.current[fromSocketId] = [];
        }
        pendingCandidatesRef.current[fromSocketId].push(candidate);
      }
    });

    socket.on('user-left', ({ socketId }: { socketId: string }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach((peer) => peer.close());
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [roomId]);

  const handleJoinMeeting = () => {
    setHasJoined(true);
    socketRef.current?.emit('join-room', { meetingId: roomId, userId: user?.id || 'guest', name: displayName });
    initSpeechRecognition();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Real-time Record toggle
  const toggleRecording = () => {
    if (!isRecording) {
      if (localStream) {
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(localStream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          localStorage.setItem(`room_has_recording_${roomId}`, 'true');
          const url = URL.createObjectURL(blob);
          console.log('Recording stopped. Video URL:', url);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopyInvite = () => {
    const inviteUrl = window.location.href;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => {
      setCopiedInvite(false);
    }, 2500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const chatData: ChatMessage = {
      senderName: displayName,
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socketRef.current?.emit('send-message', { meetingId: roomId, ...chatData });

    setMessages((prev) => {
      const updated = [...prev, chatData];
      localStorage.setItem(`room_chat_${roomId}`, JSON.stringify(updated));
      return updated;
    });

    setMessageText('');
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex font-sans antialiased overflow-hidden transition-colors relative">
      {/* Sidebar Navigation */}
      <Sidebar activePage="Meetings" />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16]">
        <Header />

        {/* 1. PRE-JOIN ROOM SETUP SCREEN */}
        {!hasJoined ? (
          <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-5xl w-full mx-auto space-y-8">
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{meetingTitle}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hosted by <span className="font-semibold text-slate-700 dark:text-slate-300">{displayName}</span> • room <span className="font-mono">{roomId}</span>
              </p>
            </div>

            <div className="grid md:grid-cols-12 gap-8 w-full max-w-4xl items-start">
              {/* Left Video Preview Container */}
              <div className="md:col-span-7 bg-slate-900 dark:bg-[#0F172A] border border-slate-800 rounded-3xl aspect-video relative overflow-hidden flex items-center justify-center shadow-xl">
                {localStream && !isVideoOff && !mediaError ? (
                  <video
                    ref={(el) => {
                      localVideoRef.current = el;
                      if (el && localStream && el.srcObject !== localStream) {
                        el.srcObject = localStream;
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-20 h-20 bg-indigo-600/30 border border-indigo-500/50 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-300">
                      {userInitials}
                    </div>
                  </div>
                )}

                {/* Floating Preview Media Controls Overlay */}
                <div className="absolute bottom-4 flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800">
                  <button
                    onClick={toggleMute}
                    className={`p-2.5 rounded-xl transition ${isMuted ? 'bg-red-500/20 text-red-400' : 'text-white hover:bg-slate-800'}`}
                  >
                    {isMuted ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-2.5 rounded-xl transition ${isVideoOff ? 'bg-red-500/20 text-red-400' : 'text-white hover:bg-slate-800'}`}
                  >
                    {isVideoOff ? <VideoOff className="w-4.5 h-4.5" /> : <VideoIcon className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Right Media Settings Panel */}
              <div className="md:col-span-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Camera</label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {cameraDevices.length > 0 ? (
                      cameraDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || 'HP TrueVision HD'}</option>
                      ))
                    ) : (
                      <option value="">No camera found</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Microphone</label>
                  <select
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {micDevices.length > 0 ? (
                      micDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone (Realtek High Definition Audio)'}</option>
                      ))
                    ) : (
                      <option value="">No microphone found</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Joining as</label>
                  <input
                    type="text"
                    disabled
                    value={displayName}
                    className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                {mediaError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start space-x-2 text-xs text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Camera and microphone access was blocked. Allow it from the padlock in the address bar, then try again.
                      </p>
                    </div>
                    <button
                      onClick={initMedia}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-2 border border-slate-700 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try again</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={handleJoinMeeting}
                  className="w-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs transition shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Join meeting
                </button>
              </div>
            </div>
          </main>
        ) : (
          /* 2. IN-CALL LIVE ROOM SCREEN WITH REAL-TIME TIMER & DATA */
          <main className="flex-1 flex flex-col p-6 max-w-6xl w-full mx-auto space-y-4">
            {/* Top Room Header Bar */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{meetingTitle}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-1.5">
                  <span className="font-mono text-indigo-400 font-bold">{formatTimer(secondsElapsed)}</span>
                  <span>•</span>
                  <span>{participants.length + 1} in the room</span>
                </p>
              </div>

              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </div>

            {/* Room Main View */}
            <div className="flex-1 grid md:grid-cols-12 gap-6 items-start">
              {/* Main Video Grid Screen (Responsive Dynamic Layout with Auto-Scroll for Large Groups) */}
              <div className="md:col-span-8 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                <div
                  className={`grid gap-3 transition-all ${participants.length === 0
                      ? 'grid-cols-1 aspect-video'
                      : participants.length === 1
                        ? 'grid-cols-1 sm:grid-cols-2 aspect-video'
                        : participants.length <= 3
                          ? 'grid-cols-2'
                          : participants.length <= 8
                            ? 'grid-cols-2 lg:grid-cols-3'
                            : 'grid-cols-3 lg:grid-cols-4'
                    }`}
                >
                  {/* Local Video Stream Tile */}
                  <div className="bg-slate-900 dark:bg-[#0F172A] border border-slate-800 rounded-3xl relative overflow-hidden flex items-center justify-center shadow-xl min-h-[180px] sm:min-h-[220px]">
                    {localStream && !isVideoOff ? (
                      <video
                        ref={(el) => {
                          localVideoRef.current = el;
                          if (el && localStream && el.srcObject !== localStream) {
                            el.srcObject = localStream;
                          }
                        }}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-14 h-14 bg-indigo-600/30 border border-indigo-500/50 rounded-full flex items-center justify-center text-lg font-bold text-indigo-300">
                          {userInitials}
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs text-white font-medium z-10">
                      {displayName} (you) • host
                    </div>
                  </div>

                  {/* Remote Participant Video Tiles */}
                  {participants.map((p) => (
                    <div key={p.socketId} className="bg-slate-900 dark:bg-[#0F172A] border border-slate-800 rounded-3xl relative overflow-hidden flex items-center justify-center shadow-xl min-h-[180px] sm:min-h-[220px]">
                      {remoteStreams[p.socketId] ? (
                        <video
                          ref={(el) => {
                            if (el && remoteStreams[p.socketId] && el.srcObject !== remoteStreams[p.socketId]) {
                              el.srcObject = remoteStreams[p.socketId];
                              el.play().catch(() => {});
                            }
                          }}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-14 h-14 bg-indigo-600/30 border border-indigo-500/50 rounded-full flex items-center justify-center text-lg font-bold text-indigo-300">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs text-white font-medium z-10">
                        {p.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Chat & People Drawer */}
              <div className="md:col-span-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col h-[400px] justify-between shadow-2xs">
                {/* Drawer Tab Switcher */}
                <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl grid grid-cols-2 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`py-1.5 rounded-lg transition ${activeTab === 'chat' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('people')}
                    className={`py-1.5 rounded-lg transition ${activeTab === 'people' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    People ({participants.length + 1})
                  </button>
                </div>

                {/* Drawer Messages / List */}
                <div className="flex-1 py-4 overflow-y-auto space-y-3">
                  {activeTab === 'chat' ? (
                    messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed px-4">
                        No messages yet. Say hello, or type @ to mention a team-mate.
                      </div>
                    ) : (
                      messages.map((m, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{m.senderName}</span>
                          <p className="text-slate-700 dark:text-slate-200 mt-0.5">{m.text}</p>
                        </div>
                      ))
                    )
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{displayName} (you)</span>
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">Host</span>
                      </div>
                      {participants.map((p) => (
                        <div key={p.socketId} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">Participant</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Chat Input Form */}
                {activeTab === 'chat' && (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Message the room"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 transition shadow-2xs"
                    />
                    <button type="submit" className="bg-[#4F46E5] hover:bg-indigo-700 text-white p-2.5 rounded-xl transition shadow-2xs">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className={`p-2.5 rounded-xl border transition ${isMuted ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-600' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-2.5 rounded-xl border transition ${isVideoOff ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-600' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
                >
                  <Monitor className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleRecording}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition ${isRecording ? 'bg-red-500 text-white border-red-600' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
                  <span>{isRecording ? 'Recording...' : 'Record'}</span>
                </button>

                <button className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition">
                  Mute all
                </button>

                <button className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition">
                  End for all
                </button>
              </div>

              <button
                onClick={() => navigate(`/summary/${roomId}`)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                Leave
              </button>
            </div>
          </main>
        )}
      </div>

      {/* INVITE PEOPLE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-bold text-white">Invite people</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Only members of <strong className="text-slate-200">IntellMeet Demo Team</strong> can join, and everyone who uses <strong className="text-slate-200">Try Live Demo</strong> is one. Send this link and ask them to choose <strong className="text-slate-200">Try Live Demo</strong>. Somebody signed in with their own account is not in this team and will be turned away.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-300">Meeting link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-indigo-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap outline-none"
                />
                <button
                  onClick={handleCopyInvite}
                  className="bg-[#6366F1] hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shrink-0 cursor-pointer shadow-md shadow-indigo-500/30"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedInvite ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              Or they can type the room code <strong className="text-white font-mono">{roomId}</strong> into Join with a code on their dashboard.
            </p>

            <p className="text-[11px] text-slate-500 font-medium">
              The code only works until the meeting ends.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};