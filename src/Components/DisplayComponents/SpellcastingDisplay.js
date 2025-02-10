import React from 'react';
import './SpellcastingDisplay.css';
import { getAllSpells } from '../../SharedFunctions/TabletopMathFunctions';
import { getCastingTimeShorthand } from '../../SharedFunctions/ComponentFunctions';

const spellRows = [
    {
        name: "LVL",
        calculateValue: (playerConfigs, spell) => {
            return spell.level ? spell.level : "C";
        },
        addClass: "firstCol"
    },
    {
        name: "Spell Name",
        calculateValue: (playerConfigs, spell) => {
            return spell.name;
        },
    },
    {
        name: "Cast Time",
        calculateValue: (playerConfigs, spell) => {
            let castingTime = "";
            if (Array.isArray(spell.castingTime)) {
                for (let singleCastingTime of spell.castingTime) {
                    // We skip Ritual in this view, because it's already on the next column.
                    if (singleCastingTime !== "Ritual") {
                        if (castingTime.length > 0) {
                            castingTime += " or ";
                        }
                        castingTime += getCastingTimeShorthand(singleCastingTime);
                    }
                }
            }
            return castingTime;
        },
    },
    {
        name: "C,R,M",
        calculateValue: (playerConfigs, spell) => {
            let specialString = "";

            if (spell.concentration) {
                specialString += "C"
            }

            if (Array.isArray(spell.castingTime) && spell.castingTime.includes("Ritual")) {
                if (specialString.length > 0) {
                    specialString += ",";
                }
                specialString += "R"
            }

            if (spell.components && spell.components.includes("M")) {
                if (specialString.length > 0) {
                    specialString += ",";
                }
                specialString += "M"
            }

            return specialString;
        },
    },
    {
        name: "Free Uses",
        calculateValue: (playerConfigs, spell) => {
            let freeUses = "";

            if (spell.freeUses && spell.freeUses > 0) {
                for (let i = 0; i < spell.freeUses; i++) {
                    freeUses += "O"
                }
            }

            return freeUses;
        },
        addClass: "lastCol"
    }
];

export function SpellcastingDisplay({playerConfigs, spellcastingFeatures}) {
    const allPlayerSpells = getAllSpells(spellcastingFeatures);

    // First get our top column.
    const spellcastingDisplayRows = [];
    for (let row of spellRows) {
        spellcastingDisplayRows.push(<div className={row.addClass}>{row.name}</div>)
    }

    for (let spell of allPlayerSpells) {
        for (let row of spellRows) {
            spellcastingDisplayRows.push(<div className={row.addClass ? "spellcastingDisplayRow " + row.addClass : "spellcastingDisplayRow"}>{row.calculateValue(playerConfigs, spell)}</div>)
        }
    }

    return (
        <>
            <div className='outerSpellcastingDisplay pixel-corners'>
                <div className='spellcastingDisplayTitle'>Spells</div>
                <div className='spellcastingDisplayGrid'>{spellcastingDisplayRows}</div>
            </div>
        </>
    )
}