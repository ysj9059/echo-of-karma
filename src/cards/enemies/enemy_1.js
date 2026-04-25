export default {
    id: 'enemy_1',
    type: 'enemy',
    tier: '약',
    name: '겁먹은 행인',
    count: 4,
    r: 2,
    a: 1,
    echo: 'MP −1',
    echoConcept: 'mp',
    echoValue: -1,
    image: 'CARDS/O1-겁먹은행인.png',
    echoEffect: (state) => {
        state.mp = Math.max(0, state.mp - 1);
    }
};
