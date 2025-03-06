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
                <div>{activeConnection.isMirror ? "" : activeConnection.remotePlayerConfigs.name}<b>{activeConnection.isMirror ? "Mirror" : ""}</b></div>
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
    setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
        menuTitle: "Link Type", 
        menuText: "Create Peer Link or Mirror?\n\n<b>Peer Link.</b> Link to a different character. Displays basic information about linked characters such as HP and conditions, and allows for active effects to be shared.\n\n<b>Mirror.</b> Allows for a single character to stay synced across multiple devices.", 
        buttons: [
        {
            text: "Peer Link",
            onClick: () => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
                    menuTitle: "Peer Link Setup", 
                    menuText: "Create or Recieve Link?", 
                    buttons: [
                    {
                        text: "Create",
                        onClick: () => {
                            addToMenuStack({ menuType: "LinkCableMenu", menuConfig });
                            setCenterScreenMenu({ show: true, menuType: "LinkCreateMenu", data: {} });
                        }
                    },
                    {
                        text: "Recieve",
                        onClick: () => {
                            addToMenuStack({ menuType: "LinkCableMenu", menuConfig });
                            setCenterScreenMenu({ show: true, menuType: "LinkRecieveMenu", data: {} });
                        }
                    }
                ] } });
            }
        },
        {
            text: "Mirror",
            onClick: () => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
                    menuTitle: "Mirror Setup", 
                    menuText: "Host or Recieve Mirrored Character?", 
                    buttons: [
                    {
                        text: "Host",
                        onClick: () => {
                            addToMenuStack({ menuType: "LinkCableMenu", menuConfig });
                            setCenterScreenMenu({ show: true, menuType: "LinkRecieveMenu", data: { mirror: true } });
                        }
                    },
                    {
                        text: "Recieve",
                        onClick: () => {
                            addToMenuStack({ menuType: "LinkCableMenu", menuConfig });
                            setCenterScreenMenu({ show: true, menuType: "LinkCreateMenu", data: { mirror: true } });
                        }
                    }
                ] } });
            }
        }
    ] } });
    
}

function linkedCharsClicked(setCenterScreenMenu, addToMenuStack, menuConfig) {
    addToMenuStack({ menuType: "LinkCableMenu", menuConfig });
    setCenterScreenMenu({ show: true, menuType: "LinkedChars", data: {} });
}