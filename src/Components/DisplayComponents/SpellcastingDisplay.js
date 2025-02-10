import React from 'react';
import './SpellcastingDisplay.css';
import { getCollection } from '../../Collections';
import { convertArrayToDictionary } from '../../SharedFunctions/Utils';
import { calculateAspectCollection, calculateBaseStat, calculateModifierForBaseStat, performMathCalculation } from '../../SharedFunctions/TabletopMathFunctions';
import { getCapitalizedAbilityScoreName } from '../../SharedFunctions/ComponentFunctions';

const spellRows = [
    {
        name: "LVL",
        calculateValue: (playerConfigs, spell, spellcastingAbility) => {
            return spell.level ? spell.level : "C";
        },
        addClass: "firstCol"
    },
    {
        name: "Spell Name",
        calculateValue: (playerConfigs, spell, spellcastingAbility) => {
            return spell.name;
        },
    },
    {
        name: "Cast Time",
        calculateValue: (playerConfigs, spell, spellcastingAbility) => {
            let castingTime = "";
            if (Array.isArray(spell.castingTime)) {
                for (let singleCastingTime of spell.castingTime) {
                    if (castingTime.length > 0) {
                        castingTime += ",\n";
                    }
                    castingTime += singleCastingTime
                }
            }
            return castingTime;
        },
    },
    {
        name: "C,R,M",
        calculateValue: (playerConfigs, spell, spellcastingAbility) => {
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
        addClass: "lastCol"
    },
];

export function SpellcastingDisplay({playerConfigs, spellcastingFeatures}) {
    // Get all spells and cantrips built into dictionaries for instant lookup.
    let allCantrips = getCollection("cantrips");
    const cantripName2Cantrip = convertArrayToDictionary(allCantrips, "name");
    let allSpells = getCollection("spells");
    const spellName2Spell = convertArrayToDictionary(allSpells, "name");

    // Get each of the features with the same spellcasting modifiers together.
    const spellcastingAbility2Features = {}
    for (let spellcastingFeature of spellcastingFeatures) {
        const spellcastingAbility = performMathCalculation(playerConfigs, spellcastingFeature.feature.spellcasting.ability.calcuation);
        if (spellcastingAbility2Features[spellcastingAbility]) {
            spellcastingAbility2Features[spellcastingAbility].push(spellcastingFeature);
        } else {
            spellcastingAbility2Features[spellcastingAbility] = [spellcastingFeature];
        }
    }

    // Get all of the spells from each feature.
    const spellcastingAbility2Spells = {}
    for (let spellcastingAbility of Object.keys(spellcastingAbility2Features)) {
        const spellcastingFeatures = spellcastingAbility2Features[spellcastingAbility];
        const sortedCantripsCollection = [];
        const sortedSpellsCollection = [];
        for (let spellcastingFeature of spellcastingFeatures) {
            const spellcasting = spellcastingFeature.feature.spellcasting;
            if (spellcasting.cantripsKnown) {
                if (spellcasting.cantripsKnown.predeterminedSelections && spellcasting.cantripsKnown.predeterminedSelections.length > 0) {
                    for (let predeterminedSelection of spellcasting.cantripsKnown.predeterminedSelections) {
                        const cantripToAdd = cantripName2Cantrip[predeterminedSelection.spellName];
                        addSpellToSortedCollection(sortedCantripsCollection, cantripToAdd);
                    }
                }

                const featurePropertyName = spellcastingFeature.feature.name.replace(/\s/g, "") + (spellcastingFeature.feature.level ?? spellcastingFeature.feature.classLevel);
                const userInputForSpells = spellcastingFeature.playerConfigForObject.features ? spellcastingFeature.playerConfigForObject.features[featurePropertyName] : undefined;
                if (userInputForSpells && userInputForSpells.cantrips) {
                    for (let cantripName of userInputForSpells.cantrips) {
                        const cantripToAdd = cantripName2Cantrip[cantripName];
                        addSpellToSortedCollection(sortedCantripsCollection, cantripToAdd);
                    }
                }
            }

            if (spellcasting.spellsKnown) {
                if (spellcasting.spellsKnown.predeterminedSelections && spellcasting.spellsKnown.predeterminedSelections.length > 0) {
                    for (let predeterminedSelection of spellcasting.spellsKnown.predeterminedSelections) {
                        const spellToAdd = spellName2Spell[predeterminedSelection.spellName];
                        addSpellToSortedCollection(sortedSpellsCollection, spellToAdd);
                    }
                }

                const featurePropertyName = spellcastingFeature.feature.name.replace(/\s/g, "") + (spellcastingFeature.feature.level ?? spellcastingFeature.feature.classLevel);
                const userInputForSpells = spellcastingFeature.playerConfigForObject.features ? spellcastingFeature.playerConfigForObject.features[featurePropertyName] : undefined;
                if (userInputForSpells && userInputForSpells.spells) {
                    for (let cantripName of userInputForSpells.spells) {
                        const spellToAdd = spellName2Spell[cantripName];
                        addSpellToSortedCollection(sortedSpellsCollection, spellToAdd);
                    }
                }
            }
        }

        spellcastingAbility2Spells[spellcastingAbility] = sortedCantripsCollection.concat(sortedSpellsCollection);
    }

    const allSpellCastingAbilitySections = []
    for (let spellcastingAbility of Object.keys(spellcastingAbility2Spells)) {
        // First get our top column.
        const spellcastingDisplayRows = [];
        for (let row of spellRows) {
            spellcastingDisplayRows.push(<div className={row.addClass}>{row.name}</div>)
        }

        const allSpellsForAbility = spellcastingAbility2Spells[spellcastingAbility];
        for (let spell of allSpellsForAbility) {
            for (let row of spellRows) {
                spellcastingDisplayRows.push(<div className={row.addClass ? "spellcastingDisplayRow " + row.addClass : "spellcastingDisplayRow"}>{row.calculateValue(playerConfigs, spell, spellcastingAbility)}</div>)
            }
        }

        const spellcastingAbilityName = getCapitalizedAbilityScoreName(spellcastingAbility);
        const spellcastingAbilityScore = calculateModifierForBaseStat(calculateBaseStat(playerConfigs, spellcastingAbility));

        allSpellCastingAbilitySections.push(<>
            <div className='outerSpellcastingDisplay pixel-corners'>
                <div className='spellcastingDisplayTitle'>Spells - {spellcastingAbilityName}</div>
                <div className='spellcastingDisplayGrid'>{spellcastingDisplayRows}</div>
                <div className='spellcastingDisplayMidTitle'>Spellcasting</div>
                <div className='spellcastingDisplayGrid spellcastingInfo'>
                    <div className="firstCol">Ability</div>
                    <div className="spellcastingInfoRow lastCol">{spellcastingAbilityName}</div>
                    <div className="firstCol">Modifier</div>
                    <div className="spellcastingInfoRow lastCol">{spellcastingAbilityScore < 0 ? spellcastingAbilityScore : "+" + spellcastingAbilityScore}</div>
                    <div className="firstCol">Spell DC</div>
                    <div className="spellcastingInfoRow lastCol">DC</div>
                    <div className="firstCol">Spell Atk</div>
                    <div className="spellcastingInfoRow lastCol">+</div>
                </div>
            </div>
        </>)
    }

    return (
        <>
            <div className="outermostSpellcastingDisplay">{allSpellCastingAbilitySections}</div>
        </>
    )
}

function addSpellToSortedCollection(sortedSpellsCollection, spellToAdd) {
    let insertAtIndex = -1;
    for (let i = 0; i < sortedSpellsCollection.length; i++) {
        const spellInIndex = sortedSpellsCollection[i];
        if (spellToAdd.level !== spellInIndex.level) {
            if (spellToAdd.level < spellInIndex.level) {
                insertAtIndex = i;
                break;
            } else {
                // Keep going, our level is too low.
                continue;
            }
        }

        if (spellToAdd.name.localeCompare(spellInIndex.name) <= 0) {
            insertAtIndex = i;
            break;
        }
    }

    if (insertAtIndex === -1) {
        sortedSpellsCollection.push(spellToAdd);
    } else {
        sortedSpellsCollection.splice(insertAtIndex, 0, spellToAdd);
    }
}