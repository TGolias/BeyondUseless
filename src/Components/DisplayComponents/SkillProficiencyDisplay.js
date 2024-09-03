import React from "react";
import "./SkillProficiencyDisplay.css"
import { getCollection } from "../../Collections";
import { calculateAspectCollection, calculateSkillBonus } from "../../SharedFunctions/TabletopMathFunctions";
import { convertArrayOfStringsToHashMap } from "../../SharedFunctions/Utils";

export function SkillProficiencyDisplay({playerConfigs}) {
    const playerSkillProficiencies = calculateAspectCollection(playerConfigs, "skillProficiencies");
    const playerSkillProficienciesMap = convertArrayOfStringsToHashMap(playerSkillProficiencies);
    const playerExpertise = calculateAspectCollection(playerConfigs, "expertise");
    const playerExpertiseMap = convertArrayOfStringsToHashMap(playerExpertise);

    const dndSkillProficiencies = getCollection("skillproficiencies");
    const skillproficiencyRows = [];
    for (const skillProficiency of dndSkillProficiencies) {
        const skillBonus = calculateSkillBonus(playerConfigs, skillProficiency, playerSkillProficienciesMap[skillProficiency.name], playerExpertiseMap[skillProficiency.name]);
        skillproficiencyRows.push(<>
            <div className={"outer-circle" + (playerExpertiseMap[skillProficiency.name] ? " pixel-corners" : "")}>
                <div className={"dot pixel-corners" + (playerSkillProficienciesMap[skillProficiency.name] ? " fill" : "")}>
                    <div className={(false /*TODO: Later on we need to be able to calculate half proficency for bards*/) ? "half-fill" : ""}></div>
                </div>
            </div>
            <div className="proficencyScore">{skillProficiency.name}</div>
            <div className="score">{(skillBonus <= 0 ? "" : "+") + skillBonus}</div>
        </>)
    }

    return (<>
        <div className="pixel-corners">
            <div className="proficienciesWrapper">{skillproficiencyRows}</div>
        </div>
    </>)
}