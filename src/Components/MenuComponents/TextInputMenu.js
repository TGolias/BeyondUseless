import React from "react";
import './TextInputMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { TextInput } from "../SimpleComponents/TextInput";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";

export function TextInputMenu({menuConfig, setCenterScreenMenu, menuStateChangeHandler}) {
    return (<>
        <div className="textInputMenuWrapperDiv">
            <div className="textInputMenuText">
                <div>{parseStringForBoldMarkup(menuConfig.menuText)}</div>
                <TextInput isNumberValue={false} baseStateObject={menuConfig} pathToProperty={"valueTyped"} inputHandler={menuStateChangeHandler}></TextInput>
            </div>
            <div className="centerMenuSeperator"></div>
            <div className="textInputMenuHorizontal">
                <RetroButton text={"OK"} onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                    menuConfig.onOkClicked(menuConfig.valueTyped);
                }} showTriangle={false} disabled={!menuConfig.valueTyped}></RetroButton>
                <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            </div>
        </div>
    </>);
}