import React from "react";
import './CustomItemMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { TextInput } from "../SimpleComponents/TextInput";

export function CustomItemMenu({menuConfig, menuStateChangeHandler, setCenterScreenMenu}) {
    return (<>
        <div className="customItemMenuWrapperDiv">
            <div>
                <div>Name</div>
                <TextInput isNumberValue={false} baseStateObject={menuConfig} pathToProperty={"customItem.name"} inputHandler={menuStateChangeHandler}></TextInput>
            </div>
            <div>
                <div>Weight</div>
                <TextInput isNumberValue={true} isDecimal={true} minimum={0} baseStateObject={menuConfig} pathToProperty={"customItem.weight"} inputHandler={menuStateChangeHandler}></TextInput>
            </div>
            <div className="customItemMenuDescription">
                <div>Description</div>
                <TextInput isNumberValue={false} isMultiline={true} baseStateObject={menuConfig} pathToProperty={"customItem.description"} inputHandler={menuStateChangeHandler}></TextInput>
            </div>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="customItemMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                menuConfig.onOkClicked(menuConfig.customItem);
            }} showTriangle={false} disabled={!menuConfig.customItem.name}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}