export default {
    id: 'action_effect_2',
    type: 'action',
    subtype: 'effect',
    name: '진통제',
    count: 2,
    cost: 1,
    description: 'HP+3 (최대 20)',
    sideEffect: null,
    image: 'CARDS/08-진통제.png',
    effect: (state) => {
        state.hp = Math.min(20, state.hp + 3);
    }
};
