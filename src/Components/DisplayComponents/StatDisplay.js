import React from 'react';
import './StatDisplay.css';
import { calculateAspectCollection, calculateModifierForBaseStat, calculateSavingThrowBonus, calculateSkillBonus } from '../../SharedFunctions/TabletopMathFunctions';
import { convertArrayOfStringsToHashMap, playAudio } from '../../SharedFunctions/Utils';
import { getCollection } from '../../Collections';
import { getCapitalizedAbilityScoreName } from '../../SharedFunctions/ComponentFunctions';

export function StatDisplay({playerConfigs, name, value, setCenterScreenMenu}) {
    const modifierAmount = calculateModifierForBaseStat(value);

    const playerSavingThrowProficiencies = calculateAspectCollection(playerConfigs, "savingThrowProficiencies");
    const playerSavingThrowProficienciesMap = convertArrayOfStringsToHashMap(playerSavingThrowProficiencies);
    const savingThrowBonus = calculateSavingThrowBonus(playerConfigs, name, playerSavingThrowProficienciesMap[name]);

    const playerSkillProficiencies = calculateAspectCollection(playerConfigs, "skillProficiencies");
    const playerSkillProficienciesMap = convertArrayOfStringsToHashMap(playerSkillProficiencies);
    const playerExpertise = calculateAspectCollection(playerConfigs, "expertise");
    const playerExpertiseMap = convertArrayOfStringsToHashMap(playerExpertise);
    const playerHalfSkillProficiencies = calculateAspectCollection(playerConfigs, "halfSkillProficiencies");
    const playerHalfSkillProficienciesMap = convertArrayOfStringsToHashMap(playerHalfSkillProficiencies);

    const dndSkillProficiencies = getCollection("skillProficiencies");
    const skillproficiencyRows = [];
    for (const skillProficiency of dndSkillProficiencies) {
        if (skillProficiency.modifier === name) {
            const skillBonus = calculateSkillBonus(playerConfigs, skillProficiency, playerSkillProficienciesMap[skillProficiency.name], playerExpertiseMap[skillProficiency.name], playerHalfSkillProficienciesMap[skillProficiency.name]);
            skillproficiencyRows.push(<>
                <div className="saveAndSkillsWrapper" onClick={() => openSkillProfMenu(setCenterScreenMenu, skillProficiency.name)}>
                    <div className="proficencyCircleWrapper">
                        <div className={"outer-circle" + (playerExpertiseMap[skillProficiency.name] ? " pixel-corners" : "")}>
                            <div className={"dot pixel-corners" + (playerSkillProficienciesMap[skillProficiency.name] ? " fill" : "")}>
                                <div className={(!playerSkillProficienciesMap[skillProficiency.name] && playerHalfSkillProficienciesMap[skillProficiency.name]) ? "half-fill" : ""}></div>
                            </div>
                        </div>
                    </div>
                    <div className="skillModifier">{(skillBonus < 0 ? "" : "+") + skillBonus}</div>
                    <div className="proficencyScore">
                        <div className="proficencyScoreText">{skillProficiency.name}</div>
                    </div>
                </div>
            </>)
        }
    }


    return (
        <>
            <div className='outerbox pixel-corners'>
                <div className="statName">{name}</div>
                <div className="baseStatContainer">
                    <div className='statDisplaystatLabel'>MODIFIER</div>
                    <div className='modifier'>{(modifierAmount < 0 ? "" : "+") + calculateModifierForBaseStat(value)}</div>
                    <div className='statDisplaystatLabel'>SCORE</div>
                    <div className="scoreContainer">
                        <div className='pixel-corners--wrapper'>
                            <div className='circleAroundScore pixel-corners'>
                                <div className='abilityScore'>{value}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="saveAndSkillsWrapper" onClick={() => openSavingThrowMenu(setCenterScreenMenu, name)}>
                    <div className="proficencyCircleWrapper">
                        <div className={"outer-circle"}>
                            <div className={"dot pixel-corners" + (playerSavingThrowProficienciesMap[name] ? " fill" : "")}></div>
                        </div>
                    </div>
                    <div className="skillModifier">{(savingThrowBonus < 0 ? "" : "+") + savingThrowBonus}</div>
                    <div className="proficencyScore">
                        <div className="proficencyScoreText boldText">Saving Throws</div>
                    </div>
                </div>
                {skillproficiencyRows}
            </div>
        </>
    )
}

function openSavingThrowMenu(setCenterScreenMenu, baseStatName) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "AspectMenu", data: { menuTitle: (getCapitalizedAbilityScoreName(baseStatName) + " Saving Throws"), aspectName: (baseStatName + "SavingThrow"), addendumsToShow: [(baseStatName + "SavingThrowAddendum")], leadingPlus: true } });
}

function openSkillProfMenu(setCenterScreenMenu, skillProfName) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "AspectMenu", data: { menuTitle: skillProfName, aspectName: ("skillProficiency" + skillProfName), addendumsToShow: [("skillProficiency" + skillProfName + "Addendum")], leadingPlus: true } });
}