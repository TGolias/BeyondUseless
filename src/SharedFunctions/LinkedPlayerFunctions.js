import { answerPeerRequestMessage, newConnectionMessage, peerRequestMessage } from "./LinkedPlayerMessageFunctions";
import { acceptConnectionOfferAndGiveAnswer, AddCurrentOfferWhenDataChannelOpened, completeConnectionOfferWithAnswer, createConnectionOffer, createDataChannel, createPeerConnection, getDataChannelFromConnection } from "./PeerConnectionSetupFunctions";
import { convertArrayToDictionary } from "./Utils";

const allActiveConnections = {};

// TODO: God, this is lazy and this patern is terrible... I need to clean this up. A lot of the weird logic here can probably just be abstracted out to events I think. -it pains me every time I see this...
let mySessionId = undefined;
let myPlayerConfigs = undefined;
let loadCharacter = undefined;
let forceUpdate = undefined
let stateChangeHandler = undefined
let onConnectionChangedHandler = undefined;
let onRemoteCharacterChangedHandler = undefined;

const openRequests = {};

export function SetMySessionId(sessionId) {
    mySessionId = sessionId;
}

export function SetMyPlayerConfigs(playerConfigs) {
    myPlayerConfigs = playerConfigs;
}

export function SetLoadCharacter(loadCharacterFunc) {
    loadCharacter = loadCharacterFunc;
}

export function SetForceUpdate(forceUpdateFunc) {
    forceUpdate = forceUpdateFunc;
}

export function SetStateChangeHandler(stateChangeHandlerFunc) {
    stateChangeHandler = stateChangeHandlerFunc;
}

export function AddLinkedPlayer(sessionId, remotePlayerConfigs, peerConnection, channel, creator, isMirror) {
    if (openRequests[sessionId]) {
        // This is no longer an open request: we've sealed the deal!
        delete openRequests[sessionId];
    }

    if (allActiveConnections[sessionId]) {
        // We already have a connection. No need to add.
        peerConnection.close();
    } else {
        allActiveConnections[sessionId] = { peerConnection, channel, remotePlayerConfigs, isMirror };
        const messageListener = channel.addEventListener('message', (event) => {
            const peerMessage = JSON.parse(event.data);
            switch (peerMessage.type) {
                case "update":
                    if (isMirror) {
                        UpdateMirrorCharacter(sessionId, peerMessage.playerConfigs);
                    } else {
                        AddOrUpdateRemoteCharacter(sessionId, peerMessage.playerConfigs);
                    }
                    break;
                case "newActiveEffect":
                    AddNewActiveEffect(sessionId, peerMessage);
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

        if (isMirror) {
            // If we are the not the creator of the mirror, we don't need to update anything: we already have the right configs.
            if (creator) {
                UpdateMirrorCharacter(sessionId, remotePlayerConfigs);
            }
        } else {
            AddOrUpdateRemoteCharacter(sessionId, remotePlayerConfigs);
        }

        onConnectionAdd(sessionId, isMirror);
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

    // See if any of our active effects are from this player
    const activeEffects = myPlayerConfigs.currentStatus?.activeEffects ?? [];
    if (activeEffects.length > 0) {
        let anyEffectsFromRemotePlayer = false;
        // See if any of our effects are from the player, and also see if any of them were removed on the same loop.
        const remoteCharActiveEffects = remotePlayerConfigs.currentStatus?.activeEffects ?? [];
        const remoteCharActiveEffectsMap = convertArrayToDictionary(remoteCharActiveEffects, "name");
        const activeEffectsIndexesToRemove = [];
        for (let i = 0; i < activeEffects.length; i++) {
            const effectToAdd = activeEffects[i];
            if (effectToAdd.fromRemoteCharacter === remotePlayerConfigs.name) {
                anyEffectsFromRemotePlayer = true;
                if (!remoteCharActiveEffectsMap[effectToAdd.name]) {
                    // This effect doesn't exist anymore, have it removed.
                    activeEffectsIndexesToRemove.push(i);
                }
            }
        }
    
        if (activeEffectsIndexesToRemove.length > 0) {
            let newActiveEffectsWithRemovals = activeEffects;
            for (let i = 0; i < activeEffectsIndexesToRemove.length; i++) {
                const indexToRemove = activeEffectsIndexesToRemove[i] - i; // Minus i because the array gets smaller by one each time.
                newActiveEffectsWithRemovals = [...newActiveEffectsWithRemovals];
                newActiveEffectsWithRemovals.splice(indexToRemove, 1);
            }
            stateChangeHandler(myPlayerConfigs, "currentStatus.activeEffects", newActiveEffectsWithRemovals);
        } else if (anyEffectsFromRemotePlayer) {
            // Nothing was removed, but we do have effects from this player. Let's force it to re-calculate aspects.
            forceUpdate();
        }
    }

    if (onRemoteCharacterChangedHandler) {
        onRemoteCharacterChangedHandler(remotePlayerConfigs.name);
    }
}

function AddNewActiveEffect(messageRecievedFromSessionId, message) {
    const newActiveEffects = myPlayerConfigs.currentStatus?.activeEffects ? [...myPlayerConfigs.currentStatus?.activeEffects] : [];
    if (!newActiveEffects.some(effect => effect.fromRemoteCharacter === message.newActiveEffect.fromRemoteCharacter && effect.name === message.newActiveEffect.name)) {
        // There's not already an effect on us from this remote character with this same name. Apply it!
        newActiveEffects.push(message.newActiveEffect);
        stateChangeHandler(myPlayerConfigs, "currentStatus.activeEffects", newActiveEffects);
    }
}

function UpdateMirrorCharacter(messageRecievedFromSessionId, remotePlayerConfigs) {
    if (loadCharacter) {
        // This allows for mirroring functionality.
        loadCharacter(remotePlayerConfigs);
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

        // If our middle man is a mirror and it just set up a connection with another mirror, we want to connect to it mirrored as well, in case the middle-man drops out.
        const isMiddleManMirror = allActiveConnections[messageRecievedFromSessionId] ? allActiveConnections[messageRecievedFromSessionId].isMirror : false;
        const isNewConnectionMirror = message.isMirror;
        const isMirror = isMiddleManMirror && isNewConnectionMirror;
        AddCurrentOfferWhenDataChannelOpened(mySessionId, myPlayerConfigs, peerConnection, dataChannel, true, isMirror);

        openRequests[message.newConnectionSessionId] = peerConnection;
        
        const offer = await createConnectionOffer(peerConnection);
        const peerRequest = peerRequestMessage(mySessionId, message.newConnectionSessionId, offer, isMirror);
        if (allActiveConnections[messageRecievedFromSessionId]) {
            // We can't send it to the peer directly, so send it to our shared peer as the middle-man.
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
                // If our middleman is a mirror, and the request message is setting up for a mirror, we set this up as a mirror. (The middle-man will filter our linked peers trying to set up mirrors for security reasons)
                const isMiddleManMirror = allActiveConnections[messageRecievedFromSessionId] ? allActiveConnections[messageRecievedFromSessionId].isMirror : false;
                const isRequestMirror = message.isMirror;
                const isMirror = isMiddleManMirror && isRequestMirror;
                AddCurrentOfferWhenDataChannelOpened(mySessionId, myPlayerConfigs, peerConnection, dataChannel, false, isMirror);
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
        // We aren't who this is for, but maybe one of our peers are... We are the middle-man
        if (allActiveConnections[message.peerSessionId]) {
            if (message.isMirror) {
                // If they are trying to set up a mirror connection, but aren't actually a mirror of us, the middle man: set mirror to false. Linked peers can't automatically set up mirrors for security reasons.
                const isMessageSenderAMirror = allActiveConnections[messageRecievedFromSessionId] ? allActiveConnections[messageRecievedFromSessionId].isMirror : false;
                message.isMirror = isMessageSenderAMirror;
            }
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
        // We aren't who this is for, but maybe one of our peers are... We are the middle-man
        if (allActiveConnections[message.originalRequestorSessionId]) {
            // It is for one of our peers, deliver it to them.
            allActiveConnections[message.originalRequestorSessionId].channel.send(JSON.stringify(message));
        }
    }
}

function onConnectionAdd(sessionId, isMirror) {
    // Send a message to all other connections (other than this one that just connected) that a new connection was added!
    const connectionMessage = newConnectionMessage(sessionId, isMirror);
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

export function AddOnRemoteCharacterChangedHandler(remoteCharacterChangedHandler) {
    onRemoteCharacterChangedHandler = remoteCharacterChangedHandler;
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