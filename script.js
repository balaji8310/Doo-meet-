const socket = io();
let pc;
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
  localVideo.srcObject = stream;

  socket.on("peer", async peerId => {
    pc = new RTCPeerConnection(config);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = e => {
      if (e.candidate) {
        socket.emit("signal", { to: peerId, signal: { candidate: e.candidate } });
      }
    };

    pc.ontrack = e => {
      remoteVideo.srcObject = e.streams[0];
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("signal", { to: peerId, signal: { sdp: offer } });
  });

  socket.on("signal", async ({ from, signal }) => {
    if (!pc) {
      pc = new RTCPeerConnection(config);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = e => {
        if (e.candidate) {
          socket.emit("signal", { to: from, signal: { candidate: e.candidate } });
        }
      };

      pc.ontrack = e => {
        remoteVideo.srcObject = e.streams[0];
      };
    }

    if (signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      if (signal.sdp.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", { to: from, signal: { sdp: answer } });
      }
    }

    if (signal.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  });
});