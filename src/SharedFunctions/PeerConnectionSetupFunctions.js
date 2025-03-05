import { AddLinkedPlayer } from "./LinkedPlayerFunctions";
import { establishIdentityPlayerMessage } from "./LinkedPlayerMessageFunctions";

export function createPeerConnection() {
    const peerConnection = new RTCPeerConnection({ iceServers: [ {urls: "stun:stun.l.google.com:19302"}, ] });
    return peerConnection;
}

export function createDataChannel(peerConnection) {
    const dataChannel = peerConnection.createDataChannel('channel');
    return dataChannel;
}

export function getDataChannelFromConnection(peerConnection) {
    return new Promise(resolve => {
        const datachannelListener = peerConnection.addEventListener('datachannel', (event) => {
            const dataChannel = event.channel;
            peerConnection.removeEventListener("datachannel", datachannelListener);
            resolve(dataChannel);
        });
        const closeListener = peerConnection.addEventListener('close', () => {
            peerConnection.removeEventListener('datachannel', datachannelListener);
            peerConnection.removeEventListener('close', closeListener);
            resolve(undefined);
        });
    });
}

export async function createConnectionOffer(peerConnection) {
    var allIceCandidatesFound = new Promise(resolve => {
        const iceListener = peerConnection.addEventListener("icecandidate", (event) => {
            if (event.candidate === null) {
                // Once we get a null candidate, that means all candidates were found.
                peerConnection.removeEventListener("icecandidate", iceListener);
                resolve();
            }
        });
    });
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await allIceCandidatesFound;

    return peerConnection.localDescription;
}

export async function completeConnectionOfferWithAnswer(peerConnection, answer) {
    await peerConnection.setRemoteDescription(answer);
}

export async function acceptConnectionOfferAndGiveAnswer(peerConnection, offer) {
    const iceListener = peerConnection.addEventListener("icecandidate", (event) => {
        if (peerConnection.remoteDescription) {
            peerConnection.addIceCandidate(event.candidate).then(success => {
                peerConnection.removeEventListener("icecandidate", iceListener);
            }, failure => {
                // Do nothing on failure. Let it try the next candidate.
            });
        }
    });

    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return peerConnection.localDescription;
}

export function AddCurrentOfferWhenDataChannelOpened(sessionId, playerConfigs, peerConnection, dataChannel) {
    return new Promise(resolve => {
        const openListener = dataChannel.addEventListener('open', () => {
            // Send them our establish message now that we're connected! They should be doing the same for us.
            dataChannel.send(JSON.stringify(establishIdentityPlayerMessage(sessionId, playerConfigs)));
    
            dataChannel.removeEventListener('open', openListener);
        });
        const messageListener = dataChannel.addEventListener('message', (event) => {
            const peerMessage = JSON.parse(event.data);
            if (peerMessage.type === "establish") {
                AddLinkedPlayer(peerMessage.sessionId, peerMessage.playerConfigs, peerConnection, dataChannel);
                dataChannel.removeEventListener('message', messageListener);
                resolve(true);
            }
        });
        const closeListener = peerConnection.addEventListener('close', () => {
            dataChannel.removeEventListener('open', openListener);
            dataChannel.removeEventListener('message', messageListener);
            peerConnection.removeEventListener('close', closeListener);
            resolve(false);
        });
    });
}