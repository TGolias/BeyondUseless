import React from 'react';
import './StatDisplay.css';
import { calculateAspectCollection, calculateModifierForBaseStat, calculateSkillBonus } from '../../SharedFunctions/TabletopMathFunctions';
import { convertArrayOfStringsToHashMap } from '../../SharedFunctions/Utils';
import { getCollection } from '../../Collections';

export function StatDisplay({playerConfigs, name, value}) {
    const modifierAmount = calculateModifierForBaseStat(value);
    const playerSkillProficiencies = calculateAspectCollection(playerConfigs, "skillProficiencies");
    const playerSkillProficienciesMap = convertArrayOfStringsToHashMap(playerSkillProficiencies);
    const playerExpertise = calculateAspectCollection(playerConfigs, "expertise");
    const playerExpertiseMap = convertArrayOfStringsToHashMap(playerExpertise);

    const dndSkillProficiencies = getCollection("skillproficiencies");
    const skillproficiencyRows = [];
    for (const skillProficiency of dndSkillProficiencies) {
        if (skillProficiency.modifier === name) {
            const skillBonus = calculateSkillBonus(playerConfigs, skillProficiency, playerSkillProficienciesMap[skillProficiency.name], playerExpertiseMap[skillProficiency.name]);
            skillproficiencyRows.push(<>
                <div className="proficencyCircleWrapper">
                    <div className={"outer-circle" + (playerExpertiseMap[skillProficiency.name] ? " pixel-corners" : "")}>
                        <div className={"dot pixel-corners" + (playerSkillProficienciesMap[skillProficiency.name] ? " fill" : "")}>
                            <div className={(false /*TODO: Later on we need to be able to calculate half proficency for bards*/) ? "half-fill" : ""}></div>
                        </div>
                    </div>
                </div>
                <div className="skillModifier">{(skillBonus <= 0 ? "" : "+") + skillBonus}</div>
                <div className="proficencyScore">
                    <div className="proficencyScoreText">{skillProficiency.name}</div>
                </div>
            </>)
        }
    }


    return (
        <>
            <div className='outerbox pixel-corners'>
                <div className="statName">{name}</div>
                <div className="baseStatContainer">
                    <div>MODIFIER</div>
                    <div className='modifier'>{(modifierAmount <= 0 ? "" : "+") + calculateModifierForBaseStat(value)}</div>
                    <div>SCORE</div>
                    <div className="scoreContainer">
                        <div className='pixel-corners--wrapper'>
                            <div className='circleAroundScore pixel-corners'>
                                <div className='abilityScore'>{value}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="saveAndSkillsWrapper">
                    {skillproficiencyRows}
                </div>
            </div>
        </>
    )
}