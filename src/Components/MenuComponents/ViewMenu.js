import React from "react";
import './ViewMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { SpellPageComponent } from "../PageComponents/SpellPageComponent";
import { FeatureActionPageComponent } from "../PageComponents/FeatureActionPageComponent";
import { ActionPageComponent } from "../PageComponents/ActionPageComponent";

export function ViewMenu({setCenterScreenMenu, menuConfig}) {

    const pageComponentRow = [];
    switch (menuConfig.viewType) {
        case "spell":
            pageComponentRow.push(<>
                <SpellPageComponent spell={menuConfig.spell} data={menuConfig.data} copyLinkToSpell={menuConfig.copyLinkToView}></SpellPageComponent>
            </>);
            break;
        case "featureaction":
            pageComponentRow.push(<>
                <FeatureActionPageComponent featureAction={menuConfig.featureAction} feature={menuConfig.feature} origin={menuConfig.origin} data={menuConfig.data} copyLinkToItem={menuConfig.copyLinkToView}></FeatureActionPageComponent>
            </>);
            break;
        case "action":
            pageComponentRow.push(<>
                <ActionPageComponent action={menuConfig.action} copyLinkToItem={menuConfig.copyLinkToView} data={menuConfig.data} ></ActionPageComponent>
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