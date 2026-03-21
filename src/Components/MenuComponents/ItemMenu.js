import React from "react";
import './ItemMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ItemPageComponent } from "../PageComponents/ItemPageComponent";
import { getValueFromObjectAndPath } from "../../SharedFunctions/ComponentFunctions";
import { UseOnSelfComponent } from "../SharedComponents/UseOnSelfComponent";
import { tryAddOwnActiveEffectOnSelf } from "../../SharedFunctions/ActiveEffectsFunctions";
import { TextInput } from "../SimpleComponents/TextInput";
import { calculateAspectCollection } from "../../SharedFunctions/TabletopMathFunctions";

export function ItemMenu({sessionId, playerConfigs, inputChangeHandler, setCenterScreenMenu, addToMenuStack, menuConfig, menuStateChangeHandler}) {

    let itemsProperty;
    if (menuConfig.pathToProperty === "") {
        itemsProperty = playerConfigs;
    } else {
        itemsProperty = getValueFromObjectAndPath(playerConfigs, menuConfig.pathToProperty);
    }

    const isConsumable = menuConfig.item.consumable;
    const isReloadableFirearm = menuConfig.item.tags && menuConfig.item.properties && menuConfig.item.tags.includes("Firearm") && menuConfig.item.properties.find(prop => prop.startsWith('Reload '));
    if (isConsumable && !menuConfig.newPlayerConfigs) {
        const newMenuConfig = menuStateChangeHandler(menuConfig, "newPlayerConfigs", playerConfigs);

        if (itemsProperty) {
            const itemConfig = itemsProperty.items[menuConfig.itemIndex];
            if (itemConfig) {
                if (itemConfig.amount && itemConfig.amount > 1) {
                    let pathToItemAmount = "newPlayerConfigs.";
                    if (menuConfig.pathToProperty) {
                        pathToItemAmount += menuConfig.pathToProperty + ".";
                    }
                    pathToItemAmount += "items[" + menuConfig.itemIndex + "].amount";

                    const newAmount = itemConfig.amount - 1;
                    menuStateChangeHandler(newMenuConfig, pathToItemAmount, newAmount);
                } else {
                    let pathToItems = "newPlayerConfigs.";
                    if (menuConfig.pathToProperty) {
                        pathToItems += menuConfig.pathToProperty + ".";
                    }
                    pathToItems += "items";

                    const newItems = [...itemsProperty.items];
                    newItems.splice(menuConfig.itemIndex, 1);
                    menuStateChangeHandler(newMenuConfig, pathToItems, newItems);
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

    let pathToBullets = "";
    let currentBullets = [];
    if (itemsProperty && isReloadableFirearm) {
        if (menuConfig.pathToProperty) {
            pathToBullets += menuConfig.pathToProperty + ".";
        }
        pathToBullets += "items[" + menuConfig.itemIndex + "].bullets";

        const reloadProperty = menuConfig.item.properties ? menuConfig.item.properties.find(prop => prop.startsWith('Reload ')) : undefined;
        if (reloadProperty) {
            const reloadAmountString = reloadProperty.substring(7);
            const reloadAmount = parseInt(reloadAmountString);
            if (reloadAmount > 0) {
                const displayConfigs = menuConfig.newPlayerConfigs ? {...menuConfig.newPlayerConfigs} : {...playerConfigs};
                currentBullets = getValueFromObjectAndPath(displayConfigs, pathToBullets) ?? [];

                const bulletButtons = [];
                bulletButtons.push(<>
                    <RetroButton text={"Load"} buttonSound={"selectionaudio"} onClickHandler={() => {
                        const newBullets = [...currentBullets];
                        newBullets.unshift(
                            { 
                                type: "ammo",
                                color: "#ffca00"
                            }
                        );

                        const newMenuConfig = menuStateChangeHandler(menuConfig, "newPlayerConfigs", displayConfigs);
                        menuStateChangeHandler(newMenuConfig, "newPlayerConfigs." + pathToBullets, newBullets);
                    }} showTriangle={false} disabled={currentBullets.length >= reloadAmount}></RetroButton>
                </>);

                const additionalBulletTypes = calculateAspectCollection(playerConfigs, "additionalBulletTypes");
                if (additionalBulletTypes && additionalBulletTypes.length) {
                    for (const additionalBulletType of additionalBulletTypes) {
                        bulletButtons.push(<>
                            <RetroButton text={additionalBulletType.name} buttonSound={"selectionaudio"} onClickHandler={() => {
                                const newBullets = [...currentBullets];
                                newBullets.unshift(
                                    { 
                                        type: additionalBulletType.type,
                                        color: additionalBulletType.color
                                    }
                                );

                                const newMenuConfig = menuStateChangeHandler(menuConfig, "newPlayerConfigs", displayConfigs);
                                menuStateChangeHandler(newMenuConfig, "newPlayerConfigs." + pathToBullets, newBullets);
                            }} showTriangle={false} disabled={currentBullets.length >= reloadAmount}></RetroButton>
                        </>);
                    }
                }

                bulletButtons.push(<>
                    <RetroButton text={"Eject"} buttonSound={"selectionaudio"} onClickHandler={() => {
                        const newBullets = [...currentBullets];
                        newBullets.shift();

                        const newMenuConfig = menuStateChangeHandler(menuConfig, "newPlayerConfigs", displayConfigs);
                        menuStateChangeHandler(newMenuConfig, "newPlayerConfigs." + pathToBullets, newBullets);
                    }} showTriangle={false} disabled={currentBullets.length <= 0}></RetroButton>
                </>);
                

                userInteraction.push(<>
                    <div className="itemMenuReload">{bulletButtons}</div>
                </>);
            }
        }
    }

    if (itemsProperty && menuConfig.showNotes) {
        let pathToItemNotes = "";
        if (menuConfig.pathToProperty) {
            pathToItemNotes += menuConfig.pathToProperty + ".";
        }
        pathToItemNotes += "items[" + menuConfig.itemIndex + "].notes";

        const displayConfigs = menuConfig.newPlayerConfigs ? {...menuConfig.newPlayerConfigs} : {...playerConfigs};
        userInteraction.push(<>
            <div className="itemMenuNotes">
                <div>Notes</div>
                <TextInput isNumberValue={false} isMultiline={true} baseStateObject={displayConfigs} pathToProperty={pathToItemNotes} inputHandler={(baseStateObject, pathToProperty, newValue) => {
                    const newMenuConfig = menuStateChangeHandler(menuConfig, "newPlayerConfigs", displayConfigs);
                    menuStateChangeHandler(newMenuConfig, "newPlayerConfigs." + pathToProperty, newValue);
                }}></TextInput>
            </div>
        </>);
    }

    const buttons = []

    if (isConsumable) {
        buttons.push(<>
            <RetroButton text={"Use"} buttonSound={"healaudio"} onClickHandler={() => {
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
    } else if (isReloadableFirearm) {
        const hasBulletSelection = menuConfig.item.properties.includes("Bullet-Selection");
        
        buttons.push(<>
            <RetroButton text={"Fire"} buttonSound={"gunaudio"} onClickHandler={() => {
                const newBullets = [...currentBullets];
                
                const indexToRemove = currentBullets.findIndex(x => x.type === "ammo");
                newBullets.splice(indexToRemove, 1);

                if (playerConfigsClone) {
                    const newPlayerConfigsClone = menuStateChangeHandler(playerConfigsClone, pathToBullets, newBullets);

                    inputChangeHandler(playerConfigs, "", newPlayerConfigsClone);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                } else {
                    const newPlayerConfigs = menuStateChangeHandler(playerConfigs, pathToBullets, newBullets);

                    inputChangeHandler(playerConfigs, "", newPlayerConfigs);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }
            }} showTriangle={false} disabled={hasBulletSelection ? !currentBullets.some(x => x.type === "ammo") : (currentBullets.length === 0 || currentBullets[0].type !== "ammo")}></RetroButton>
        </>);
    } else {
        buttons.push(<>
            <RetroButton text={"OK"} buttonSound={"selectionaudio"} onClickHandler={() => {
                if (playerConfigsClone) {
                    inputChangeHandler(playerConfigs, "", playerConfigsClone);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                } else {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }
            }} showTriangle={false} disabled={false}></RetroButton>
        </>);
    }

    if (isConsumable || isReloadableFirearm) {
        buttons.push(<>
            <RetroButton text={"Close"} onClickHandler={() => {
                if (playerConfigsClone) {
                    let pathToItem = "";
                    if (menuConfig.pathToProperty) {
                        pathToItem += menuConfig.pathToProperty + ".";
                    }
                    pathToItem += "items[" + menuConfig.itemIndex + "]";

                    if (menuConfig.showNotes) {
                        const pathToItemNotes = pathToItem + ".notes";

                        const oldNotes = getValueFromObjectAndPath(playerConfigs, pathToItemNotes);
                        const newNotes = getValueFromObjectAndPath(playerConfigsClone, pathToItemNotes);

                        if (oldNotes !== newNotes) {
                            inputChangeHandler(playerConfigs, pathToItemNotes, newNotes);
                        }
                    }

                    if (isReloadableFirearm) {
                        const pathToItemBullets = pathToItem + ".bullets";

                        const oldBullets = getValueFromObjectAndPath(playerConfigs, pathToItemBullets);
                        const newBullets = getValueFromObjectAndPath(playerConfigsClone, pathToItemBullets);

                        if (oldBullets !== newBullets) {
                            inputChangeHandler(playerConfigs, pathToItemBullets, newBullets);
                        }
                    }
                }

                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }} showTriangle={false} disabled={false}></RetroButton>
        </>);
    }

    return (<>
        <div className="itemMenuWrapperDiv">
            <ItemPageComponent item={menuConfig.item} itemIndex={menuConfig.itemIndex} playerConfigs={playerConfigsClone ?? playerConfigs} data={{ additionalEffects: menuConfig.additionalEffects }} copyLinkToItem={menuConfig.copyLinkToItem} pathToProperty={menuConfig.pathToProperty} setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={() => { addToMenuStack({ menuType: "ItemMenu", menuConfig, menuTitle: menuConfig.item.name }); } }></ItemPageComponent>
        </div>
        <div style={{display: userInteraction.length > 0 ? "block" : "none"}} className="centerMenuSeperator"></div>
            {userInteraction}
        <div className="centerMenuSeperator"></div>
        <div className="itemMenuHorizontal">
            {buttons}
        </div>
    </>);
}