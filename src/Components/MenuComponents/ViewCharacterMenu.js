import React from "react";
import './ViewCharacterMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { Renderer } from "../MainLayoutComponents/Renderer";
import { getTotalPath } from "../../SharedFunctions/ComponentFunctions";

var playerConfigs = undefined;

export function ViewCharacterMenu({setCenterScreenMenu, addToMenuStack, menuConfig, menuStateChangeHandler}) {

    if (!menuConfig.isPlayerConfigsSet) {
        playerConfigs = menuConfig.playerConfigs;
        menuConfig.isPlayerConfigsSet = true;
        menuStateChangeHandler(menuConfig, "isPlayerConfigsSet", menuConfig.isPlayerConfigsSet);
    }

    const characterInputChangeHandler = (baseStateObject, pathToProperty, newValue) => {
        const totalPath = getTotalPath(pathToProperty);
                        
        // We are traversing the path, but also making shallow copies all the way down for the new version of the state as we go.
        let newBaseStateObject = Object.assign({}, baseStateObject);
        let newPropertyObject = newBaseStateObject;
    
        // We do - 1 to the length because we don't want to end up with the actual property at the end, just right before.
        for (let i = 0; i < totalPath.length - 1; i++) {
            let pathSegment = totalPath[i];
            const nextPropertyObject = newPropertyObject[pathSegment];
    
            let newNextPropertyObject
            // Sometimes some slippery arrays make their way in here... those get cloned differently.
            if (Array.isArray(nextPropertyObject)) {
                newNextPropertyObject = [...nextPropertyObject]
            } else {
                newNextPropertyObject = Object.assign({}, nextPropertyObject);
            }
            
            newPropertyObject[pathSegment] = newNextPropertyObject;
            newPropertyObject = newNextPropertyObject
        }
    
        // Now we have the property object right at the end of the path and have done our shallow clones all the way to it.
        if (totalPath.length === 0) {
            newPropertyObject = newValue;
        } else {
            newPropertyObject[totalPath[totalPath.length - 1]] = newValue;
        }
        playerConfigs = newBaseStateObject;
        return newBaseStateObject;
    };

    const characterSetCenterScreenMenu = (centerScreenMenu) => {
        centerScreenMenu.overrides = {
            playerConfigs: playerConfigs,
            inputChangeHandler: characterInputChangeHandler,
            setCenterScreenMenu: characterSetCenterScreenMenu,
        };
        setCenterScreenMenu(centerScreenMenu);
    };

    return (<>
        <div className="viewCharacterMenuWrapperDiv">
            <Renderer playerConfigs={playerConfigs} inputChangeHandler={characterInputChangeHandler} setCenterScreenMenu={(centerScreenMenu) => { 
                addToMenuStack({ menuType: "ViewCharacterMenu", menuConfig });
                characterSetCenterScreenMenu(centerScreenMenu);
            }} showDeathScreen={undefined}></Renderer>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="viewCharacterMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                if (menuConfig.onOkClicked) {
                    menuConfig.onOkClicked(playerConfigs);
                }
            }} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}