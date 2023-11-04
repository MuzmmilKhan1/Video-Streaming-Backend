const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
// const MongoClient = require('mongodb').MongoClient;
const webrtc = require('wrtc')
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
const server = http.Server(app);
const bcrypt = require('bcryptjs')
const io = socketIO(server, {
    cors: {
        origin: "https://safetixstreaming.com/",
        methods: ["GET", "POST"]
    }
});

// const mongoURI = "mongodb+srv://mzubairkhanofficial:f1OrndUbAZjTEnGx@streamingcluster.ycaox7x.mongodb.net/";

// const client = new MongoClient(mongoURI);
// client.connect();
// console.log("Connected to MongoDB");

// const db = client.db("db");
// const collection = db.collection('test');

let senderStream;

app.use(cors({
    origin: "https://safetixstreaming.com/",
    methods: ["GET", "POST"]
}))
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let roomParam;
let rooms = [];

io.on('connect', (socket) => {
    socket.on("room creation", (data) => {
        const roomId = uuidv4();
        roomParam = roomId;
        rooms.push({ roomId, senderStream, name: data });
        console.log(rooms)
        socket.emit("roomId", roomParam)
    })
    socket.emit("roomId", roomParam)
    socket.emit("room-available", rooms)
    socket.on("stop room", (data) => {

        console.log("Stop with id", data)
        try {

            const newArray = rooms.filter((obj) => obj.roomId !== data);

            rooms = newArray;

            console.log(rooms);
        } catch (err) {
            console.log(err)
        }
    })
})

// async function enter() {
//     let data = {
//         email: "muzmmil.khan16@gmail.com",
//         password: await bcrypt.hash("12345678", 10)
//     }
//     await collection.insertOne(data);
// }

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find the user by username in the database
    // const user = await collection.findOne({ email });
    // console.log(user)
    // Check if the user exists
    // if (!user) {
        // return res.status(404).json({ message: 'User not found' });
    // }

    // Check if the submitted password matches the stored hashed password
    // if (user && (await bcrypt.compare(password, user.password))) {
        // Passwords match; user is authenticated
        // console.log("Password Matched")
        // const token = jwt.sign({ userId: user._id, email: user.email }, 'streamNow', {
            // expiresIn: '1h', // Token expiration time (e.g., 1 hour)
        // });
        // return res.status(200).json({ token });
    // } else {
        // Passwords do not match; authentication failed
        // return res.status(401).json({ message: 'Wrong Password' });
    // }
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.get('/streaming', (req, res) => {
    res.json({ "Streaming": "Yess" })
})

app.post(`/consumer/`, async ({ body, params }, res) => {
    try {
        let id = params.id
        console.log("Id", params.id)
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                  {
                    urls: ["stun:bn-turn1.xirsys.com"]
                  },
                  {
                    username: "S84a7744_c0ftSQfy1p_90TW-bKSAMQVXr1j6jptUBOs1dYia9_l52R8TNh1HBi_AAAAAGU8xXtNdXphbWlsK2hhbjE=",
                    credential: "8ef24e28-756b-11ee-995a-0242ac140004",
                    urls: [
                      "turn:bn-turn1.xirsys.com:80?transport=udp",
                      "turn:bn-turn1.xirsys.com:3478?transport=udp",
                      "turn:bn-turn1.xirsys.com:80?transport=tcp",
                      "turn:bn-turn1.xirsys.com:3478?transport=tcp",
                      "turns:bn-turn1.xirsys.com:443?transport=tcp",
                      "turns:bn-turn1.xirsys.com:5349?transport=tcp"
                    ]
                  }
                // {
                //   urls: "turn:turn.safetixstreaming.com",
                //   username: "chris",
                //   credential: "Capricorn190RCapricorn13F"
                // },
                // {
                //     urls: "stun:stun.relay.metered.ca:80",
                //   },
                //   {
                //     urls: "turn:a.relay.metered.ca:80",
                //     username: "807973d909920f718ba0b567",
                //     credential: "VGyNVhO+WtsGoTih",
                //   },
                //   {
                //     urls: "turn:a.relay.metered.ca:80?transport=tcp",
                //     username: "807973d909920f718ba0b567",
                //     credential: "VGyNVhO+WtsGoTih",
                //   },
                //   {
                //     urls: "turn:a.relay.metered.ca:443",
                //     username: "807973d909920f718ba0b567",
                //     credential: "VGyNVhO+WtsGoTih",
                //   },
                //   {
                //     urls: "turn:a.relay.metered.ca:443?transport=tcp",
                //     username: "807973d909920f718ba0b567",
                //     credential: "VGyNVhO+WtsGoTih",
                //   },
            ]
        });
        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await peer.setRemoteDescription(desc);
        // const matchingRoom = rooms.find((room) => room.roomId === id);
        // if (matchingRoom) {
            // console.log(matchingRoom)
            // let stream = matchingRoom.senderStream;
            // console.log("Selected Stream:", senderStream);
            // stream.getTracks().forEach(track => peer.addTrack(track, stream));
        // } else {
            // console.log("No matching room found.");
        // }
        let stream = senderStream;
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }

        res.json(payload);
    } catch (err) {
        console.log(err)
    }
});

app.post(`/broadcast/`, async ({ body }, res) => {
    try {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                  {
                    urls: ["stun:bn-turn1.xirsys.com"]
                  },
                  {
                    username: "S84a7744_c0ftSQfy1p_90TW-bKSAMQVXr1j6jptUBOs1dYia9_l52R8TNh1HBi_AAAAAGU8xXtNdXphbWlsK2hhbjE=",
                    credential: "8ef24e28-756b-11ee-995a-0242ac140004",
                    urls: [
                      "turn:bn-turn1.xirsys.com:80?transport=udp",
                      "turn:bn-turn1.xirsys.com:3478?transport=udp",
                      "turn:bn-turn1.xirsys.com:80?transport=tcp",
                      "turn:bn-turn1.xirsys.com:3478?transport=tcp",
                      "turns:bn-turn1.xirsys.com:443?transport=tcp",
                      "turns:bn-turn1.xirsys.com:5349?transport=tcp"
                    ]
                  }
                // {
                //   urls: "turn:turn.safetixstreaming.com",
                //   username: "chris",
                //   credential: "Capricorn190RCapricorn13F"
                // }
                // {
                //     urls: "stun:stun.stunprotocol.org"
                // },
                // {
                //     urls: "turn:a.relay.metered.ca:80",
                //     username: "807973d909920f718ba0b567",
                //     credential: "VGyNVhO+WtsGoTih",
                //   },
                //   {
                //     urls: "turn:a.relay.metered.ca:80?transport=tcp",
                //     username: "807973d909920f718ba0b567",
                //     credential: "VGyNVhO+WtsGoTih",
                //   },
                //   {
                //     urls: "turn:a.relay.metered.ca:443",
                //     username: "807973d909920f718ba0b567",
                //     credential: "VGyNVhO+WtsGoTih",
                //   },
                //   {
                //     urls: "turn:a.relay.metered.ca:443?transport=tcp",
                //     username: "807973d909920f718ba0b567",
                //     credential: "VGyNVhO+WtsGoTih",
                //   },
            ]
        });
        peer.ontrack = (e) => handleTrackEvent(e, peer);
        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }

        res.json(payload);
    } catch (err) {
        console.log(err)
    }
});

function handleTrackEvent(e, peer) {
    senderStream = e.streams[0];
};


server.listen(8000, () => console.log("Started"));
