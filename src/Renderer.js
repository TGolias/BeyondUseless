import { StatDisplay } from "./Components/StatDisplay";
import { calculateHPMax } from "./SharedFunctions/TabletopMathFunctions";
import './Renderer.css';
import React from "react";

export function Renderer({playerConfigs}) {
    return (
        <>
            <div>
                <h2>{playerConfigs.name}</h2>
                <div>HP: {calculateHPMax(playerConfigs)}</div>
                <div className="mobileDivider">
                    <div className="baseStats">
                        <StatDisplay name="STRENGTH" value={playerConfigs.baseStats.strength}/>
                        <StatDisplay name="DEXTERITY" value={playerConfigs.baseStats.dexterity}/>
                        <StatDisplay name="CONSTITUTION" value={playerConfigs.baseStats.constitution}/>
                    </div>
                    <div className="baseStats">
                        <StatDisplay name="INTELLIGENCE" value={playerConfigs.baseStats.intelligence}/>
                        <StatDisplay name="WISDOM" value={playerConfigs.baseStats.wisdom}/>
                        <StatDisplay name="CHARISMA" value={playerConfigs.baseStats.charisma}/>
                    </div>
                </div>
            </div>
        </>
    );
}