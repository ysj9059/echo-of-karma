export default {
    id: 'action_effect_4',
    type: 'action',
    subtype: 'effect',
    name: '정화 의식',
    count: 2,
    cost: 2,
    description: 'Karma -1 (최소 0), 메아리 덱 카드 1장 제거',
    sideEffect: null,
    image: 'CARDS/10-정화의식.png',
    effect: (state) => {
        if (state.karma > 0) state.karma -= 1;
        if (state.echoDeck && state.echoDeck.length > 0) {
            state.echoDeck.shift();
        }
    }
};
