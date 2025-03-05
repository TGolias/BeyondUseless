export function establishIdentityPlayerMessage(sessionId, playerConfigs) {
    const message = {
        type: "establish",
        sessionId: sessionId,
        playerConfigs: playerConfigs
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

export function newConnectionMessage(newConnectionSessionId) {
    const message = {
        type: "newConnection",
        newConnectionSessionId: newConnectionSessionId
    }
    return message;
}

export function peerRequestMessage(requestorSessionId, peerSessionId, offer) {
    const message = {
        type: "peerRequest",
        requestorSessionId: requestorSessionId,
        peerSessionId: peerSessionId,
        offer: offer
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