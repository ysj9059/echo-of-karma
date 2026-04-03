// =============================
// 업보의 메아리 - 카드 데이터
// =============================

// 행동 카드 (살생)
const ACTION_CARDS_KILL = [
    {
        id: 'action_kill_1',
        type: 'action',
        subtype: 'kill',
        name: '과잉 진압',
        count: 6,
        cost: 0,
        description: '이번 턴 살생 시도 비용 −1 (최소 0). 살생 판정 1회 수행.',
        sideEffect: '살생 성공 시 50% 확률(1d6 결과가 3 이하)로 추가 Karma +1',
        image: null, // 나중에 이미지 경로 추가
        effect: (state) => {
            // 이번 턴 살생 비용 -1 (최소 0)
            state.killCostModifier = (state.killCostModifier || 0) - 1;
        }
    },
    {
        id: 'action_kill_2',
        type: 'action',
        subtype: 'kill',
        name: '확인 사살',
        count: 2,
        cost: 2,
        description: '주사위 없이 즉시 현재 상대를 메아리 덱으로 이동.',
        sideEffect: 'Karma +1, 메아리 1장 공개',
        image: null,
        effect: (state) => {
            // 선택 행동을 대체: 즉시 살생 성공 처리
            state.specialKillNoRoll = true;
        }
    },
];

// 행동 카드 (대화)
const ACTION_CARDS_TALK = [
    {
        id: 'action_talk_1',
        type: 'action',
        subtype: 'talk',
        name: '경청',
        count: 3,
        cost: 1,
        description: '이번 턴 대화 주사위 +1d6 (일회성)',
        sideEffect: '같은 턴에 경청/중재 동시 사용 불가',
        image: null,
        effect: (state) => {
            state.talkDiceBonus = (state.talkDiceBonus || 0) + 1;
            state.usedTalkBoostCard = true;
        }
    },
    {
        id: 'action_talk_2',
        type: 'action',
        subtype: 'talk',
        name: '사과',
        count: 2,
        cost: 3,
        description: '즉시 Karma −1 (최저 0) 후, 이번 턴 대화 시도 1회를 추가 비용 없이 수행',
        sideEffect: '고비용/고효율(업보를 낮추며 난이도까지 간접 완화)',
        image: null,
        effect: (state) => {
            if (state.karma > 0) state.karma -= 1;
            state.freeTalkThisTurn = true;
        }
    },
    {
        id: 'action_talk_3',
        type: 'action',
        subtype: 'talk',
        name: '중재',
        count: 1,
        cost: 2,
        description: '이번 턴 대화 주사위 +2d6 (일회성)',
        sideEffect: '같은 턴에 경청/중재 동시 사용 불가',
        image: null,
        effect: (state) => {
            state.talkDiceBonus = (state.talkDiceBonus || 0) + 2;
            state.usedTalkBoostCard = true;
        }
    },
    {
        id: 'action_talk_4',
        type: 'action',
        subtype: 'talk',
        name: '고백',
        count: 2,
        cost: 3,
        description: '즉시 Karma −1 (최저 0), HP-4 피해를 받은 뒤 상대 자동 제거',
        sideEffect: '대화/살생 선택 없이 해결(강제 피해 포함)',
        image: null,
        effect: (state) => {
            if (state.karma > 0) state.karma -= 1;
            state.hp -= 4;
            state.specialRemoveEnemy = true; // 상대 자동 제거 (메아리덱으로 가지 않음, 게임에서 완전 제거)
        }
    },
];

// 행동 카드 (효과)
const ACTION_CARDS_EFFECT = [
    {
        id: 'action_effect_1',
        type: 'action',
        subtype: 'effect',
        name: '명상',
        count: 4,
        cost: 0,
        description: 'MP+2 (최대 8). Karma가 5이상이면 MP+1만 회복.',
        sideEffect: null,
        image: null,
        effect: (state) => {
            const gain = state.karma >= 5 ? 1 : 2;
            state.mp = Math.min(8, state.mp + gain);
        }
    },
    {
        id: 'action_effect_2',
        type: 'action',
        subtype: 'effect',
        name: '진통제',
        count: 2,
        cost: 1,
        description: 'HP+3 (최대 20)',
        sideEffect: null,
        image: null,
        effect: (state) => {
            state.hp = Math.min(20, state.hp + 3);
        }
    },
    {
        id: 'action_effect_3',
        type: 'action',
        subtype: 'effect',
        name: '상대 분석',
        count: 3,
        cost: 1,
        description: '현재 상대의 R -2 (최소 R 1)',
        sideEffect: null,
        image: null,
        effect: (state) => {
            if (state.currentEnemy) {
                state.currentEnemy.r = Math.max(1, state.currentEnemy.r - 2);
            }
        }
    },
    {
        id: 'action_effect_4',
        type: 'action',
        subtype: 'effect',
        name: '정화 의식',
        count: 2,
        cost: 2,
        description: 'Karma -1 (최소 0), 메아리 덱 카드 1장 제거',
        sideEffect: null,
        image: null,
        effect: (state, gameActions) => {
            if (state.karma > 0) state.karma -= 1;
            // 메아리 덱 맨 위 카드 1장 제거 (게임 밖으로)
            if (state.echoDeck && state.echoDeck.length > 0) {
                state.echoDeck.shift();
            }
        }
    },
    {
        id: 'action_effect_5',
        type: 'action',
        subtype: 'effect',
        name: '침묵',
        count: 3,
        cost: 0,
        description: '공개해야 할 메아리 카드 수 -2 (최소 0)',
        sideEffect: '메아리 단계 발생 시 사용 가능한 반응 카드',
        image: null,
        isReaction: true, // 반응 카드
        effect: (state) => {
            state.echoCountModifier = (state.echoCountModifier || 0) - 2;
        }
    },
];

// 상대 카드
const ENEMY_CARDS = [
    {
        id: 'enemy_1',
        type: 'enemy',
        tier: '약',
        name: '겁먹은 행인',
        count: 4,
        r: 2,
        a: 1,
        echo: 'MP −1',
        echoConcept: 'mp',
        echoValue: -1,
        image: null,
        echoEffect: (state) => {
            state.mp = Math.max(0, state.mp - 1);
        }
    },
    {
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
        image: null,
        echoEffect: (state) => {
            state.nextTurnHandPenalty = (state.nextTurnHandPenalty || 0) + 1;
        }
    },
    {
        id: 'enemy_3',
        type: 'enemy',
        tier: '약',
        name: '분노한 목격자',
        count: 4,
        r: 3,
        a: 2,
        echo: 'HP −2',
        echoConcept: 'hp',
        echoValue: -2,
        image: null,
        echoEffect: (state) => {
            state.hp -= 2;
        }
    },
    {
        id: 'enemy_4',
        type: 'enemy',
        tier: '약',
        name: '빚쟁이',
        count: 4,
        r: 4,
        a: 2,
        echo: 'HP −2 또는 MP −1 중 택1 (단 MP가 0이면 MP −1 선택 불가)',
        echoConcept: 'choice',
        image: null,
        echoEffect: (state, choiceHp = true) => {
            if (choiceHp) {
                state.hp -= 2;
            } else {
                if (state.mp > 0) state.mp = Math.max(0, state.mp - 1);
            }
        }
    },
    {
        id: 'enemy_5',
        type: 'enemy',
        tier: '중',
        name: '폭력배',
        count: 4,
        r: 4,
        a: 3,
        echo: '다음 턴 살생 비용 +1 (최대 비용 MP3)',
        echoConcept: 'killCost',
        echoValue: 1,
        image: null,
        echoEffect: (state) => {
            state.nextTurnKillCostBonus = (state.nextTurnKillCostBonus || 0) + 1;
        }
    },
    {
        id: 'enemy_6',
        type: 'enemy',
        tier: '중',
        name: '선동가',
        count: 4,
        r: 5,
        a: 2,
        echo: 'Karma +1',
        echoConcept: 'karma',
        echoValue: 1,
        image: null,
        echoEffect: (state) => {
            state.karma += 1;
        }
    },
    {
        id: 'enemy_7',
        type: 'enemy',
        tier: '상',
        name: '상처입은 가족',
        count: 2,
        r: 6,
        a: 2,
        echo: '다음 턴 대화 비용 +2',
        echoConcept: 'talkCost',
        echoValue: 2,
        image: null,
        echoEffect: (state) => {
            state.nextTurnTalkCostBonus = (state.nextTurnTalkCostBonus || 0) + 2;
        }
    },
    {
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
        image: null,
        echoEffect: (state) => {
            state.hp -= 3;
        }
    },
    {
        id: 'enemy_9',
        type: 'enemy',
        tier: '상',
        name: '눈먼 광신도',
        count: 2,
        r: 7,
        a: 1,
        echo: 'Karma +2',
        echoConcept: 'karma',
        echoValue: 2,
        image: null,
        echoEffect: (state) => {
            state.karma += 2;
        }
    },
];

// 전체 행동 카드 (덱 생성용 - 매수만큼 복제)
function buildActionDeck() {
    const allCards = [...ACTION_CARDS_KILL, ...ACTION_CARDS_TALK, ...ACTION_CARDS_EFFECT];
    const deck = [];
    allCards.forEach(card => {
        for (let i = 0; i < card.count; i++) {
            deck.push({ ...card, uid: `${card.id}_${i}` });
        }
    });
    return shuffle(deck);
}

// 상대 카드 덱 생성
function buildEnemyDeck() {
    const deck = [];
    ENEMY_CARDS.forEach(card => {
        for (let i = 0; i < card.count; i++) {
            deck.push({ ...card, uid: `${card.id}_${i}` });
        }
    });
    return shuffle(deck);
}

// 덱 섞기
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
