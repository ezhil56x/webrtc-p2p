import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let senderSocket: null | WebSocket = null;
let receiverSocket: null | WebSocket = null;

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", function message(data: any) {
    const message = JSON.parse(data);

    if (message.type === "sender") {
      senderSocket = ws;
      console.log("Sender connected");
    } else if (message.type === "receiver") {
      receiverSocket = ws;
      console.log("Receiver connected");
    } else if (message.type === "create-offer") {
      if (ws !== senderSocket) return;
      receiverSocket?.send(
        JSON.stringify({ type: "create-offer", sdp: message.sdp })
      );
      console.log("Offer sent");
    } else if (message.type === "create-answer") {
      if (ws !== receiverSocket) return;
      senderSocket?.send(
        JSON.stringify({ type: "create-answer", sdp: message.sdp })
      );
      console.log("Answer sent");
    } else if (message.type === "ice-candidate") {
      if (ws === senderSocket) {
        receiverSocket?.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: message.candidate,
          })
        );
      } else if (ws === receiverSocket) {
        senderSocket?.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: message.candidate,
          })
        );
      }
    }
  });
});
