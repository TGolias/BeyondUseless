import React from "react";
import './MasteryMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { MasteryPageComponent } from "../PageComponents/MasteryPageComponent";

export function MasteryMenu({playerConfigs, setCenterScreenMenu, menuConfig}) {
    return (<>
        <div className="masteryMenuWrapperDiv">
            <MasteryPageComponent mastery={menuConfig.mastery} playerConfigs={playerConfigs} copyLinkToItem={menuConfig.copyLinkToItem}></MasteryPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="masteryMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}