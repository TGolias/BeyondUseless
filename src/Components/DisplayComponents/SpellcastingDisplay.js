import React from 'react';
import './SpellcastingDisplay.css';
import { getAllSpells } from '../../SharedFunctions/TabletopMathFunctions';
import { getCastingTimeShorthand } from '../../SharedFunctions/ComponentFunctions';
import { playAudio } from '../../SharedFunctions/Utils';
import { isPlayerCurrentlyConcentrating } from '../../SharedFunctions/ConcentrationFunctions';

const spellRows = [
    {
        name: "LVL",
        calculateValue: (playerConfigs, spell) => {
            return spell.level ? spell.level : "C";
        },
        addClass: (playerConfigs, spell) => {
            return "firstCol";
        }
    },
    {
        name: "Spell Name",
        calculateValue: (playerConfigs, spell) => {
            return spell.name;
        },
        addClass: (playerConfigs, spell) => {
            if (playerConfigs && spell) {
                if (isPlayerCurrentlyConcentrating(playerConfigs) && spell.concentration) {
                    return "spellcastingDisplayConcentratingOn";
                }
            }
            return "";
        }
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
        addClass: (playerConfigs, spell) => {
            return undefined;
        }
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
        addClass: (playerConfigs, spell) => {
            return undefined;
        }
    },
    {
        name: "Free Uses",
        calculateValue: (playerConfigs, spell) => {
            let freeUses = "";

            let freeUsesUsed = 0;
            if (playerConfigs.currentStatus && playerConfigs.currentStatus.remainingFreeSpellUses && playerConfigs.currentStatus.remainingFreeSpellUses[spell.name] !== undefined) {
                const remainingFreeUses = playerConfigs.currentStatus.remainingFreeSpellUses[spell.name];
                freeUsesUsed = spell.freeUses - remainingFreeUses;
            } 

            if (spell.freeUses && spell.freeUses > 0) {
                for (let i = 0; i < spell.freeUses; i++) {
                    if (i < freeUsesUsed) {
                        freeUses += "X"
                    } else {
                        freeUses += "O"
                    }
                    
                }
            }

            return freeUses;
        },
        addClass: (playerConfigs, spell) => {
            return "lastCol spellcastingDisplayFreeUses";
        }
    }
];

export function SpellcastingDisplay({playerConfigs, spellcastingFeatures, setCenterScreenMenu}) {
    const allPlayerSpells = getAllSpells(spellcastingFeatures);

    // First get our top column.
    const spellcastingDisplayRows = [];
    for (let row of spellRows) {
        spellcastingDisplayRows.push(<div className={row.addClass()}>{row.name}</div>)
    }

    for (let spell of allPlayerSpells) {
        for (let row of spellRows) {
            spellcastingDisplayRows.push(<div onClick={() => openMenuForSpell(playerConfigs, spell, setCenterScreenMenu)} className={row.addClass(playerConfigs, spell) ? "spellcastingDisplayRow " + row.addClass(playerConfigs, spell) : "spellcastingDisplayRow"}>{row.calculateValue(playerConfigs, spell)}</div>)
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

function openMenuForSpell(playerConfigs, spell, setCenterScreenMenu) {
    playAudio("menuaudio");
    const currentEffectWithConcentration = isPlayerCurrentlyConcentrating(playerConfigs);
    if (currentEffectWithConcentration && spell.concentration) {
        setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
            menuTitle: "Concentration", 
            menuText: "Casting <b>" + spell.name + "</b> with concentration will end concentration on <b>" + currentEffectWithConcentration.name + "</b>.", 
            buttons: [
            {
                text: "Continue",
                onClick: () => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                    openSpellMenu(spell, setCenterScreenMenu);
                }
            },
            {
                text: "Cancel",
                onClick: () => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }
            }
        ] } });
    } else {
        openSpellMenu(spell, setCenterScreenMenu);
    }
}

function openSpellMenu(spell, setCenterScreenMenu) {
    setCenterScreenMenu({ show: true, menuType: "SpellMenu", data: { menuTitle: spell.name, spell: spell } });
}
