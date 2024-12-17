import { useEffect, useRef, useState } from "react";

export function Sender() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "sender" }));
    };
    setSocket(socket);
  }, []);

  async function startSendingVideo() {
    if (!socket) return;
    const pc = new RTCPeerConnection();

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.send(
        JSON.stringify({ type: "create-offer", sdp: pc.localDescription })
      );
    };

    pc.onicecandidate = (event) => {
      console.log(event);
      if (event.candidate) {
        socket.send(
          JSON.stringify({ type: "ice-candidate", candidate: event.candidate })
        );
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "create-answer") {
        pc.setRemoteDescription(data.sdp);
      } else if (data.type === "ice-candidate") {
        pc.addIceCandidate(data.candidate);
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    pc.addTrack(stream.getVideoTracks()[0]);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }

  return (
    <div>
      Sender
      <button onClick={startSendingVideo}>Start video</button>
      <video ref={videoRef} autoPlay width={480} height={360}></video>
    </div>
  );
}
