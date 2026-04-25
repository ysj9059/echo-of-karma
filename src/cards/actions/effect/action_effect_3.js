export default {
    id: 'action_effect_3',
    type: 'action',
    subtype: 'effect',
    name: '상대 분석',
    count: 3,
    cost: 1,
    description: '현재 상대의 R -2 (최소 R 1)',
    sideEffect: null,
    image: 'CARDS/09-분석.png',
    effect: (state) => {
        if (state.fieldCard) {
            state.fieldCard.r = Math.max(1, state.fieldCard.r - 2);
        }
    }
};
