import React from "react";
import './SpellPageComponent.css';
import { RetroButton } from "../SimpleComponents/RetroButton";

export function SpellPageComponent({spell}) {
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
                materialComponentsString += ", ";
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

    return <>
        <div className="spellPageContainer">
            <div>{spell.level ? "LVL " + spell.level : "Cantrip"} - {spell.school}</div>
            <div><span className="spellPageBold">Casting Time:</span> {castingTime}</div>
            <div><span className="spellPageBold">Range:</span> {range}</div>
            <div><span className="spellPageBold">Components:</span> {componentsString}</div>
            <div><span className="spellPageBold">Duration:</span> {spell.duration}</div>
            <RetroButton text={"Copy Link to Spell"} onClickHandler={() => copyToClipboard(spell)} showTriangle={false} disabled={false}></RetroButton>
            <div className="spellPageDescription">{description}</div>
        </div>
    </>
}

function copyToClipboard(spell) {
    navigator.clipboard.writeText(spell.name + "\n" + encodeURI(window.location.href + "?view=spell&name=" + spell.name));
}