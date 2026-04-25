export default {
    id: 'enemy_4',
    type: 'enemy',
    tier: '약',
    name: '빚쟁이',
    count: 4,
    r: 4,
    a: 2,
    echo: 'HP −2 또는 MP −1 중 택1 (단 MP가 0이면 MP −1 선택 불가)',
    echoConcept: 'choice',
    image: 'CARDS/O4-빚쟁이.png',
    echoEffect: (state, choiceHp = true) => {
        if (choiceHp) {
            state.hp -= 2;
        } else {
            if (state.mp > 0) state.mp = Math.max(0, state.mp - 1);
        }
    }
};
