import React from "react";
import './ItemMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ItemPageComponent } from "../PageComponents/ItemPageComponent";
import { getValueFromObjectAndPath } from "../../SharedFunctions/ComponentFunctions";
import { UseOnSelfComponent } from "../SharedComponents/UseOnSelfComponent";
import { tryAddOwnActiveEffectOnSelf } from "../../SharedFunctions/ActiveEffectsFunctions";
import { TextInput } from "../SimpleComponents/TextInput";

export function ItemMenu({sessionId, playerConfigs, inputChangeHandler, setCenterScreenMenu, addToMenuStack, menuConfig, menuStateChangeHandler}) {

    let itemsProperty;
    if (menuConfig.pathToProperty === "") {
        itemsProperty = playerConfigs;
    } else {
        itemsProperty = getValueFromObjectAndPath(playerConfigs, menuConfig.pathToProperty);
    }

    const isConsumable = menuConfig.item.consumable;
    if (isConsumable && !menuConfig.newPlayerConfigs) {
        const newMenuConfig = menuStateChangeHandler(menuConfig, "newPlayerConfigs", playerConfigs);

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
            <UseOnSelfComponent newPlayerConfigs={playerConfigsClone} oldPlayerConfigs={playerConfigs} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UseOnSelfComponent>
        </>);
    }

    if (itemsProperty && menuConfig.showNotes) {
        const itemConfigIndex = itemsProperty.items.findIndex(x => x.name === menuConfig.item.name);
        if (itemConfigIndex > -1) {
            let pathToItemNotes = "";
            if (menuConfig.pathToProperty) {
                pathToItemNotes += menuConfig.pathToProperty + ".";
            }
            pathToItemNotes += "items[" + itemConfigIndex + "].notes";

            let displayConfigs = menuConfig.newPlayerConfigs ? {...menuConfig.newPlayerConfigs} : {...playerConfigs};
            userInteraction.push(<>
                <div className="itemMenuNotes">
                    <div>Notes</div>
                    <TextInput isNumberValue={false} isMultiline={true} baseStateObject={displayConfigs} pathToProperty={pathToItemNotes} inputHandler={(baseStateObject, pathToProperty, newValue) => {
                        const newMenuConfig = menuStateChangeHandler(menuConfig, "newPlayerConfigs", playerConfigs);
                        menuStateChangeHandler(newMenuConfig, "newPlayerConfigs." + pathToProperty, newValue);
                    }}></TextInput>
                </div>
            </>);
        }
    }

    const buttons = []
    buttons.push(<>
        <RetroButton text={isConsumable ? "Use" : "OK"} buttonSound={isConsumable ? "healaudio" : "selectionaudio"} onClickHandler={() => {
            if (playerConfigsClone) {
                if (isConsumable) {
                    tryAddOwnActiveEffectOnSelf(sessionId, playerConfigsClone, menuConfig, setCenterScreenMenu, () => {
                        inputChangeHandler(playerConfigs, "", playerConfigsClone);
                        setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                    });
                } else {
                    inputChangeHandler(playerConfigs, "", playerConfigsClone);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }
            } else {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }
        }} showTriangle={false} disabled={false}></RetroButton>
    </>);

    if (isConsumable) {
        buttons.push(<>
            <RetroButton text={"Close"} onClickHandler={() => {
                if (playerConfigsClone && menuConfig.showNotes && itemsProperty) {
                    const itemConfigIndex = itemsProperty.items.findIndex(x => x.name === menuConfig.item.name);
                    if (itemConfigIndex > -1) {
                        let pathToItemNotes = "";
                        if (menuConfig.pathToProperty) {
                            pathToItemNotes += menuConfig.pathToProperty + ".";
                        }
                        pathToItemNotes += "items[" + itemConfigIndex + "].notes";

                        const oldNotes = getValueFromObjectAndPath(playerConfigs, pathToItemNotes);
                        const newNotes = getValueFromObjectAndPath(playerConfigsClone, pathToItemNotes);

                        if (oldNotes !== newNotes) {
                            inputChangeHandler(playerConfigs, pathToItemNotes, newNotes);
                        }
                    }
                }

                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }} showTriangle={false} disabled={false}></RetroButton>
        </>);
    }

    return (<>
        <div className="itemMenuWrapperDiv">
            <ItemPageComponent item={menuConfig.item} playerConfigs={playerConfigs} data={{ additionalEffects: menuConfig.additionalEffects }} copyLinkToItem={menuConfig.copyLinkToItem} pathToProperty={menuConfig.pathToProperty} setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={() => { addToMenuStack({ menuType: "ItemMenu", menuConfig, menuTitle: menuConfig.item.name }); } }></ItemPageComponent>
        </div>
        <div style={{display: userInteraction.length > 0 ? "block" : "none"}} className="centerMenuSeperator"></div>
            {userInteraction}
        <div className="centerMenuSeperator"></div>
        <div className="itemMenuHorizontal">
            {buttons}
        </div>
    </>);
}