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
                AddCurrentOfferWhenDataChannelOpened(sessionId, playerConfigs, peerConnection, dataChannel, false).then(result => {
                    if (result) {
                        menuStateChangeHandler(menuConfig, "connectionSuccessful", true);
                    }
                });
            }
        })

        menuConfig.isPeerConnectionCreated = true;
        menuStateChangeHandler(menuConfig, "isPeerConnectionCreated", menuConfig.isPeerConnectionCreated);
    }

    const linkRows = [];

    if (menuConfig.connectionSuccessful) {
        // The connection has been added to our collection, no need to maintain it here anymore.
        peerConnection = undefined;

        linkRows.push(<>
            <div>Connection Successful!</div>
        </>);
    } else {
        linkRows.push(<>
            <div>Paste code recieved from player here:</div>
            <TextInput isNumberValue={false} baseStateObject={{}} pathToProperty={""} inputHandler={(baseStateObject, pathToProperty, newValue) => {
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
            }}></TextInput>
        </>);

        if (menuConfig.isInvalidCode && !menuConfig.answerCode) {
            linkRows.push(<>
                <br></br>
                <div>Invalid Code!</div>
            </>);
        }
    
        if (menuConfig.answerCode) {
            linkRows.push(<>
                <br></br>
                <div>Send response code back to player you are Linking with:</div>
                <br></br>
                <RetroButton text={"Copy Code"} onClickHandler={() => {
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