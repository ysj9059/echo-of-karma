export default {
    id: 'action_talk_4',
    type: 'action',
    subtype: 'talk',
    name: '고백',
    count: 2,
    cost: 3,
    description: '즉시 Karma −1 (최저 0), HP-4 피해를 받은 뒤 상대 자동 제거',
    sideEffect: '대화/살생 선택 없이 해결(강제 피해 포함)',
    image: 'CARDS/06-고백.png',
    effect: (state) => {
        if (state.karma > 0) state.karma -= 1;
        state.hp -= 4;
        state.specialRemoveEnemy = true;
    }
};
