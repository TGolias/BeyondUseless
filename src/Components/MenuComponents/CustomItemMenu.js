import React from "react";
import './CustomItemMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { TextInput } from "../SimpleComponents/TextInput";

export function CustomItemMenu({menuConfig, menuStateChangeHandler, setCenterScreenMenu}) {

    const textDivs = [];
    if (menuConfig.readonly) {
        textDivs.push(<>
            <div>
                <div><b>Name</b></div>
                <div>{menuConfig.customItem.name}</div>
            </div>
            <div>
                <div><b>Weight</b></div>
                <div>{menuConfig.customItem.weight}</div>
            </div>
            <div className="customItemMenuDescription">
                <div><b>Description</b></div>
                <div>{menuConfig.customItem.description}</div>
            </div>
        </>);
    } else {
        textDivs.push(<>
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
        </>);
    }


    return (<>
        <div className="customItemMenuWrapperDiv">
            {textDivs}
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="customItemMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                if (menuConfig.onOkClicked) {
                    menuConfig.onOkClicked(menuConfig.customItem);
                }
            }} showTriangle={false} disabled={!menuConfig.customItem.name}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}