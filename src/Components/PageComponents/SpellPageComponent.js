import React from "react";
import './SpellPageComponent.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { getCapitalizedAbilityScoreName } from "../../SharedFunctions/ComponentFunctions";

export function SpellPageComponent({spell, data}) {
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

    let description = []
    const descriptionWithoutMarkup = spell.description.split(/<b>|<\/b>/);
    for (let i = 0; i < descriptionWithoutMarkup.length; i++) {
        const phrase = descriptionWithoutMarkup[i];
        if (i % 2 == 1) {
            // Bold it!
            description.push(<><b>{phrase}</b></>);
        } else {
            // Don't bold it.
            description.push(<>{phrase}</>);
        }
    }

    // Get aspects from data
    let featureName = undefined;
    let freeUses = undefined;
    let attackRoll = undefined;
    let savingThrow = undefined;
    let damage = undefined;
    let healing = undefined;
    let buff = undefined;
    let debuff = undefined;
    if (data) {
        if (data.featureName) {
            featureName = data.featureName;
        }
        if (data.freeUses !== undefined) {
            freeUses = data.freeUses;
        }
        if (data.attackRoll) {
            attackRoll = data.attackRoll;
        }
        if (data.savingThrow) {
            savingThrow = data.savingThrow;
        }
        if (data.damage) {
            damage = data.damage;
        }
        if (data.healing) {
            healing = data.healing;
        }
        if (data.buff) {
            buff = data.buff;
        }
        if (data.debuff) {
            debuff = data.debuff;
        }
    }

    return <>
        <div className="spellPageContainer">
            <div>{spell.level ? "LVL " + spell.level : "Cantrip"} - {spell.school}</div>
            <div><span className="spellPageBold">Casting Time:</span> {castingTime}</div>
            <div><span className="spellPageBold">Range:</span> {range}</div>
            <div><span className="spellPageBold">Components:</span> {componentsString}</div>
            <div><span className="spellPageBold">Duration:</span> {spell.duration}</div>
            <div className="spellPageDescription">{description}</div>
            <br></br>
            <div className="spellPageDescription">
                <div><b>Spell Summary</b></div>
            </div>
            <div className="spellPageDescription" style={{display: (attackRoll ? "block" : "none")}}>
                <div>Attack Roll: <b>+{attackRoll}</b></div>
            </div>
            <div className="spellPageDescription" style={{display: (savingThrow ? "block" : "none")}}>
                <div><b>DC{savingThrow?.dc} {getCapitalizedAbilityScoreName(savingThrow?.type)}</b></div>
            </div>
            <div className="spellPageDescription" style={{display: (damage ? "block" : "none")}}>
                <div>Damage: <b>{damage}</b></div>
            </div>
            <div className="spellPageDescription" style={{display: (healing ? "block" : "none")}}>
                <div>Healing: <b>{healing}</b></div>
            </div>
            <div className="spellPageDescription" style={{display: (buff ? "block" : "none")}}>
                <div>Buff: <b>{(buff?.amount ? buff.amount + " " : "")}</b>{buff?.description}</div>
            </div>
            <div className="spellPageDescription" style={{display: (debuff ? "block" : "none")}}>
                <div>Debuff: <b>{debuff?.amount ? debuff.amount + " " : ""}</b>{debuff?.description}</div>
            </div>
            <div className="spellPageDescription" style={{display: (data ? "block" : "none")}}>
                <div>Learned from <b>{featureName}</b></div>
            </div>
            <div className="spellPageDescription" style={{display: (freeUses !== undefined ? "block" : "none")}}>
                <div>Free uses remaining: <b>{freeUses}</b></div>
            </div>
            <br></br>
            <div className="spellCopyButtonWrapper">
                <RetroButton text={"Copy Link to Spell"} onClickHandler={() => copyToClipboard(spell, data)} showTriangle={false} disabled={false}></RetroButton>
            </div>
            <br></br>
        </div>
    </>
}

function copyToClipboard(spell, data) {
    const stringifiedJson = JSON.stringify(data);
    const encodedData = btoa(stringifiedJson);
    navigator.clipboard.writeText(spell.name + "\n" + encodeURI(window.location.origin + "?view=spell&name=" + spell.name + "&data=" + encodedData));
}