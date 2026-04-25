export default {
    id: 'action_effect_1',
    type: 'action',
    subtype: 'effect',
    name: '명상',
    count: 4,
    cost: 0,
    description: 'MP+2 (최대 8). Karma가 5이상이면 MP+1만 회복.',
    sideEffect: null,
    image: 'CARDS/07-명상.png',
    effect: (state) => {
        const gain = state.karma >= 5 ? 1 : 2;
        state.mp = Math.min(8, state.mp + gain);
    }
};
