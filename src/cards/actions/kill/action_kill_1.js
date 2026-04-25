export default {
    id: 'action_kill_1',
    type: 'action',
    subtype: 'kill',
    name: '과잉 진압',
    count: 6,
    cost: 0,
    description: '이번 턴 살생 시도 비용 −1 (최소 0). 살생 판정 1회 수행.',
    sideEffect: '살생 성공 시 50% 확률로 추가 Karma +1',
    image: 'CARDS/01-과잉진압.png',
    effect: (state) => {
        state.killCostModifier = (state.killCostModifier || 0) - 1;
        state.overkillActiveCount = (state.overkillActiveCount || 0) + 1;
    }
};
