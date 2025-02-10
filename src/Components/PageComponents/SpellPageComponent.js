import React from "react";
import './SpellPageComponent.css';

export function SpellPageComponent({spell}) {
    // @ts-ignore
    const descriptionRef = React.useRef();

    setTimeout(function () {
        if (descriptionRef.current) {
            descriptionRef.current.setHTMLUnsafe(spell.description);
        }
    }, 0);

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

    return <>
        <div className="spellPageContainer">
            <div className="spellPageSpellName">{spell.name}</div>
            <div>{spell.level ? "LVL " + spell.level : "Cantrip"} - {spell.school}</div>
            <div><span className="spellPageBold">Casting Time:</span> {castingTime}</div>
            <div><span className="spellPageBold">Range:</span> {range}</div>
            <div><span className="spellPageBold">Components:</span> {componentsString}</div>
            <div><span className="spellPageBold">Duration:</span> {spell.duration}</div>
            <div className="spellPageDescription" ref={descriptionRef}>Description Loading...</div>
        </div>
    </>
}

function stringToHTML(str) {

    var parser = new DOMParser();
    var doc = parser.parseFromString(str, 'text/html');
    return doc.body;

}