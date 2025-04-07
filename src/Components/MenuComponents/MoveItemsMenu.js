import React from "react";
import './MoveItemsMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { CircleButton } from "../SimpleComponents/CircleButton";

const downTriangleUnicode = '\u25BC';

export function MoveItemsMenu({menuConfig, menuStateChangeHandler, setCenterScreenMenu}) {

    const itemRows = [];
    for (let i = 0; i < menuConfig.items.length; i++) {
        const item = menuConfig.items[i];
        itemRows.push(<>
            <CircleButton text={downTriangleUnicode} upsideDown={true} onClickHandler={() => {
                const newItems = [...menuConfig.items];
                const itemToMoveFromSpot = newItems[i - 1];
                newItems[i - 1] = newItems[i];
                newItems[i] = itemToMoveFromSpot;
                menuStateChangeHandler(menuConfig, "items", newItems);
            }} disabled={i === 0}></CircleButton>
            <CircleButton text={downTriangleUnicode} upsideDown={false} onClickHandler={() => {
                const newItems = [...menuConfig.items];
                const itemToMoveFromSpot = newItems[i + 1];
                newItems[i + 1] = newItems[i];
                newItems[i] = itemToMoveFromSpot;
                menuStateChangeHandler(menuConfig, "items", newItems);
            }} disabled={i === menuConfig.items.length - 1}></CircleButton>
            <div>{item.name}</div>
        </>);
    }

    return (<>
        <div className="moveItemsMenuWrapperDiv">
            {itemRows}
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="moveItemsMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                menuConfig.onOkClicked(menuConfig.items);
            }} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}