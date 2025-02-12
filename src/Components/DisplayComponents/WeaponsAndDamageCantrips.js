import React from 'react';
import './WeaponsAndDamageCantrips.css';
import { getCollection } from '../../Collections';
import { convertArrayToDictionary, playAudio } from '../../SharedFunctions/Utils';
import { calculateAspectCollection, calculateOtherSpellAspect, calculateProficiencyBonus, calculateSpellAttack, calculateSpellSaveDC, calculateWeaponAttackBonus, calculateWeaponDamage, getAllSpellcastingFeatures, getAllSpells, performDiceRollCalculation, performMathCalculation } from '../../SharedFunctions/TabletopMathFunctions';

const rows = [
    {
        name: "Name",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            return weapon.name + (isThrown ? " (Thrown)" : "")
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            return dndCantrip.name;
        },
        addClass: "firstCol"
    },
    {
        name: "Atk/DC",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            const amount = calculateWeaponAttackBonus(playerConfigs, weapon, isThrown);
            return (amount < 0 ? "" : "+") + amount;
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            if (dndCantrip.challengeType === "savingThrow") {
                const spellSaveDC = calculateSpellSaveDC(playerConfigs, dndCantrip, 0);
                return "DC" + spellSaveDC;
            } else {
                const spellAttack = calculateSpellAttack(playerConfigs, dndCantrip, 0);
                return (spellAttack.length === 0 || spellAttack.startsWith("-") ? "" : "+") + spellAttack;
            }
        }
    },
    {
        name: "Damage",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            let amount = calculateWeaponDamage(playerConfigs, weapon, isThrown);
            amount += " " + weapon.damage.damageType;
            return amount;
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            let amount = calculateOtherSpellAspect(playerConfigs, dndCantrip, 0, "damage", "spellDamageBonus");
            amount += " " + dndCantrip.damage.damageType;
            return amount;
        },
        addClass: "lastCol"
    },
];

export function WeaponsAndDamageCantrips({playerConfigs, setCenterScreenMenu}) {
    const items = getCollection("items");
    const itemName2Item = convertArrayToDictionary(items, "name");

    let hasWeapons = false;
    let hasDamageCantrips = false;

    const weaponOrDamageCantripRows = [];
    for (let row of rows) {
        weaponOrDamageCantripRows.push(<div className={row.addClass}>{row.name}</div>)
    }

    // Check weapons
    for (let item of playerConfigs.items) {
        if (item.equipped) {
            let itemName = item.name;
            let dndItem = itemName2Item[item.name];
            while (dndItem.type === "Template") {
                itemName = dndItem.templateOf;
                dndItem = {...itemName2Item[itemName]};
                dndItem.name = item.name;
            }
            if (dndItem.type === "Weapon") {
                hasWeapons = true;

                for (let row of rows) {
                    weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem, false)}</div>)
                }

                if (dndItem.properties && dndItem.properties.includes("Thrown") && dndItem.weaponRange == "Melee") {
                    // Do calculations for the weapon thrown as well.
                    for (let row of rows) {
                        weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem, true)}</div>)
                    }
                }
            }
        }
    }

    // Check Cantrips
    const spellcastingFeatures = getAllSpellcastingFeatures(playerConfigs);
    const allPlayerSpells = getAllSpells(spellcastingFeatures);
    for (let spell of allPlayerSpells) {
        if (!spell.level) {
            hasDamageCantrips = pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, spell, setCenterScreenMenu) || hasDamageCantrips;
        }
    }

    return (
        <>
            <div className='outerWeaponOrDamageCantrip pixel-corners'>
                <div className='weaponOrDamageCantripTitle'>{hasWeapons && !hasDamageCantrips ? "Weapons" : (!hasWeapons && hasDamageCantrips ? "Damage Cantrips" : (!hasWeapons && !hasDamageCantrips ? "No Weapons + Damage Cantrips" : "Weapons + Damage Cantrips"))}</div>
                <div style={{display: (hasWeapons || hasDamageCantrips ? "grid" : "none")}} className='weaponOrDamageCantripGrid'>{weaponOrDamageCantripRows}</div>
            </div>
        </>
    )
}

function pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, dndcantrip, setCenterScreenMenu) {
    if (dndcantrip.type.includes("damage")) {
        for (let row of rows) {
            weaponOrDamageCantripRows.push(<div onClick={() => openMenuForSpell(dndcantrip, setCenterScreenMenu)} className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateCantripValue(playerConfigs, dndcantrip)}</div>)
        }
        return true;
    }
    return false;
}

function openMenuForSpell(dndcantrip, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "SpellMenu", data: { menuTitle: dndcantrip.name, spell: dndcantrip } });
}