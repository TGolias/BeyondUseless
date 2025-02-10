import React from "react";
import './SpellMenu.css';
import { SpellPageComponent } from "../PageComponents/SpellPageComponent";

export function SpellMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {

    const featureName = menuConfig.spell.feature.name;
    const data = { featureName: featureName };

    return (<>
        <div className="spellMenuWrapperDiv">
            <SpellPageComponent spell={menuConfig.spell} data={data}></SpellPageComponent>
        </div>
    </>);
}