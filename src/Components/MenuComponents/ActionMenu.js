import React from "react";
import './ActionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ActionPageComponent } from "../PageComponents/ActionPageComponent";

export function ActionMenu({playerConfigs, setCenterScreenMenu, menuConfig}) {
    const data = {};
    data.playerConfigs = playerConfigs;

    return (<>
        <div className="actionMenuWrapperDiv">
            <ActionPageComponent action={menuConfig.action} copyLinkToItem={menuConfig.copyLinkToItem} data={data}></ActionPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="actionMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}