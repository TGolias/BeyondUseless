import React from "react";
import './ItemMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ItemPageComponent } from "../PageComponents/ItemPageComponent";
import { calculateAddendumAspect, calculateWeaponAttackBonus, calculateWeaponDamage } from "../../SharedFunctions/TabletopMathFunctions";

export function ItemMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const data = {};

    const itemDescriptionAddendum = calculateAddendumAspect(playerConfigs, "itemDescriptionAddendum", { item: menuConfig.item });
    if (itemDescriptionAddendum) {
        data.itemDescriptionAddendum = itemDescriptionAddendum;
    }
    
    switch (menuConfig.item.type) {
        case "Weapon":
            // Weapons that are "Ranged" and "Thrown" are thrown only. That is the only group that we do not do the non-thrown calculation for.
            if (!(menuConfig.item.weaponRange == "Ranged" && menuConfig.item.properties.includes("Thrown"))) {
                const attack = calculateWeaponAttackBonus(playerConfigs, menuConfig.item, false);
                data.weaponAttack = attack.amount;
                if (attack.addendum) {
                    data.weaponAttackAddendum = attack.addendum;
                }

                data.weaponDamage = calculateWeaponDamage(playerConfigs, menuConfig.item, false);
                data.weaponDamage += " " + menuConfig.item.damage.damageType;
            }

            // If the Weapon is thrown, we do a different calculation for it because the numbers could come out differently based on Fighting Style and other aspects.
            if (menuConfig.item.properties.includes("Thrown")) {
                const attack = calculateWeaponAttackBonus(playerConfigs, menuConfig.item, true);
                data.weaponAttackThrown = attack.amount;
                if (attack.addendum) {
                    data.weaponAttackThrownAddendum = attack.addendum;
                }

                data.weaponDamageThrown = calculateWeaponDamage(playerConfigs, menuConfig.item, true);
                data.weaponDamageThrown += " " + menuConfig.item.damage.damageType;
            }
            break;
    }

    return (<>
        <div className="itemMenuWrapperDiv">
            <ItemPageComponent item={menuConfig.item} data={data} copyLinkToItem={menuConfig.copyLinkToItem}></ItemPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="itemMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}