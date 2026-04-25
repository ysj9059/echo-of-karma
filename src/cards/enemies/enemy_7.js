export default {
    id: 'enemy_7',
    type: 'enemy',
    tier: '상',
    name: '상처입은 가족',
    count: 2,
    r: 6,
    a: 2,
    echo: '다음 턴 대화 비용 +2',
    echoConcept: 'talkCost',
    echoValue: 2,
    image: 'CARDS/O7-상처입은가족.png',
    echoEffect: (state) => {
        state.nextTurnTalkCostBonus = (state.nextTurnTalkCostBonus || 0) + 2;
    }
};
