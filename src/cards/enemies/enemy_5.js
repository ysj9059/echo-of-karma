export default {
    id: 'enemy_5',
    type: 'enemy',
    tier: '중',
    name: '폭력배',
    count: 4,
    r: 4,
    a: 3,
    echo: '다음 턴 살생 비용 +1 (최대 비용 MP3)',
    echoConcept: 'killCost',
    echoValue: 1,
    image: 'CARDS/O5-폭력배.png',
    echoEffect: (state) => {
        state.nextTurnKillCostBonus = (state.nextTurnKillCostBonus || 0) + 1;
    }
};
