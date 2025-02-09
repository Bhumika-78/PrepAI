import React from "react";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store/store.js";
import "./Room.scss";

uuidv4();

const API_URL = import.meta.env.VITE_API_URL;

const socket = io.connect(`${API_URL}`, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

const Room = () => {
  const { user } = useStore();

  const [roomName, setRoomName] = useState("");
  const [joinRoomID, setJoinRoomID] = useState("");

  const ref = useRef();
  const myVideo = useRef();
  const myAudio = useRef();
  const streamRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        ref.current.srcObject = stream;
        stream.getTracks().forEach((track) => (track.enabled = false));
        const videoTrack = streamRef.current.getVideoTracks()[0];
        videoTrack.stop();
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const createRoom = () => {
    const rid = uuidv4();
    socket.emit("create-room", { roomId: rid, roomName });
    navigate(`/createroom/${rid}`);
  };

  const joinRoom = () => {
    if (joinRoomID.trim() === "") {
      alert("Please enter a valid Room ID");
      return;
    }
    socket.emit("join-room", joinRoomID);
    navigate(`/createroom/${joinRoomID}`);
  };

  const handleVoice = () => {
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      myAudio.current.firstChild.src = audioTrack.enabled
        ? "./mic.png"
        : "./no-noise.png";
    }
  };

  const handleVideo = async () => {
    const videoTrack = streamRef.current.getVideoTracks()[0];

    if (videoTrack) {
      if (videoTrack.enabled) {
        videoTrack.enabled = false;
        videoTrack.stop();
        myVideo.current.firstChild.src = "./no-video.png";
      } else {
        await navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            streamRef.current = stream;
            ref.current.srcObject = stream;
          })
          .catch((err) => {
            console.log(err);
          });
        videoTrack.enabled = true;
        myVideo.current.firstChild.src = "./video-camera.png";
      }
    }
  };

  return (
    <div className="room-container">
      <header>
        <img src="logo.png" alt="Logo" />
        <h1>Mock Interview on UI - {user?.name || "Guest"}</h1>
      </header>

      <div className="container">
        {/* Video Section */}
        <div className="video-section">
          <video ref={ref} muted autoPlay playsInline className="video-feed"></video>
          <h2>Interviewee</h2>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button onClick={handleVoice} ref={myAudio} className="btn">
              <img src="./no-noise.png" alt="mic" className="icon" />
              <span>{streamRef.current?.getAudioTracks()[0]?.enabled ? "Mute" : "Unmute"}</span>
            </button>
            <button onClick={handleVideo} ref={myVideo} className="btn">
              <img src="./no-video.png" alt="camera" className="icon" />
              <span>{streamRef.current?.getVideoTracks()[0]?.enabled ? "Stop Video" : "Start Video"}</span>
            </button>
          </div>
        </div>

        {/* Chat Section */}
        <div className="chat-section">
          <div className="chat-tabs">
            <button className="active">Conversation</button>
            <button className="inactive">Interview Details</button>
          </div>

          <div className="chat-window">
            {/* Chat messages will be displayed here */}
          </div>

          <div className="input-section">
            <input type="text" placeholder="Type your answer here..." />
            <button>Send</button>
          </div>
        </div>
      </div>

      {/* Room Creation/Join Section */}
      <div className="room-controls">
        <input
          type="text"
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter Room Name"
          value={roomName}
          className="input-field"
        />
        <button
          onClick={createRoom}
          className="btn-primary"
          disabled={roomName.length < 5}
        >
          Create Room (Min. 5 characters)
        </button>

        <input
          type="text"
          onChange={(e) => setJoinRoomID(e.target.value)}
          placeholder="Enter Room ID"
          value={joinRoomID}
          className="input-field"
        />
        <button onClick={joinRoom} className="btn-secondary">
          Join Room
        </button>

        <Link to="/" className="btn-back">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Room;