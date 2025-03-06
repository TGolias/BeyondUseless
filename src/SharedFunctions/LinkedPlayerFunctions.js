import { answerPeerRequestMessage, newConnectionMessage, peerRequestMessage } from "./LinkedPlayerMessageFunctions";
import { acceptConnectionOfferAndGiveAnswer, AddCurrentOfferWhenDataChannelOpened, completeConnectionOfferWithAnswer, createConnectionOffer, createDataChannel, createPeerConnection, getDataChannelFromConnection } from "./PeerConnectionSetupFunctions";

let mySessionId = undefined;
let myPlayerConfigs = undefined;
const allActiveConnections = {};
let onConnectionChangedHandler = undefined;

const openRequests = {};

export function SetMySessionId(sessionId) {
    mySessionId = sessionId;
}

export function SetMyPlayerConfigs(playerConfigs) {
    myPlayerConfigs = playerConfigs;
}

export function AddLinkedPlayer(sessionId, remotePlayerConfigs, peerConnection, channel) {
    if (openRequests[sessionId]) {
        // This is no longer an open request: we've sealed the deal!
        delete openRequests[sessionId];
    }

    if (allActiveConnections[sessionId]) {
        // We already have a connection. No need to add.
        peerConnection.close();
    } else {
        allActiveConnections[sessionId] = { peerConnection, channel, remotePlayerConfigs };
        const messageListener = channel.addEventListener('message', (event) => {
            const peerMessage = JSON.parse(event.data);
            switch (peerMessage.type) {
                case "update":
                    AddOrUpdateRemoteCharacter(sessionId, peerMessage.playerConfigs);
                    break;
                case "newConnection":
                    OnNewConnectionMessage(sessionId, peerMessage);
                    break;
                case "peerRequest":
                    OnPeerRequest(sessionId, peerMessage);
                    break;
                case "answerPeerRequest":
                    OnAnswerPeerRequest(sessionId, peerMessage);
                    break;
            }
        });
        const closeListener = channel.addEventListener('close', () => {
            channel.removeEventListener('close', closeListener);
            channel.removeEventListener('message', messageListener);

            peerConnection.close();
            delete allActiveConnections[sessionId];

            onConnectionRemove(sessionId);
        });

        AddOrUpdateRemoteCharacter(sessionId, remotePlayerConfigs);
        onConnectionAdd(sessionId);
    }
}

function AddOrUpdateRemoteCharacter(messageRecievedFromSessionId, remotePlayerConfigs) {
    const remoteCharacterString = localStorage.getItem("REMOTE_CHARACTERS");
    const remoteCharacters = remoteCharacterString ? JSON.parse(remoteCharacterString) : {};
    remoteCharacters[remotePlayerConfigs.name] = remotePlayerConfigs;

    localStorage.setItem("REMOTE_CHARACTERS", JSON.stringify(remoteCharacters));

    if (allActiveConnections[messageRecievedFromSessionId]) {
        // In case a disconnect happened and this is undefined now.
        allActiveConnections[messageRecievedFromSessionId].remotePlayerConfigs = remotePlayerConfigs;
    }
}

async function OnNewConnectionMessage(messageRecievedFromSessionId, message) {
    if (!allActiveConnections[message.newConnectionSessionId]) {
        // See if we've already requested to this session.
        if (openRequests[message.newConnectionSessionId]) {
            openRequests[message.newConnectionSessionId].close();
        }

        // We aren't already connected to this... Let's try to connect.
        const peerConnection = createPeerConnection();
        const dataChannel = createDataChannel(peerConnection);
        AddCurrentOfferWhenDataChannelOpened(mySessionId, myPlayerConfigs, peerConnection, dataChannel);

        openRequests[message.newConnectionSessionId] = peerConnection;
        
        const offer = await createConnectionOffer(peerConnection);
        const peerRequest = peerRequestMessage(mySessionId, message.newConnectionSessionId, offer);
        if (allActiveConnections[messageRecievedFromSessionId]) {
            allActiveConnections[messageRecievedFromSessionId].channel.send(JSON.stringify(peerRequest));
        }
    }
}

async function OnPeerRequest(messageRecievedFromSessionId, message) {
    if (message.peerSessionId === mySessionId) {
        if (openRequests[message.requestorSessionId]) {
            openRequests[message.requestorSessionId].close();
        }

        // Create a peer connection and set it up to consume the data channel from the requestor.
        const peerConnection = createPeerConnection();
        getDataChannelFromConnection(peerConnection).then(dataChannel => {
            if (dataChannel) {
                AddCurrentOfferWhenDataChannelOpened(mySessionId, myPlayerConfigs, peerConnection, dataChannel);
            }
        });

        openRequests[message.newConnectionSessionId] = peerConnection;

        // Let's accept the offer.
        const answer = await acceptConnectionOfferAndGiveAnswer(peerConnection, message.offer);
        const peerAnswer = answerPeerRequestMessage(mySessionId, message.requestorSessionId, answer);

        // Send the offer back to who we recieved it from, they'll be able to get it back to the requestor for us.
        if (allActiveConnections[messageRecievedFromSessionId]) {
            allActiveConnections[messageRecievedFromSessionId].channel.send(JSON.stringify(peerAnswer));
        }
    } else {
        // We aren't who this is for, but maybe one of our peers are...
        if (allActiveConnections[message.peerSessionId]) {
            // It is for one of our peers, deliver it to them.
            allActiveConnections[message.peerSessionId].channel.send(JSON.stringify(message));
        }
    }
}

async function OnAnswerPeerRequest(messageRecievedFromSessionId, message) {
    if (message.originalRequestorSessionId === mySessionId) {
        // Create a peer connection and set it up to consume the data channel from the requestor.
        const peerConnection = openRequests[message.answeringSessionId];
        if (peerConnection) {
            await completeConnectionOfferWithAnswer(peerConnection, message.answer);
        }
    } else {
        // We aren't who this is for, but maybe one of our peers are...
        if (allActiveConnections[message.originalRequestorSessionId]) {
            // It is for one of our peers, deliver it to them.
            allActiveConnections[message.originalRequestorSessionId].channel.send(JSON.stringify(message));
        }
    }
}

function onConnectionAdd(sessionId) {
    // Send a message to all other connections (other than this one that just connected) that a new connection was added!
    const connectionMessage = newConnectionMessage(sessionId);
    SendMessageToAllActiveConnections(connectionMessage, sessionId);

    if (onConnectionChangedHandler) {
        onConnectionChangedHandler();
    }
}

function onConnectionRemove(sessionId) {
    if (onConnectionChangedHandler) {
        onConnectionChangedHandler();
    }
}

export function AddOnConnectionChangedHandler(connectionChangedHandler) {
    onConnectionChangedHandler = connectionChangedHandler;
}

export function SendMessageToAllActiveConnections(message, sessionIdToExclude = undefined) {
    const allSessionIds = Object.keys(allActiveConnections);
    for (let sessionId of allSessionIds) {
        const singleActiveConnection = allActiveConnections[sessionId]
        if (singleActiveConnection.peerConnection.connectionState !== "connected") {
            singleActiveConnection.peerConnection.close();
            delete allActiveConnections[sessionId];
            continue;
        }

        if (sessionId !== sessionIdToExclude) {
            singleActiveConnection.channel.send(JSON.stringify(message));
        }
    }
}

export function GetAllActiveConnections() {
    const allSessionIds = Object.keys(allActiveConnections);
    for (let sessionId of allSessionIds) {
        const singleActiveConnection = allActiveConnections[sessionId]
        if (singleActiveConnection.peerConnection.connectionState !== "connected") {
            singleActiveConnection.peerConnection.close();
            delete allActiveConnections[sessionId];
            continue;
        }
    }

    return allActiveConnections;
}