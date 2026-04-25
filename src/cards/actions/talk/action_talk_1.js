export default {
    id: 'action_talk_1',
    type: 'action',
    subtype: 'talk',
    name: '경청',
    count: 3,
    cost: 1,
    description: '이번 턴 대화 주사위 +1d6 (일회성)',
    sideEffect: '같은 턴에 경청/중재 동시 사용 불가',
    image: 'CARDS/03-경청.png',
    effect: (state) => {
        state.talkDiceBonus = (state.talkDiceBonus || 0) + 1;
        state.usedTalkBoostCard = true;
    }
};
