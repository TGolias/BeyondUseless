import { calculateAspectCollection, calculateBaseStat, calculateHPMax, calculateProficiencyBonus } from "../../SharedFunctions/TabletopMathFunctions";
import './Renderer.css';
import React from "react";
import { StatDisplay } from "../DisplayComponents/StatDisplay";

export function Renderer({playerConfigs}) {
    const languagesString = calculateAspectCollection(playerConfigs, "languages").join(", ");
    const resistancesString = calculateAspectCollection(playerConfigs, "resistances").join(", ");

    return (
        <>
            <div className="outerDiv">
                <div className="playerName">{playerConfigs.name}</div>
                <div className="lvl"><span>LVL{playerConfigs.level}</span><span className="prof">Prof: +{calculateProficiencyBonus(playerConfigs)}</span></div>
                <div className="hp">HP: {calculateHPMax(playerConfigs)}</div>
                <div className="baseStats">
                    <StatDisplay name="strength" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "strength")}/>
                    <StatDisplay name="dexterity" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "dexterity")}/>
                    <StatDisplay name="constitution" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "constitution")}/>
                    <StatDisplay name="intelligence" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "intelligence")}/>
                    <StatDisplay name="wisdom" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "wisdom")}/>
                    <StatDisplay name="charisma" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "charisma")}/>
                </div>
                <div className="textEntry" style={{display: (languagesString ? "block" : "none")}}>
                    <div>Languages: {languagesString}</div>
                </div>
                <div className="textEntry" style={{display: (resistancesString ? "block" : "none")}}>
                    <div>Resistances: {resistancesString}</div>
                </div>
                <br/>
            </div>
        </>
    );
}