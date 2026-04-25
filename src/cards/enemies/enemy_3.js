export default {
    id: 'enemy_3',
    type: 'enemy',
    tier: '약',
    name: '분노한 목격자',
    count: 4,
    r: 3,
    a: 2,
    echo: 'HP −2',
    echoConcept: 'hp',
    echoValue: -2,
    image: 'CARDS/O3-분노한목격자.png',
    echoEffect: (state) => {
        state.hp -= 2;
    }
};
