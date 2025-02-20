import React from "react";
import './ItemMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ItemPageComponent } from "../PageComponents/ItemPageComponent";

export function ItemMenu({playerConfigs, setCenterScreenMenu, addToMenuStack, menuConfig}) {
    const data = {};
    data.playerConfigs = playerConfigs;

    return (<>
        <div className="itemMenuWrapperDiv">
            <ItemPageComponent item={menuConfig.item} data={data} copyLinkToItem={menuConfig.copyLinkToItem} setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={() => {addToMenuStack({ menuType: "ItemMenu", menuConfig, menuTitle: menuConfig.item.name })}}></ItemPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="itemMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}