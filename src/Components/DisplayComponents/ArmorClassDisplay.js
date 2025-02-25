import React from "react";
import './ArmorClassDisplay.css';
import { calculateArmorClass } from "../../SharedFunctions/TabletopMathFunctions";
import { playAudio } from "../../SharedFunctions/Utils";

export function ArmorClassDisplay({playerConfigs, setCenterScreenMenu}) {
    const armorClass = calculateArmorClass(playerConfigs);
    return <>
        <div onClick={() => openArmorMenu(setCenterScreenMenu)} className="armorclassdiv armorclass-corners">
            <div>AC</div>
            <div>{armorClass}</div>
        </div>
    </>
}

function openArmorMenu(setCenterScreenMenu) {
    playAudio("menuaudio")
    setCenterScreenMenu({ show: true, menuType: "ArmorMenu" });
}