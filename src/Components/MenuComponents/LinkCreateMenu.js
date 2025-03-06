import React from "react";
import './LinkCreateMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { TextInput } from "../SimpleComponents/TextInput";
import { AddCurrentOfferWhenDataChannelOpened, completeConnectionOfferWithAnswer, createConnectionOffer, createDataChannel, createPeerConnection } from "../../SharedFunctions/PeerConnectionSetupFunctions";
import { decodeForCopying, encodeForCopying } from "../../SharedFunctions/Utils";

var peerConnection = undefined;

export function LinkCreateMenu({sessionId, playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler}) {
    
    if (!menuConfig.isPeerConnectionCreated) {
        if (peerConnection) {
            peerConnection.close();
        }

        peerConnection = createPeerConnection();
        const dataChannel = createDataChannel(peerConnection);
        AddCurrentOfferWhenDataChannelOpened(sessionId, playerConfigs, peerConnection, dataChannel, true, menuConfig.mirror).then(result => {
            if (result) {
                menuStateChangeHandler(menuConfig, "connectionFinished", result.message);
            }
        });

        createConnectionOffer(peerConnection).then(offerCode => {
            menuStateChangeHandler(menuConfig, "offerCode", offerCode);
        });

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
        linkRows.push(<>
            <div>Send <b>link code</b> to the player you would like to Link with:</div>
        </>);
    
        if (menuConfig.offerCode) {
            linkRows.push(<>
                <br></br>
                <RetroButton text={"Copy Link Code"} onClickHandler={() => {
                    navigator.clipboard.writeText(encodeForCopying(JSON.stringify(menuConfig.offerCode)));
                    menuStateChangeHandler(menuConfig, "isOfferCodeCopied", true);
                }} showTriangle={false} disabled={false}></RetroButton>
            </>);
        } else {
            linkRows.push(<>
                <br></br>
                <div>Generating code...</div>
            </>);
        }
        
        if (menuConfig.isOfferCodeCopied) {
            linkRows.push(<>
                <br></br>
                <div>Paste <b>response code</b> here or have it read from your clipboard:</div>
                <TextInput isNumberValue={false} baseStateObject={{}} pathToProperty={""} inputHandler={(baseStateObject, pathToProperty, newValue) => {
                    processResponseCode(newValue, menuConfig, menuStateChangeHandler);
                }}></TextInput>
                <RetroButton text={"Read From Clipboard"} onClickHandler={() => {
                    navigator.clipboard.readText().then(text => {
                        processResponseCode(text, menuConfig, menuStateChangeHandler);
                        menuStateChangeHandler(menuConfig, "linkCodeInput", text);
                    });
                }} showTriangle={false} disabled={false}></RetroButton>
            </>);
        }
    
        if (menuConfig.isInvalidResponseCode) {
            linkRows.push(<>
                <br></br>
                <div>Invalid Response Code!</div>
            </>);
        }
    }

    return (<>
        <div className="linkCreateMenuWrapperDiv">{linkRows}</div>
        <div className="centerMenuSeperator"></div>
        <div className="linkCreateMenuHorizontal">
            <RetroButton text={"Close"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function processResponseCode(newValue, menuConfig, menuStateChangeHandler) {
    if (newValue) {
        let answer = undefined
        try {
            answer = JSON.parse(decodeForCopying(newValue));
        } catch {
            menuStateChangeHandler(menuConfig, "isInvalidResponseCode", true);
        }
        if (answer) {
            completeConnectionOfferWithAnswer(peerConnection, answer).then(success => {
                menuStateChangeHandler(menuConfig, "isInvalidResponseCode", false);
            }, failure => {
                menuStateChangeHandler(menuConfig, "isInvalidResponseCode", true);
            });
            menuStateChangeHandler(menuConfig, "isInvalidResponseCode", false);
        }
    } else {
        menuStateChangeHandler(menuConfig, "isInvalidResponseCode", false);
    }
}