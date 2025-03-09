export function isPlayerCurrentlyConcentrating(playerConfigs) {
    const playerActiveEffects = playerConfigs.currentStatus.activeEffects;
    if (playerActiveEffects && playerActiveEffects.length > 0) {
        // Check if the character has an active affect on them with concentration that is not from a different character.
        const currentEffectWithConcentration = playerActiveEffects.find(effect => !effect.fromRemoteCharacter && effect.concentration);
        return currentEffectWithConcentration;
    }
    return false;
}