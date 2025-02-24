import React from "react";
import './UnarmedStrikeMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { UnarmedStrikePageComponent } from "../PageComponents/UnarmedStrikePageComponent";

export function UnarmedStrikeMenu({playerConfigs, setCenterScreenMenu, menuConfig}) {
    const data = {};
    data.playerConfigs = playerConfigs;

    return (<>
        <div className="unarmedAttackMenuWrapperDiv">
            <UnarmedStrikePageComponent unarmedStrike={menuConfig.unarmedStrike} data={data} copyLinkToItem={menuConfig.copyLinkToItem}></UnarmedStrikePageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="unarmedAttackMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}