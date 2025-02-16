import React from "react";
import './PropertyMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { PropertyPageComponent } from "../PageComponents/PropertyPageComponent";

export function PropertyMenu({playerConfigs, setCenterScreenMenu, menuConfig}) {
    const data = {};
    data.playerConfigs = playerConfigs;

    return (<>
        <div className="propertyMenuWrapperDiv">
            <PropertyPageComponent property={menuConfig.property} data={data} copyLinkToItem={menuConfig.copyLinkToItem}></PropertyPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="propertyMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}