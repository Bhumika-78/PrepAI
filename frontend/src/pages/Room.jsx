import React from "react";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useStore } from "../store/store.js";

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
    socket.emit("join-room", joinRoomID); // Emit room join with ID
    navigate(`/createroom/${joinRoomID}`);
  };

  const handleVoice = () => {
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled; // Toggle audio track
      myAudio.current.firstChild.src = audioTrack.enabled
        ? "./mic.png"
        : "./no-noise.png";
    }
  };

  const handleVideo = async () => {
    const videoTrack = streamRef.current.getVideoTracks()[0];

    if (videoTrack) {
        if(videoTrack.enabled){
            videoTrack.enabled = false;
            videoTrack.stop();
            myVideo.current.firstChild.src = './no-video.png'
        }
        else{
           await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
           .then((stream) => {
               streamRef.current = stream;
              ref.current.srcObject = stream;
           }).catch((err)=>{
            console.log(err)
           })
           videoTrack.enabled = true;
           myVideo.current.firstChild.src = './video-camera.png'
        }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center relative gap-6 p-6">
  <video
    ref={ref}
    muted
    autoPlay
    playsInline
    className="w-[500px] h-[600px]"
  ></video>

  <div className="flex gap-4 absolute bottom-36">
    <button
      onClick={handleVoice}
      ref={myAudio}
      className="transition text-white rounded-full p-2 bg-gray-300"
    >
      <img src="./no-noise.png" alt="mic" className="w-5" />
    </button>
    <button
      onClick={handleVideo}
      ref={myVideo}
      className="transition text-white rounded-full p-2 bg-gray-300"
    >
      <img src="./no-video.png" alt="no-video" className="w-5" />
    </button>
  </div>

  <section className="text-gray-600 body-font w-full max-w-xl">
    <div className="container mx-auto px-5 py-12 flex flex-col justify-center items-center">
      <input
        type="text"
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Enter Room Name"
        value={roomName}
        className="border border-black px-6 py-3 text-xl rounded-lg w-full"
      />
      <button
        onClick={createRoom}
        className="w-full mt-4 text-white bg-indigo-500 border-0 py-3 px-6 focus:outline-none hover:bg-indigo-600 rounded-lg text-xl disabled:bg-indigo-200"
        disabled={roomName.length < 5}
      >
        Create Room (Min. 5 characters)
      </button>
      
      <input
        type="text"
        onChange={(e) => setJoinRoomID(e.target.value)}
        placeholder="Enter Room ID"
        value={joinRoomID}
        className="border border-black px-6 py-3 text-xl rounded-lg w-full mt-4"
      />
      <button
        onClick={joinRoom}
        className="w-full mt-4 text-gray-800 bg-gray-300 border-0 py-3 px-6 focus:outline-none hover:bg-gray-200 rounded-lg text-xl"
      >
        Join Room
      </button>
      
      <Link
        to={"/"}
        className="mt-6 w-full text-center bg-orange-400 text-white px-6 py-3 rounded-lg text-xl"
      >
        Back to Home
      </Link>
    </div>
  </section>
</div>
  );
};

export default Room;
