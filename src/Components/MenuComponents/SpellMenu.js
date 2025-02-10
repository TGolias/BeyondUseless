import React from "react";
import './SpellMenu.css';
import { SpellPageComponent } from "../PageComponents/SpellPageComponent";

export function SpellMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {

    return (<>
        <div className="spellMenuWrapperDiv">
            <SpellPageComponent spell={menuConfig.spell}></SpellPageComponent>
        </div>
    </>);
}