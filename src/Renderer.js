import { StatDisplay } from "./Components/StatDisplay";
import { calculateHPMax } from "./SharedFunctions/TabletopMathFunctions";
import './Renderer.css';
import React from "react";

export function Renderer({playerConfigs}) {
    return (
        <>
            <div className="outerDiv">
                <h2>{playerConfigs.name}</h2>
                <div className="lvl">LVL{playerConfigs.level}</div>
                <div className="hp">HP: {calculateHPMax(playerConfigs)}</div>
                <div className="mobileDivider">
                    <div className="baseStats">
                        <StatDisplay name="STR" value={playerConfigs.baseStats.strength}/>
                        <StatDisplay name="DEX" value={playerConfigs.baseStats.dexterity}/>
                        <StatDisplay name="CON" value={playerConfigs.baseStats.constitution}/>
                    </div>
                    <div className="baseStats">
                        <StatDisplay name="INT" value={playerConfigs.baseStats.intelligence}/>
                        <StatDisplay name="WIS" value={playerConfigs.baseStats.wisdom}/>
                        <StatDisplay name="CHA" value={playerConfigs.baseStats.charisma}/>
                    </div>
                </div>
            </div>
        </>
    );
}