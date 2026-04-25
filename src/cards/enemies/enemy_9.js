export default {
    id: 'enemy_9',
    type: 'enemy',
    tier: '상',
    name: '눈먼 광신도',
    count: 2,
    r: 7,
    a: 1,
    echo: 'Karma +2',
    echoConcept: 'karma',
    echoValue: 2,
    image: 'CARDS/O9-눈먼광신도.png',
    echoEffect: (state) => {
        state.karma = Math.min(99, state.karma + 2);
    }
};
