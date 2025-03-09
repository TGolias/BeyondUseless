import React from "react";
import './SpellPageComponent.css';
import { getCapitalizedAbilityScoreName, parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { concatStringArrayToAndStringWithCommas, convertArrayToDictionary, getHomePageUrl } from "../../SharedFunctions/Utils";
import { calculateAddendumAspect, calculateOtherSpellAspect, calculateRange, calculateSpellAttack, calculateSpellSaveDC, getAllSpellcastingFeatures, getAllSpells } from "../../SharedFunctions/TabletopMathFunctions";
import { getCollection } from "../../Collections";

export function SpellPageComponent({spell, data, playerConfigs, copyLinkToSpell}) {
    let castingTime = "";
    if (Array.isArray(spell.castingTime)) {
        for (let singleCastingTime of spell.castingTime) {
            if (castingTime.length > 0) {
                castingTime += " or "
            }
            castingTime += singleCastingTime;
        }
    } else {
        castingTime = spell.castingTime;
    }

    let castingCondition = undefined;
    if (spell.castingCondition) {
        castingCondition = spell.castingCondition;
    }

    const range = calculateRange(playerConfigs, spell.range);

    let componentsString = "";
    if (spell.components) {
        for (let component of spell.components) {
            if (componentsString.length > 0) {
                componentsString += ",";
            }
            componentsString += component;
        }
    }

    if (spell.materialComponents) {
        componentsString += " (";
        const materialComponentsString = concatStringArrayToAndStringWithCommas(spell.materialComponents);
        componentsString += materialComponentsString;
        componentsString += ")";
    }

    let description = parseStringForBoldMarkup(spell.description);

    if (copyLinkToSpell) {
        copyLinkToSpell.onExecute = () => {
            copyToClipboard(spell, data, playerConfigs);
        };
    }

    // Get aspects from playerConfigs
    let featureName = undefined;
    let castAtLevel = spell.level;
    let freeUses = undefined;
    let spellCastingConditionAddendum = undefined;
    let attackRoll = undefined;
    let attackRollAddendum = undefined
    let savingThrowType = undefined;
    let savingThrowDc = undefined;
    let savingThrowDcAddendum = undefined;
    let damage = undefined;
    let healing = undefined;
    let restore = undefined;
    let buffAmount = undefined;
    let buffDescription = undefined;
    let debuffAmount = undefined;
    let debuffDescription = undefined;
    if (data) {
        if (data.freeUses !== undefined) {
            freeUses = data.freeUses;
        }
        if (data.castAtLevel) {
            castAtLevel = data.castAtLevel;
        }
        
        if (playerConfigs) {
            // Get the spell specifically for the character so that we can set the feature.
            const spellCastingFeatures = getAllSpellcastingFeatures(playerConfigs);
            const allSpells = getAllSpells(spellCastingFeatures);
            const spellForPlayer = allSpells.find(s => s.name === spell.name);
            if (spellForPlayer) {
                // When you get the spell for a player specifically it comes with the feature property on it.
                spell.feature = spellForPlayer.feature;
                featureName = spellForPlayer.feature.name;

                const spellCastingConditionAddendumString = calculateAddendumAspect(playerConfigs, "spellCastingConditionAddendum", { spell: spell });
                if (spellCastingConditionAddendumString) {
                    spellCastingConditionAddendum = parseStringForBoldMarkup(spellCastingConditionAddendumString);
                }

                if (spell.challengeType === "attackRoll") {
                    const attack = calculateSpellAttack(playerConfigs, spell, castAtLevel)
                    attackRoll = attack.amount;
                    if (attack.addendum) {
                        attackRollAddendum = parseStringForBoldMarkup(attack.addendum);
                    }
                }

                if (spell.challengeType === "savingThrow") {
                    savingThrowType = spell.savingThrowType;

                    const savingThrowCalc = calculateSpellSaveDC(playerConfigs, spell, castAtLevel);
                    savingThrowDc = savingThrowCalc.dc;
                    if (savingThrowCalc.addendum) {
                        savingThrowDcAddendum = parseStringForBoldMarkup(savingThrowCalc.addendum);
                    }
                }

                if (spell.type.includes("damage")) {
                    damage = calculateOtherSpellAspect(playerConfigs, spell, castAtLevel, "damage", "spellDamageBonus", { userInput: data.userInput });
                }

                if (spell.type.includes("buff")) {
                    if (spell.buff.calculation) {
                        buffAmount = calculateOtherSpellAspect(playerConfigs, spell, castAtLevel, "buff", "buffBonus", { userInput: data.userInput });
                    }
                    buffDescription = spell.buff.description;
                }

                if (spell.type.includes("debuff")) {
                    if (spell.debuff.calculation) {
                        debuffAmount = calculateOtherSpellAspect(playerConfigs, spell, castAtLevel, "debuff", "debuffBonus", { userInput: data.userInput });
                    }
                    debuffDescription = spell.debuff.description;
                    if (spell.debuff.conditions) {
                        if (!debuffDescription) {
                            debuffDescription = "";
                        }
                        const allConditions = getCollection("conditions");
                        const allConditionsMap = convertArrayToDictionary(allConditions, "name");
                        for (let condition of spell.debuff.conditions) {
                            const dndCondition = allConditionsMap[condition];
                            if (debuffDescription.length > 0) {
                                debuffDescription += "\n\n";
                            }
                            debuffDescription += "<b>" + dndCondition.name + ".</b> " + dndCondition.description;
                        }
                    }
                }

                if (spell.type.includes("healing")) {
                    healing = calculateOtherSpellAspect(playerConfigs, spell, castAtLevel, "healing", "healingBonus", { userInput: data.userInput });
                }

                if (spell.type.includes("restore")) {
                    restore = calculateOtherSpellAspect(playerConfigs, spell, "restore", "restoreBonus", { userInput: data.userInput });
                }
            }
        }
    }

    return <>
        <div className="spellPageContainer">
            <div>{spell.level ? "LVL " + spell.level : "Cantrip"} - {spell.school}</div>
            <div><span className="spellPageBold">Casting Time:</span> {castingTime}</div>
            <div style={{display: (castingCondition ? "block" : "none")}}>{castingCondition}</div>
            <div style={{display: (spellCastingConditionAddendum ? "block" : "none")}}>{spellCastingConditionAddendum}</div>
            <div><span className="spellPageBold">Range:</span> {range}</div>
            <div><span className="spellPageBold">Components:</span> {componentsString}</div>
            <div><span className="spellPageBold">Duration:</span> <b>{spell.concentration ? "Concentration" : ""}</b>{spell.concentration ? ", " : ""}{spell.duration}</div>
            <div className="spellPageDescription">{description}</div>
            <div className="spellPageDescription"><span className="spellPageBold">Spell List:</span> {concatStringArrayToAndStringWithCommas(spell.spellLists)}</div>
            <br style={{display: (data ? "block" : "none")}}></br>
            <div className="spellPageDescription" style={{display: (data ? "block" : "none")}}>
                <div><b>Spell Summary</b></div>
            </div>
            <div className="spellPageDescription" style={{display: (data ? "block" : "none")}}>
                <div><b>Cast at LVL{castAtLevel}</b></div>
            </div>
            <div className="spellPageDescription" style={{display: (attackRoll ? "block" : "none")}}>
                <div><b>Attack Roll:</b> +{attackRoll}</div>
            </div>
            <div className="spellPageDescription" style={{display: (attackRollAddendum ? "block" : "none")}}>
                <div>{attackRollAddendum}</div>
            </div>
            <div className="spellPageDescription" style={{display: (savingThrowType ? "block" : "none")}}>
                <div><b>DC{savingThrowDc}</b> {getCapitalizedAbilityScoreName(savingThrowType)}</div>
            </div>
            <div className="spellPageDescription" style={{display: (savingThrowDcAddendum ? "block" : "none")}}>
                <div>{savingThrowDcAddendum}</div>
            </div>
            <div className="spellPageDescription" style={{display: (damage ? "block" : "none")}}>
                <div><b>Damage:</b> {damage}</div>
            </div>
            <div className="spellPageDescription" style={{display: (healing ? "block" : "none")}}>
                <div><b>Healing:</b> {healing}</div>
            </div>
            <div className="spellPageDescription" style={{display: (restore ? "block" : "none")}}>
                <div><b>Conditions Removed:</b> {restore}</div>
            </div>
            <div className="spellPageDescription" style={{display: (buffAmount || buffDescription ? "block" : "none")}}>
                <div><b>Buff:</b> {(buffAmount ? buffAmount + " " : "")}{parseStringForBoldMarkup(buffDescription)}</div>
            </div>
            <div className="spellPageDescription" style={{display: ((debuffAmount || debuffDescription) ? "block" : "none")}}>
                <div><b>Debuff:</b> {debuffAmount ? debuffAmount + " " : ""}{parseStringForBoldMarkup(debuffDescription)}</div>
            </div>
            <div className="spellPageDescription" style={{display: (featureName ? "block" : "none")}}>
                <div><b>Learned from:</b> {featureName}</div>
            </div>
            <div className="spellPageDescription" style={{display: (freeUses !== undefined ? "block" : "none")}}>
                <div><b>Free uses remaining:</b> {freeUses}</div>
            </div>
        </div>
    </>
}

function copyToClipboard(spell, data, playerConfigs) {
    const stringifiedJson = JSON.stringify(data);
    navigator.clipboard.writeText(spell.name + "\n" + getHomePageUrl() + "?view=spell&name=" + encodeURIComponent(spell.name) + "&data=" + encodeURIComponent(stringifiedJson) + (playerConfigs ? "&playerName=" + encodeURIComponent(playerConfigs.name) : ""));
}