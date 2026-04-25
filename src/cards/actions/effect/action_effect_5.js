export default {
    id: 'action_effect_5',
    type: 'action',
    subtype: 'effect',
    name: '침묵',
    count: 3,
    cost: 0,
    description: '공개해야 할 메아리 카드 수 -2 (최소 0)',
    sideEffect: '메아리 단계 발생 시 사용 가능한 반응 카드',
    image: 'CARDS/11-침묵.png',
    isReaction: true,
    effect: (state) => {
        state.echoCountModifier = (state.echoCountModifier || 0) - 2;
    }
};
