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
        // karma -1, HP-4는 game.js의 doConfess()에서 직접 처리
        // (doPlayCardAnim → card.effect → doConfess 순서로 실행되므로 여기서 중복 적용하면 안 됨)
        state.specialRemoveEnemy = true;
    }
};
