import React from "react";
import './SpellPageComponent.css';
import { getCapitalizedAbilityScoreName, parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";
import { calculateAddendumAspect, calculateOtherSpellAspect, calculateSpellAttack, calculateSpellSaveDC } from "../../SharedFunctions/TabletopMathFunctions";

export function SpellPageComponent({spell, data, copyLinkToSpell}) {
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

    let range = "";
    if (Array.isArray(spell.range)) {
        for (let singleRange of spell.range) {
            if (range.length > 0) {
                range += " or "
            }
            range += singleRange;
        }
    } else {
        range = spell.range;
    }

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
        let materialComponentsString = "";
        for (let component of spell.materialComponents) {
            if (materialComponentsString.length > 0) {
                if (component === spell.materialComponents[spell.materialComponents.length - 1]) {
                    materialComponentsString += " and ";
                } else {
                    materialComponentsString += ", ";
                }
            }
            materialComponentsString += component;
        }
        componentsString += materialComponentsString
        componentsString += ")";
    }

    let description = parseStringForBoldMarkup(spell.description);

    if (copyLinkToSpell) {
        copyLinkToSpell.onExecute = () => {
            copyToClipboard(spell, data);
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
    let buffAmount = undefined;
    let buffDescription = undefined;
    let debuffAmount = undefined;
    let debuffDescription = undefined;
    if (data) {
        spell.feature = data.feature;
        featureName = data.feature.name;

        if (data.freeUses !== undefined) {
            freeUses = data.freeUses;
        }
        if (data.castAtLevel) {
            castAtLevel = data.castAtLevel;
        }
        
        const spellCastingConditionAddendumString = calculateAddendumAspect(data.playerConfigs, "spellCastingConditionAddendum", { spell: spell });
        if (spellCastingConditionAddendumString) {
            spellCastingConditionAddendum = parseStringForBoldMarkup(spellCastingConditionAddendumString);
        }

        if (spell.challengeType === "attackRoll") {
            const attack = calculateSpellAttack(data.playerConfigs, spell, castAtLevel)
            attackRoll = attack.amount;
            if (attack.addendum) {
                attackRollAddendum = parseStringForBoldMarkup(attack.addendum);
            }
        }

        if (spell.challengeType === "savingThrow") {
            savingThrowType = spell.savingThrowType;

            const savingThrowCalc = calculateSpellSaveDC(data.playerConfigs, spell, castAtLevel);
            savingThrowDc = savingThrowCalc.dc;
            if (savingThrowCalc.addendum) {
                savingThrowDcAddendum = parseStringForBoldMarkup(savingThrowCalc.addendum);
            }
        }

        if (spell.type.includes("damage")) {
            damage = calculateOtherSpellAspect(data.playerConfigs, spell, castAtLevel, "damage", "spellDamageBonus");
            damage += " " + spell.damage.damageType;
        }

        if (spell.type.includes("buff")) {
            if (spell.buff.calcuation) {
                buffAmount = calculateOtherSpellAspect(data.playerConfigs, spell, castAtLevel, "buff", "buffBonus");
            }
            buffDescription = spell.buff.description;
        }

        if (spell.type.includes("debuff")) {
            if (spell.debuff.calcuation) {
                debuffAmount = calculateOtherSpellAspect(data.playerConfigs, spell, castAtLevel, "debuff", "debuffBonus");
            }
            debuffDescription = spell.debuff.description;
        }

        if (spell.type.includes("healing")) {
            healing = calculateOtherSpellAspect(data.playerConfigs, spell, castAtLevel, "healing", "healingBonus");
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
            <div><span className="spellPageBold">Duration:</span> {spell.duration}</div>
            <div className="spellPageDescription">{description}</div>
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
            <div className="spellPageDescription" style={{display: (buffDescription ? "block" : "none")}}>
                <div><b>Buff:</b> {(buffAmount ? buffAmount + " " : "")}{buffDescription}</div>
            </div>
            <div className="spellPageDescription" style={{display: (debuffDescription ? "block" : "none")}}>
                <div><b>Debuff:</b> {debuffAmount ? debuffAmount + " " : ""}{debuffDescription}</div>
            </div>
            <div className="spellPageDescription" style={{display: (data ? "block" : "none")}}>
                <div><b>Learned from:</b> {featureName}</div>
            </div>
            <div className="spellPageDescription" style={{display: (freeUses !== undefined ? "block" : "none")}}>
                <div><b>Free uses remaining:</b> {freeUses}</div>
            </div>
        </div>
    </>
}

function copyToClipboard(spell, data) {
    const stringifiedJson = JSON.stringify(data);
    navigator.clipboard.writeText(spell.name + "\n" + getHomePageUrl() + "?view=spell&name=" + encodeURIComponent(spell.name) + "&data=" + encodeURIComponent(stringifiedJson));
}