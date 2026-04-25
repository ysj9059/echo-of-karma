export default {
    id: 'enemy_6',
    type: 'enemy',
    tier: '중',
    name: '선동가',
    count: 4,
    r: 5,
    a: 2,
    echo: 'Karma +1',
    echoConcept: 'karma',
    echoValue: 1,
    image: 'CARDS/O6-선동가.png',
    echoEffect: (state) => {
        state.karma += 1;
    }
};
