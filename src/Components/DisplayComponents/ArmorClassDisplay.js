import React from "react";
import './ArmorClassDisplay.css';
import { calculateArmorClass } from "../../SharedFunctions/TabletopMathFunctions";

export function ArmorClassDisplay({playerConfigs}) {
    const armorClass = calculateArmorClass(playerConfigs);
    return <>
        <div className="armorclassdiv armorclass-corners">
            <div>AC</div>
            <div>{armorClass}</div>
        </div>
    </>
}