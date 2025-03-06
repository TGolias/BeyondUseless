export function establishIdentityPlayerMessage(sessionId, playerConfigs, isMirror) {
    const message = {
        type: "establish",
        sessionId: sessionId,
        playerConfigs: playerConfigs,
        isMirror: isMirror
    }
    return message;
}

export function updatedPlayerConfigsMessage(sessionId, playerConfigs) {
    const message = {
        type: "update",
        sessionId: sessionId,
        playerConfigs: playerConfigs
    }
    return message;
}

export function newConnectionMessage(newConnectionSessionId, isMirror) {
    const message = {
        type: "newConnection",
        newConnectionSessionId: newConnectionSessionId,
        isMirror: isMirror
    }
    return message;
}

export function peerRequestMessage(requestorSessionId, peerSessionId, offer, isMirror) {
    const message = {
        type: "peerRequest",
        requestorSessionId: requestorSessionId,
        peerSessionId: peerSessionId,
        offer: offer,
        isMirror: isMirror
    }
    return message;
}

export function answerPeerRequestMessage(answeringSessionId, originalRequestorSessionId, answer) {
    const message = {
        type: "answerPeerRequest",
        answeringSessionId: answeringSessionId,
        originalRequestorSessionId: originalRequestorSessionId,
        answer: answer
    }
    return message;
}