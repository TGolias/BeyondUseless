import React from "react";
import './QuantityMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { SelectList } from "../SimpleComponents/SelectList";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { CircleButton } from "../SimpleComponents/CircleButton";

export function QuantityMenu({menuConfig, setCenterScreenMenu, menuStateChangeHandler}) {
    return (<>
        <div className="quantityMenuWrapperDiv">
            <div className="quantityMenuText">
                <div>{parseStringForBoldMarkup(menuConfig.menuText)}</div>
                <div className="quantityMenuButtons">
                    <CircleButton text={"-"} onClickHandler={() => {
                        menuStateChangeHandler(menuConfig, "quantity", menuConfig.quantity - 1);
                    }} disabled={menuConfig.quantity <= 0}></CircleButton>
                    <div>{menuConfig.quantity}</div>
                    <CircleButton text={"+"} onClickHandler={() => {
                        menuStateChangeHandler(menuConfig, "quantity", menuConfig.quantity + 1);
                    }} disabled={false}></CircleButton>
                </div>
            </div>
            <div className="centerMenuSeperator"></div>
            <div className="quantityMenuHorizontal">
                <RetroButton text={"OK"} onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                    menuConfig.onOkClicked(menuConfig.quantity);
                }} showTriangle={false} disabled={false}></RetroButton>
                <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            </div>
        </div>
    </>);
}