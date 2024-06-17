import { calculateAspectCollection, calculateBaseStat, calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";
import './Renderer.css';
import React from "react";
import { StatDisplay } from "../DisplayComponents/StatDisplay";

export function Renderer({playerConfigs}) {
    const languagesString = calculateAspectCollection(playerConfigs, "languages").join(", ");
    const resistancesString = calculateAspectCollection(playerConfigs, "resistances").join(", ");

    return (
        <>
            <div className="outerDiv">
                <h2>{playerConfigs.name}</h2>
                <div className="lvl">LVL{playerConfigs.level}</div>
                <div className="hp">HP: {calculateHPMax(playerConfigs)}</div>
                <div className="mobileDivider">
                    <div className="baseStats">
                        <StatDisplay name="STR" value={calculateBaseStat(playerConfigs, "strength")}/>
                        <StatDisplay name="DEX" value={calculateBaseStat(playerConfigs, "dexterity")}/>
                        <StatDisplay name="CON" value={calculateBaseStat(playerConfigs, "constitution")}/>
                    </div>
                    <div className="baseStats">
                        <StatDisplay name="INT" value={calculateBaseStat(playerConfigs, "intelligence")}/>
                        <StatDisplay name="WIS" value={calculateBaseStat(playerConfigs, "wisdom")}/>
                        <StatDisplay name="CHA" value={calculateBaseStat(playerConfigs, "charisma")}/>
                    </div>
                </div>
                <div style={{display: (languagesString ? "block" : "none")}} className="underConstruction">
                    <div>Languages: {languagesString}</div>
                </div>
                <div style={{display: (resistancesString ? "block" : "none")}} className="underConstruction">
                    <div>Resistances: {resistancesString}</div>
                </div>
            </div>
        </>
    );
}