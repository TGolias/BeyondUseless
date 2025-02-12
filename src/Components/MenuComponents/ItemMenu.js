import React from "react";
import './ItemMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ItemPageComponent } from "../PageComponents/ItemPageComponent";

export function ItemMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const data = {};

    return (<>
        <div className="itemMenuWrapperDiv">
            <ItemPageComponent item={menuConfig.item} data={data}></ItemPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="spellMenuHorizontal">
            <RetroButton text={"Close"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}