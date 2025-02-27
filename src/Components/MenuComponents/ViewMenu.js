import React from "react";
import './ViewMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { SpellPageComponent } from "../PageComponents/SpellPageComponent";

export function ViewMenu({setCenterScreenMenu, menuConfig}) {

    const pageComponentRow = [];
    switch (menuConfig.viewType) {
        case "spell":
            pageComponentRow.push(<>
                <SpellPageComponent spell={menuConfig.spell} data={menuConfig.data} copyLinkToSpell={menuConfig.copyLinkToView}></SpellPageComponent>
            </>);
            break;
    }

    return (<>
        <div className="viewMenuWrapperDiv" style={{display: (pageComponentRow.length ? "flex" : "none")}}>
            {pageComponentRow}
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="viewMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}