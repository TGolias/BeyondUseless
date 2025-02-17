import React from "react";
import './ActionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ActionPageComponent } from "../PageComponents/ActionPageComponent";

export function ActionMenu({setCenterScreenMenu, menuConfig}) {
    return (<>
        <div className="actionMenuWrapperDiv">
            <ActionPageComponent action={menuConfig.action} copyLinkToItem={menuConfig.copyLinkToItem}></ActionPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="actionMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}