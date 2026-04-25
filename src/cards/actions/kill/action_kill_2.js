export default {
    id: 'action_kill_2',
    type: 'action',
    subtype: 'kill',
    name: '확인 사살',
    count: 2,
    cost: 2,
    description: '주사위 없이 즉시 현재 상대를 메아리 덱으로 이동.',
    sideEffect: 'Karma +1, 메아리 1장 공개',
    image: 'CARDS/02-확인사살.png',
    effect: (state) => {
        state.specialKillNoRoll = true;
    }
};
