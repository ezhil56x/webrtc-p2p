import { useEffect } from "react";

export function Receiver() {
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      const pc = new RTCPeerConnection();

      if (message.type === "create-offer") {
        pc.setRemoteDescription(message.sdp);

        pc.onicecandidate = (event) => {
          console.log(event);
          if (event.candidate) {
            socket.send(
              JSON.stringify({
                type: "ice-candidate",
                candidate: event.candidate,
              })
            );
          }
        };

        pc.ontrack = (event) => {
          console.log("Incoming live video track:", event.track);
          let video = document.getElementById("video") as HTMLVideoElement;
          if (!video) {
            video = document.createElement("video");
            video.id = "video";
            video.autoplay = true;
            video.controls = true;
            video.width = 480;
            video.height = 360;
            document.body.appendChild(video);
          }
          video.srcObject = new MediaStream([event.track]);
        };

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.send(
          JSON.stringify({ type: "create-answer", sdp: pc.localDescription })
        );
      } else if (message.type === "ice-candidate") {
        pc.addIceCandidate(message.candidate);
      }
    };
  }, []);

  return <div>Receiver</div>;
}
