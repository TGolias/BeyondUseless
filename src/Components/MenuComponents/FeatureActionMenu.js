import React from "react";
import './FeatureActionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { FeatureActionPageComponent } from "../PageComponents/FeatureActionPageComponent";

export function FeatureActionMenu({setCenterScreenMenu, menuConfig}) {


    return (<>
        <div className="featureActionMenuWrapperDiv">
            <FeatureActionPageComponent featureAction={menuConfig.featureAction} feature={menuConfig.feature} origin={menuConfig.origin} copyLinkToItem={menuConfig.copyLinkToItem}></FeatureActionPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="featureActionMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}