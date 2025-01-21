import React from "react";
import './ProficiencyBonusDisplay.css';
import { calculateProficiencyBonus } from "../../SharedFunctions/TabletopMathFunctions";

export function ProficiencyBonusDisplay({playerConfigs}) {
    const modifierAmount = calculateProficiencyBonus(playerConfigs)

    return (<>
        <div className='profOuterbox pixel-corners'>
            <div className="profBonusLabel">Proficency<br></br>Bonus</div>
            <div className="profScoreContainer">
                <div className='profScoreModifier'>{"+" + modifierAmount}</div>
            </div>
        </div>
    </>)
}