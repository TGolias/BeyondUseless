import React from "react";
import './SelectListMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { SelectList } from "../SimpleComponents/SelectList";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";

export function SelectListMenu({menuConfig, setCenterScreenMenu, menuStateChangeHandler}) {
    return (<>
        <div className="selectListMenuWrapperDiv">
            <div className="selectListMenuText">
                <div>{parseStringForBoldMarkup(menuConfig.menuText)}</div>
                <SelectList options={menuConfig.options} isNumberValue={false} baseStateObject={menuConfig} pathToProperty={"valueSelected"} inputHandler={menuStateChangeHandler}></SelectList>
            </div>
            <div className="centerMenuSeperator"></div>
            <div className="selectListMenuHorizontal">
                <RetroButton text={"OK"} buttonSound={menuConfig.okButtonSound ? menuConfig.okButtonSound : "selectionaudio"} onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                    menuConfig.onOkClicked(menuConfig.valueSelected);
                }} showTriangle={false} disabled={!menuConfig.valueSelected}></RetroButton>
                <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            </div>
        </div>
    </>);
}