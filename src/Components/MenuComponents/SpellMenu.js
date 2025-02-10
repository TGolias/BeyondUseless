import React from "react";
import './SpellMenu.css';
import { SpellPageComponent } from "../PageComponents/SpellPageComponent";
import { calculateOtherSpellAspect, calculateSpellAttack, calculateSpellSaveDC } from "../../SharedFunctions/TabletopMathFunctions";

export function SpellMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {

    const data = {};
    data.featureName = menuConfig.spell.feature.name;

    if (menuConfig.spell.freeUses) {
        data.freeUses = menuConfig.spell.freeUses;
    }

    if (menuConfig.spell.challengeType === "attackRoll") {
        data.attackRoll = calculateSpellAttack(playerConfigs, menuConfig.spell)
    }

    if (menuConfig.spell.challengeType === "savingThrow") {
        data.savingThrow = {};
        data.savingThrow.type = menuConfig.spell.savingThrowType;
        data.savingThrow.dc = calculateSpellSaveDC(playerConfigs, menuConfig.spell);
    }

    if (menuConfig.spell.type.includes("damage")) {
        data.damage = calculateOtherSpellAspect(playerConfigs, menuConfig.spell, "damage", "spellDamageBonus");
        data.damage += " " + menuConfig.spell.damage.damageType;
    }

    if (menuConfig.spell.type.includes("buff")) {
        data.buff = {}
        if (menuConfig.spell.buff.calcuation) {
            data.buff.amount = calculateOtherSpellAspect(playerConfigs, menuConfig.spell, "buff", "buffBonus");
        }
        data.buff.description = menuConfig.spell.buff.description;
    }

    if (menuConfig.spell.type.includes("debuff")) {
        data.debuff = {}
        if (menuConfig.spell.debuff.calcuation) {
            data.debuff.amount = calculateOtherSpellAspect(playerConfigs, menuConfig.spell, "debuff", "debuffBonus");
        }
        data.debuff.description = menuConfig.spell.debuff.description;
    }

    if (menuConfig.spell.type.includes("healing")) {
        data.healing = calculateOtherSpellAspect(playerConfigs, menuConfig.spell, "healing", "healingBonus");
    }

    return (<>
        <div className="spellMenuWrapperDiv">
            <SpellPageComponent spell={menuConfig.spell} data={data}></SpellPageComponent>
        </div>
    </>);
}