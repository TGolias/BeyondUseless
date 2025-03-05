import React from "react";
import './LinkCreateMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { TextInput } from "../SimpleComponents/TextInput";
import { AddCurrentOfferWhenDataChannelOpened, completeConnectionOfferWithAnswer, createConnectionOffer, createDataChannel, createPeerConnection } from "../../SharedFunctions/PeerConnectionSetupFunctions";

var peerConnection = undefined;

export function LinkCreateMenu({sessionId, playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler}) {
    
    if (!menuConfig.isPeerConnectionCreated) {
        if (peerConnection) {
            peerConnection.close();
        }

        peerConnection = createPeerConnection();
        const dataChannel = createDataChannel(peerConnection);
        AddCurrentOfferWhenDataChannelOpened(sessionId, playerConfigs, peerConnection, dataChannel).then(result => {
            if (result) {
                menuStateChangeHandler(menuConfig, "connectionSuccessful", true);
            }
        });

        createConnectionOffer(peerConnection).then(offerCode => {
            menuStateChangeHandler(menuConfig, "offerCode", offerCode);
        });

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
            <div>Send Link to the player you would like to Link with:</div>
        </>);
    
        if (menuConfig.offerCode) {
            linkRows.push(<>
                <br></br>
                <RetroButton text={"Copy Code"} onClickHandler={() => {
                    navigator.clipboard.writeText(btoa(JSON.stringify(menuConfig.offerCode)));
                    menuStateChangeHandler(menuConfig, "isOfferCodeCopied", true);
                }} showTriangle={false} disabled={false}></RetroButton>
            </>);
        }
        
        if (menuConfig.isOfferCodeCopied) {
            linkRows.push(<>
                <br></br>
                <div>Paste response code here:</div>
                <TextInput isNumberValue={false} baseStateObject={{}} pathToProperty={""} inputHandler={(baseStateObject, pathToProperty, newValue) => {
                    if (newValue) {
                        let answer = undefined
                        try {
                            answer = JSON.parse(atob(newValue));
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
                }}></TextInput>
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