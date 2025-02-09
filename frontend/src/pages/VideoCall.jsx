import React, { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { BsTelephoneX } from "react-icons/bs";
import Chat from "../components/Chat";
import { useStore } from "../store/store.js";
import { loadFaceModels, analyzeFace } from "../utils/faceAnalysis";
import { generateFeedback } from "../utils/feedbackController";

const API_URL = import.meta.env.VITE_API_URL;

const socket = io.connect(`${API_URL}`, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

const VideoCall = () => {
  const { user } = useStore();
  const [role, setRole] = useState(user.role);

  const [peers, setPeers] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [responses, setResponses] = useState([]); // Store user responses
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const videoContainer = useRef();

  const navigate = useNavigate();
  const params = useParams();

  const myVideo = useRef();
  const peersRef = useRef({});
  const streamRef = useRef();
  const myVoice = useRef();
  const videoRef = useRef();
  const hiddenVoice = useRef();

  const videoElement = useRef(null);

  useEffect(() => {
    const initializeFaceDetection = async () => {
      await loadFaceModels(); // Load models before using them
    };

    initializeFaceDetection();
  }, []);

  const handleCallEnd = async () => {
    try {
      // Step 1: Analyze face engagement
      const faceEngagement = await analyzeFace(videoElement.current);

      // Step 2: Redirect to feedback page with data
      navigate("/feedback", {
        state: {
          faceEngagement,
        },
      });
    } catch (error) {
      console.error("Error generating feedback:", error);
      navigate("/feedback", {
        state: {
          error: "Failed to generate feedback.",
        },
      });
    }
  };

  useEffect(() => {
    const initializeFaceDetection = async () => {
      await loadFaceModels();
      // Now you can use analyzeFace
    };

    initializeFaceDetection();
  }, []);

  const createPeer = useCallback((userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      if (signal.type === "offer") {
        socket.emit("sending-signal", { userToSignal, callerID, signal });
      }
    });

    peer.on("error", (err) => {
      console.log("Peer error: ", err);
      if (err.toString().includes("Connection failed")) {
        removePeer(userToSignal);
      }
    });

    peer.on("connect", () => {
      console.log("Peer connected:", userToSignal);
    });

    return peer;
  }, []);

  const addPeer = useCallback((incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      if (signal.type === "answer") {
        socket.emit("returning-signal", { signal, callerID });
      }
    });

    peer.on("error", (err) => {
      console.log("Peer error: ", err);
      if (err.toString().includes("Connection failed")) {
        removePeer(callerID);
      }
    });

    peer.on("connect", () => {
      console.log("Peer connected:", callerID);
    });

    try {
      peer.signal(incomingSignal);
    } catch (err) {
      console.error("Error signaling peer:", err);
    }

    return peer;
  }, []);

  const removePeer = useCallback((peerId) => {
    console.log("Removing peer:", peerId);
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].destroy();
      delete peersRef.current[peerId];
    }
    setPeers((prevPeers) => prevPeers.filter((p) => p.peerID !== peerId));
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;

        stream.getTracks().forEach((track) => (track.enabled = false));

        myVideo.current.srcObject = stream;

        socket.emit("join-room", params.id);

        socket.on("your-id", (id) => {
          setMyUserId(id);
          console.log("My user ID:", id);
        });

        socket.on("all-users", (users) => {
          setUserCount(users.length + 1);
          users.forEach((userID) => {
            if (!peersRef.current[userID]) {
              const peer = createPeer(userID, socket.id, stream);
              peersRef.current[userID] = peer;
              setPeers((prevPeers) => [...prevPeers, { peerID: userID, peer }]);
            }
          });
        });

        socket.on("user-joined", (payload) => {
          setUserCount((prevCount) => prevCount + 1);

          if (!peersRef.current[payload.callerID]) {
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peersRef.current[payload.callerID] = peer;
            setPeers((prevPeers) => [
              ...prevPeers,
              { peerID: payload.callerID, peer },
            ]);
          }
        });

        socket.on("receiving-returned-signal", (payload) => {
          const peer = peersRef.current[payload.id];
          if (peer && !peer.destroyed) {
            try {
              peer.signal(payload.signal);
            } catch (err) {
              console.log("Error signaling peer:", err);
              removePeer(payload.id);
            }
          }
        });

        socket.on("user-disconnected", (userId) => {
          setUserCount((prevCount) => prevCount - 1);
          removePeer(userId);
        });
      });

    return () => {
      socket.emit("disconnect-from-room", params.id);
      socket.off("your-id");
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
      socket.off("user-disconnected");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};
      setPeers([]);
    };
  }, [params.id, addPeer, removePeer, createPeer]);

  const handleDisconnect = async () => {
    try {
      // Step 1: Analyze face engagement
      const faceEngagement = await analyzeFace(myVideo.current);

      // Step 2: Generate feedback
      const feedback = await generateFeedback(myVideo.current, responses);

      // Step 3: Redirect to feedback page with data
      navigate("/feedback", {
        state: {
          faceEngagement,
          responses,
          feedback,
        },
      });
    } catch (error) {
      console.error("Error generating feedback:", error);
      navigate("/feedback", {
        state: {
          error: "Failed to generate feedback.",
        },
      });
    }
  };

  const handleVoice = () => {
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      myVoice.current.firstChild.src = audioTrack.enabled
        ? "./mic.png"
        : "./no-noise.png";
    }

    if (audioTrack.enabled == false) {
      hiddenVoice.current.style.display = "block";
    } else {
      hiddenVoice.current.style.display = "none";
    }
  };

  const handleVideo = () => {
    const videoTrack = streamRef.current.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      videoRef.current.firstChild.src = videoTrack.enabled
        ? "./video-camera.png"
        : "./no-video.png";
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      screenVideoRef.current.srcObject = screenStream;
      screenStreamRef.current = screenStream;
      setIsSharing(true);

      videoContainer.current.classList.remove("hidden");

      screenStream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      videoContainer.current.classList.add("hidden");
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      setIsSharing(false);
    }
  };

  const toggleChatModal = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="video-call-container bg-gray-900 text-white min-h-screen p-8 flex">
      {/* Left Side: Video Section */}
      <div className="video-section w-1/2 pr-4">
        {/* Top Video (Your Video) */}
        <div className="relative mb-4">
          <img
            ref={hiddenVoice}
            className="absolute right-2 top-2 bg-gray-500 bg-opacity-60 text-white px-2 py-1 rounded w-12"
            src="./no-noise.png"
            alt="Muted"
          />
          <video
            autoPlay
            playsInline
            muted
            ref={myVideo}
            className="w-full h-auto rounded-lg"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            You ({role})
          </div>
        </div>

        {/* Bottom Video (Peer Video) */}
        {peers.map((peer, index) => (
          <div key={index} className="relative">
            <Video peer={peer.peer} />
          </div>
        ))}
      </div>

      {/* Right Side: Chat Section */}
      <div className="chat-section w-1/2 pl-4">
        <Chat />
      </div>

      {/* Control Buttons */}
      <div className="control-buttons fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 w-5">
        <button
          ref={myVoice}
          onClick={handleVoice}
          className="bg-[#F1720A] hover:bg-[#e65c00] text-white rounded-full p-3 transition duration-300"
        >
          <img src="./no-noise.png" alt="mic" className="w-7" />
        </button>
        <button
          ref={videoRef}
          onClick={handleVideo}
          className="bg-[#F1720A] hover:bg-[#e65c00] text-white rounded-full p-3 transition duration-300"
        >
          <img src="./no-video.png" alt="video" className="w-7" />
        </button>

        {!isSharing ? (
          <button
            onClick={startScreenShare}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition duration-300"
          >
            Start Screen Share
          </button>
        ) : (
          <button
            onClick={stopScreenShare}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition duration-300"
          >
            Stop Screen Share
          </button>
        )}
{/* <video ref={videoElement} autoPlay playsInline muted /> */}
      <button
        onClick={handleDisconnect}
        className="bg-[#dc263e] hover:bg-red-500 text-white rounded-full p-3 flex justify-center items-center transition duration-300"
      >
        <BsTelephoneX className="text-2xl" />
      </button>
      </div>
    </div>
  );
};

const Video = ({ peer }) => {
  const ref = useRef();
  const hiddenPeerVoice = useRef();

  useEffect(() => {
    if (peer) {
      peer.on("stream", (stream) => {
        if (ref.current) {
          ref.current.srcObject = stream;
        }
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack.enabled == false) {
          hiddenPeerVoice.current.style.display = "block";
        } else {
          hiddenPeerVoice.current.style.display = "none";
        }
      });
    }
  }, [peer]);

  return (
    <div className="relative">
      <video
        autoPlay
        playsInline
        ref={ref}
        className="w-full h-auto rounded-lg"
      />
      <img
        ref={hiddenPeerVoice}
        className="absolute top-2 left-2 bg-gray-500 bg-opacity-60 text-white px-2 py-1 rounded w-12"
        src="./no-noise.png"
        alt="Muted"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
        Peer
      </div>
    </div>
  );
};

export default VideoCall;