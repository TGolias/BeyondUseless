import React, { useReducer } from "react";
import './LinkCableMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { AddOnConnectionChangedHandler, GetAllActiveConnections } from "../../SharedFunctions/LinkedPlayerFunctions";

export function LinkCableMenu({playerConfigs, setCenterScreenMenu, menuConfig, addToMenuStack}) {
    const [, forceUpdate] = useReducer(x => !x, false);
    AddOnConnectionChangedHandler(() => {
        if (forceUpdate) {
            forceUpdate();
        }
    })

    const activeConnections = GetAllActiveConnections();
    const activeConnectionRows = [];

    const activeConnectionKeys = Object.keys(activeConnections);
    if (activeConnectionKeys.length) {
        activeConnectionRows.push(<>
            <div>Active Connections:</div>
        </>)

        const activeConnectionTableRows = [];
        for (let activeConnectionKey of activeConnectionKeys) {
            const activeConnection = activeConnections[activeConnectionKey];
            activeConnectionTableRows.push(<>
                <div>{activeConnectionKey}</div>
                <div>{activeConnection.remotePlayerConfigs.name}</div>
                <RetroButton text={"X"} onClickHandler={() => {
                    activeConnection.peerConnection.close();
                }} showTriangle={false} disabled={false}></RetroButton>
            </>);
        }

        activeConnectionRows.push(<>
            <div className="linkCableMenuGrid">{activeConnectionTableRows}</div>
        </>);
    } else {
        activeConnectionRows.push(<>
            <div>No Active Connections.</div>
        </>);
    }

    return (<>
        <div className="linkCableMenuHorizontal">
            <RetroButton text={"Link Setup"} onClickHandler={() => {linkSetupClicked(setCenterScreenMenu, addToMenuStack, menuConfig)}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Chars"} onClickHandler={() => {linkedCharsClicked(setCenterScreenMenu, addToMenuStack, menuConfig)}} showTriangle={false} disabled={false}></RetroButton>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="linkCableMenuWrapperDiv">{activeConnectionRows}</div>
        <div className="centerMenuSeperator"></div>
        <div className="linkCableMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function linkSetupClicked(setCenterScreenMenu, addToMenuStack, menuConfig) {
    addToMenuStack({ menuType: "LinkCableMenu", menuConfig });
    setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
        menuTitle: "Link Setup", 
        menuText: "Create or Recieve Link?", 
        buttons: [
        {
            text: "Create",
            onClick: () => {
                setCenterScreenMenu({ show: true, menuType: "LinkCreateMenu", data: {} });
            }
        },
        {
            text: "Recieve",
            onClick: () => {
                setCenterScreenMenu({ show: true, menuType: "LinkRecieveMenu", data: {} });
            }
        }
    ] } });
}

function linkedCharsClicked(setCenterScreenMenu, addToMenuStack, menuConfig) {
    addToMenuStack({ menuType: "LinkCableMenu", menuConfig });
    setCenterScreenMenu({ show: true, menuType: "LinkedChars", data: {} });
}