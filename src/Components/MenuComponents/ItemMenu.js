import React from "react";
import './ItemMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ItemPageComponent } from "../PageComponents/ItemPageComponent";
import { getValueFromObjectAndPath } from "../../SharedFunctions/ComponentFunctions";
import { UseOnSelfComponent } from "../SharedComponents/UseOnSelfComponent";
import { tryAddOwnActiveEffectOnSelf } from "../../SharedFunctions/ActiveEffectsFunctions";

export function ItemMenu({sessionId, playerConfigs, inputChangeHandler, setCenterScreenMenu, addToMenuStack, menuConfig, menuStateChangeHandler}) {

    const isConsumable = menuConfig.item.consumable;
    if (isConsumable && !menuConfig.newPlayerConfigs) {
        const newMenuConfig = menuStateChangeHandler(menuConfig, "newPlayerConfigs", playerConfigs);

        let itemsProperty;
        if (menuConfig.pathToProperty === "") {
            itemsProperty = playerConfigs;
        } else {
            itemsProperty = getValueFromObjectAndPath(playerConfigs, menuConfig.pathToProperty);
        }
        
        if (itemsProperty) {
            const itemConfigIndex = itemsProperty.items.findIndex(x => x.name === menuConfig.item.name);
            if (itemConfigIndex > -1) {
                const itemConfig = itemsProperty.items[itemConfigIndex];
                if (itemConfig) {
                    if (itemConfig.amount && itemConfig.amount > 1) {
                        let pathToItemAmount = "newPlayerConfigs.";
                        if (menuConfig.pathToProperty) {
                            pathToItemAmount += menuConfig.pathToProperty + ".";
                        }
                        pathToItemAmount += "items[" + itemConfigIndex + "].amount";

                        const newAmount = itemConfig.amount - 1;
                        menuStateChangeHandler(newMenuConfig, pathToItemAmount, newAmount);
                    } else {
                        let pathToItems = "newPlayerConfigs.";
                        if (menuConfig.pathToProperty) {
                            pathToItems += menuConfig.pathToProperty + ".";
                        }
                        pathToItems += "items";

                        const newItems = [...itemsProperty.items];
                        newItems.splice(itemConfigIndex, 1);
                        menuStateChangeHandler(newMenuConfig, pathToItems, newItems);
                    }
                }
            }
        }
    }

    const playerConfigsClone = menuConfig.newPlayerConfigs ? {...menuConfig.newPlayerConfigs} : undefined;
    if (playerConfigsClone) {
        playerConfigsClone.currentStatus = {...playerConfigsClone.currentStatus};
    }

    const userInteraction = [];

    if (menuConfig.item.consumeEffect && menuConfig.item.consumeEffect.type && (menuConfig.item.consumeEffect.type.includes("healing") || menuConfig.item.consumeEffect.type.includes("restore"))) {
        userInteraction.push(<>
            <div className="centerMenuSeperator"></div>
        </>);
    
        userInteraction.push(<>
            <UseOnSelfComponent newPlayerConfigs={playerConfigsClone} oldPlayerConfigs={playerConfigs} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UseOnSelfComponent>
        </>);
    }

    const buttons = []
    buttons.push(<>
        <RetroButton text={isConsumable ? "Use" : "OK"} buttonSound={playerConfigsClone ? "healaudio" : "selectionaudio"} onClickHandler={() => {
            if (playerConfigsClone) {
                tryAddOwnActiveEffectOnSelf(sessionId, playerConfigsClone, menuConfig, setCenterScreenMenu, () => {
                    inputChangeHandler(playerConfigs, "", playerConfigsClone);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                });
            } else {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }
        }} showTriangle={false} disabled={false}></RetroButton>
    </>);

    if (isConsumable) {
        buttons.push(<>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </>);
    }

    return (<>
        <div className="itemMenuWrapperDiv">
            <ItemPageComponent item={menuConfig.item} playerConfigs={playerConfigs} data={{ additionalEffects: menuConfig.additionalEffects }} copyLinkToItem={menuConfig.copyLinkToItem} pathToProperty={menuConfig.pathToProperty} setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={() => { addToMenuStack({ menuType: "ItemMenu", menuConfig, menuTitle: menuConfig.item.name }); } }></ItemPageComponent>
        </div>
            {userInteraction}
        <div className="centerMenuSeperator"></div>
        <div className="itemMenuHorizontal">
            {buttons}
        </div>
    </>);
}