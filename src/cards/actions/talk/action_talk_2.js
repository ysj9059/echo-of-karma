export default {
    id: 'action_talk_2',
    type: 'action',
    subtype: 'talk',
    name: '사과',
    count: 2,
    cost: 3,
    description: '즉시 Karma −1 (최저 0) 후, 이번 턴 대화 시도 1회를 추가 비용 없이 수행',
    sideEffect: '고비용/고효율(업보를 낮추며 난이도까지 간접 완화)',
    image: 'CARDS/04-사과.png',
    effect: (state) => {
        if (state.karma > 0) state.karma -= 1;
        state.freeTalkThisTurn = true;
    }
};
