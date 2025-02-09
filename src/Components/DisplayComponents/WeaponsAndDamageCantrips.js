import React from 'react';
import './WeaponsAndDamageCantrips.css';
import { getCollection } from '../../Collections';
import { convertArrayToDictionary } from '../../SharedFunctions/Utils';
import { calculateAspectCollection, calculateProficiencyBonus, calculateWeaponAttackBonus, calculateWeaponDamage, performDiceRollCalculation } from '../../SharedFunctions/TabletopMathFunctions';

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
                const charismaModifier = calculateAspectCollection(playerConfigs, "charismaModifier");
                const proficencyBonus = calculateProficiencyBonus(playerConfigs);
                return "DC" + (8 + charismaModifier + proficencyBonus);
            } else {
                const charismaModifier = calculateAspectCollection(playerConfigs, "charismaModifier");
                const proficencyBonus = calculateProficiencyBonus(playerConfigs);
                const amount = charismaModifier + proficencyBonus;
                return (amount < 0 ? "" : "+") + amount;
            }
        }
    },
    {
        name: "Damage",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            const amount = calculateWeaponDamage(playerConfigs, weapon, isThrown);
            return amount;
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            let calculationString = performDiceRollCalculation(playerConfigs, dndCantrip.damage.calcuation);
            return calculationString;
        }
    },
    {
        name: "Range",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            if (weapon.weaponRange === "Ranged" || isThrown) {
                return weapon.range;
            } else {
                if (weapon.properties.includes("Reach")) {
                    return 10;
                } else {
                    return 5;
                }
            }
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            return dndCantrip.range;
        },
        addClass: "lastCol"
    }
];

export function WeaponsAndDamageCantrips({playerConfigs}) {
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
                    weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem)}</div>)
                }
            }
        }
    }

    // Check Cantrips
    const cantrips = getCollection("cantrips");
    for (let dndcantrip of cantrips) {
        if (dndcantrip.type.includes("damage")) {
            hasDamageCantrips = true;
            for (let row of rows) {
                weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateCantripValue(playerConfigs, dndcantrip)}</div>)
            }
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