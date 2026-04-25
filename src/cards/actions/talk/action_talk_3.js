export default {
    id: 'action_talk_3',
    type: 'action',
    subtype: 'talk',
    name: '중재',
    count: 1,
    cost: 2,
    description: '이번 턴 대화 주사위 +2d6 (일회성)',
    sideEffect: '같은 턴에 경청/중재 동시 사용 불가',
    image: 'CARDS/05-중재.png',
    effect: (state) => {
        state.talkDiceBonus = (state.talkDiceBonus || 0) + 2;
        state.usedTalkBoostCard = true;
    }
};
