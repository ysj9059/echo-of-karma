export default {
    id: 'enemy_8',
    type: 'enemy',
    tier: '상',
    name: '증오의 도살자',
    count: 2,
    r: 5,
    a: 3,
    echo: 'HP −3',
    echoConcept: 'hp',
    echoValue: -3,
    image: 'CARDS/O8-증오의도살자.png',
    echoEffect: (state) => {
        state.hp -= 3;
    }
};
