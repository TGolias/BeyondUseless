import React from "react";
import './HPandLVLDisplay.css';
import { calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";
import { playAudio } from "../../SharedFunctions/Utils";
import { CheckIfPlayerDead, SetPlayerRevived } from "../../SharedFunctions/DeathFunctions";
import { calculateCurrentHp } from "../../SharedFunctions/HPFunctions";

export function HPandLVLDisplay({playerConfigs, inputChangeHandler = undefined, setCenterScreenMenu = undefined, playLowHpAudio}) {
    const level = playerConfigs.level;
    const hpMax = calculateHPMax(playerConfigs);
    const currentHp = calculateCurrentHp(playerConfigs, hpMax);
    const tempHp = playerConfigs.currentStatus.tempHp ?? 0;

    const percentHpRemaining = currentHp > hpMax ? 100 : (currentHp / hpMax) * 100;

    const percentTempHp = tempHp > hpMax ? 100 : (tempHp / hpMax) * 100;

    const isDead = CheckIfPlayerDead(playerConfigs);

    controlLowHpSound(playLowHpAudio, percentHpRemaining);

    return <>
        <div className="hp-corners" onClick={() => {
            if (setCenterScreenMenu) {
                playAudio("menuaudio");
                if (isDead) {
                    if (inputChangeHandler) {
                        showReviveMenu(playerConfigs, inputChangeHandler, setCenterScreenMenu);
                    }
                    
                } else {
                    setCenterScreenMenu({ show: true, menuType: "HealthMenu", data: undefined });
                }
            }
        }}>
            <div className={"healthWrapper"}>
                <div className={isDead ? "leveltextbold" : ""}>{isDead ? "DEAD" : "LVL" + level}</div>
                <div className="healthBar">
                    <div>HP:</div>
                    <div className="healthBarValue hp-bar-corners">
                        <div className={"healthBarFill" + (percentHpRemaining <= 50 ? (percentHpRemaining <= 20 ? " healthBarCritical" : " healthBarBloodied") : "")} style={{width: (percentHpRemaining + "%")}}></div>
                        <div className={"tempHp"} style={{width: (percentTempHp + "%")}}></div>
                    </div>
                </div>
                <div>{currentHp}{tempHp > 0 ? "(+" + tempHp + ")" : ""} / {hpMax}</div>
            </div>
        </div>
    </>
}

function controlLowHpSound(playLowHpAudio, percentHpRemaining) {
    const lowHpAudio = document.getElementById("lowhpaudio");
    if (lowHpAudio) {
        if (percentHpRemaining <= 20 && percentHpRemaining !== 0) {
            if (playLowHpAudio) {
                // @ts-ignore
                if (lowHpAudio.paused || lowHpAudio.volume == 0) {
                    // @ts-ignore
                    lowHpAudio.currentTime = 0;
                    // @ts-ignore
                    lowHpAudio.volume = 1;
                }

                // We do our own looping logic... Looping html audio elements in a suitable way is a rabbithole... This way is much more consistent than `lowHpAudio.loop = true`, trust me!
                if (lowHpAudio.getAttribute('listener') !== 'true') {
                    // The 'listener' attribute is just so that the looping event listener only gets applied once...
                    lowHpAudio.setAttribute('listener', 'true');
                    lowHpAudio.addEventListener('timeupdate', () => {
                        var buffer = .13;
                        // @ts-ignore
                        if (lowHpAudio.currentTime > lowHpAudio.duration - buffer) {
                            // @ts-ignore
                            lowHpAudio.currentTime = 0;
                            // @ts-ignore
                            lowHpAudio.play();
                        }
                    });
                }
                
                // There's an issue with play pause. This is the best way I can find around it right now.
                setTimeout(function () {
                    // @ts-ignore    
                    lowHpAudio.play();
                }, 150);
            }
        } else {
            // @ts-ignore
            lowHpAudio.volume = 0;
            // @ts-ignore
            lowHpAudio.pause();
        }
    }
}

function showReviveMenu(playerConfigs, inputChangeHandler, setCenterScreenMenu) {
    setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
                            menuTitle: "Revive", menuText: "Would you like to Revive?", 
                            buttons: [
                                {
                                    text: "Yes",
                                    sound: "reviveaudio",
                                    onClick: () => {
                                        const playerConfigsClone = {...playerConfigs};
                                        SetPlayerRevived(playerConfigsClone);
                                        inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
                                        setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                                    }
                                },
                                {
                                    text: "No",
                                    onClick: () => {}
                                }
                            ] 
                        } });
}