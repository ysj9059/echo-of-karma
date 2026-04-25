export default {
    id: 'enemy_2',
    type: 'enemy',
    tier: '약',
    name: '소문꾼',
    count: 4,
    r: 3,
    a: 1,
    echo: '다음 턴 시작 손패 −1 (최소 2장)',
    echoConcept: 'hand',
    echoValue: -1,
    image: 'CARDS/O2-소문꾼.png',
    echoEffect: (state) => {
        state.nextTurnHandPenalty = (state.nextTurnHandPenalty || 0) + 1;
    }
};
