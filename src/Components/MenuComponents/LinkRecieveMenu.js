import React from "react";
import './LinkRecieveMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { TextInput } from "../SimpleComponents/TextInput";
import { acceptConnectionOfferAndGiveAnswer, AddCurrentOfferWhenDataChannelOpened, createPeerConnection, getDataChannelFromConnection } from "../../SharedFunctions/PeerConnectionSetupFunctions";
import { decodeForCopying, encodeForCopying } from "../../SharedFunctions/Utils";

var peerConnection = undefined;

export function LinkRecieveMenu({sessionId, playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler}) {

    if (!menuConfig.isPeerConnectionCreated) {
        if (peerConnection) {
            peerConnection.close();
        }

        peerConnection = createPeerConnection();
        getDataChannelFromConnection(peerConnection).then(dataChannel => {
            if (dataChannel) {
                AddCurrentOfferWhenDataChannelOpened(sessionId, playerConfigs, peerConnection, dataChannel, false, menuConfig.mirror).then(result => {
                    if (result) {
                        menuStateChangeHandler(menuConfig, "connectionFinished", result.message);
                    }
                });
            }
        })

        menuConfig.isPeerConnectionCreated = true;
        menuStateChangeHandler(menuConfig, "isPeerConnectionCreated", menuConfig.isPeerConnectionCreated);
    }

    const linkRows = [];

    if (menuConfig.connectionFinished) {
        // The connection has been added to our collection (or failed), no need to maintain it here anymore.
        peerConnection = undefined;

        linkRows.push(<>
            <div>{menuConfig.connectionFinished}</div>
        </>);
    } else {
        if (!menuConfig.answerCode) {
            linkRows.push(<>
                <div>Paste <b>link code</b> recieved from player here or have it read from your clipboard:</div>
                <TextInput isNumberValue={false} baseStateObject={{}} pathToProperty={""} inputHandler={(baseStateObject, pathToProperty, newValue) => {
                    processLinkCode(newValue, menuConfig, menuStateChangeHandler);
                }}></TextInput>
                <RetroButton text={"Read From Clipboard"} onClickHandler={() => {
                    navigator.clipboard.readText().then(text => {
                        processLinkCode(text, menuConfig, menuStateChangeHandler);
                    });
                }} showTriangle={false} disabled={false}></RetroButton>
            </>);
        }

        if (menuConfig.isInvalidCode && !menuConfig.answerCode) {
            linkRows.push(<>
                <br></br>
                <div>Invalid Code!</div>
            </>);
        }
    
        if (menuConfig.answerCode) {
            linkRows.push(<>
                <div>Send <b>response code</b> back to player you are Linking with:</div>
                <br></br>
                <RetroButton text={"Copy Response Code"} onClickHandler={() => {
                    navigator.clipboard.writeText(encodeForCopying(JSON.stringify(menuConfig.answerCode)));
                }} showTriangle={false} disabled={false}></RetroButton>
            </>);
        }
    }

    return (<>
        <div className="linkRecieveMenuWrapperDiv">{linkRows}</div>
        <div className="centerMenuSeperator"></div>
        <div className="linkRecieveMenuHorizontal">
            <RetroButton text={"Close"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function processLinkCode(newValue, menuConfig, menuStateChangeHandler) {
    if (newValue) {
        let offer = undefined
        try {
            offer = JSON.parse(decodeForCopying(newValue));
        } catch {
            menuStateChangeHandler(menuConfig, "isInvalidCode", true);
        }
        if (offer) {
            acceptConnectionOfferAndGiveAnswer(peerConnection, offer).then(success => {
                menuStateChangeHandler(menuConfig, "answerCode", success);
            }, failure => {
                menuStateChangeHandler(menuConfig, "isInvalidCode", true);
            });
            menuStateChangeHandler(menuConfig, "isInvalidCode", false);
        }
    } else {
        menuStateChangeHandler(menuConfig, "isInvalidCode", false);
    }
}