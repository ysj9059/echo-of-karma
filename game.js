// =============================
// 업보의 메아리 - 게임 로직 v2
// =============================

import { buildActionDeck, buildEnemyDeck, shuffle } from './src/cards/index.js';


// ===== 게임 상태 =====
let G = {};
window.G = G; // 전역 참조 허용 (index.html 등에서 사용)

// 유틸리티 함수 노출 (index.html 등에서 사용)
const q = s => document.querySelector(s);
const qa = s => document.querySelectorAll(s);
window.q = q;
window.qa = qa;



// ===== 상태 초기화 =====
function initGame() {
    // 이전 게임에서 남아있을 수 있는 메아리 패널 닫기
    const echoPanel = q('#echo-panel');
    if (echoPanel) echoPanel.classList.remove('active');
    const echoCardsRow = q('#echo-cards-row');
    if (echoCardsRow) echoCardsRow.innerHTML = '';

    // 배경음악 재생
    const bgm = q('#bgm');
    if (bgm) {
        bgm.play().catch(e => console.log('BGM 자동재생 실패:', e));
    }

    const actionDeck = buildActionDeck();
    const enemyDeck = buildEnemyDeck();

    G = {
        turn: 1,
        hp: 20, mp: 8, karma: 0, talkTokens: 0,
        actionDeck, actionDiscard: [],
        hand: [], enemyDeck,
        fieldCard: null,
        echoDeck: [],
        playedActionCards: [],
        deadEnemyDeck: [],

        killCostModifier: 0,
        talkCostModifier: 0,
        talkDiceBonus: 0,
        echoCountModifier: 0,
        overkillActiveCount: 0,
        usedTalkBoostCard: false,
        freeTalkThisTurn: false,
        specialKillNoRoll: false,
        specialRemoveEnemy: false,

        nextTurnHandPenalty: 0,
        nextTurnKillCostBonus: 0,
        nextTurnTalkCostBonus: 0,

        phase: 'hand-cleanup',
        actionDone: false,
        gameOver: false,
        won: false,

        discardSelected: [],
    };

    q('#log-zone').innerHTML = '';
    log(`━━ 1턴 시작 ━━`, 'event');
    if (G.fieldCard) log(`▶ 현재 상대: ${G.fieldCard.name}`, 'event');
    renderAll();

    // 초기 애니메이션
    doInitialAnimations();
}

function doInitialAnimations() {
    G.revealedEchoes = 0; // 안개 속에 감춤 (이후 2로 세팅)
    const enemyEl = q('#deck-enemy');
    const actionEl = q('#deck-action');
    if (enemyEl) enemyEl.classList.add('shuffling');
    if (actionEl) actionEl.classList.add('shuffling');
    playSound('sfx-shuffle');

    setTimeout(() => {
        if (enemyEl) enemyEl.classList.remove('shuffling');
        if (actionEl) actionEl.classList.remove('shuffling');

        let echoMoves = 0;
        let handMoves = 0;
        let echoDone = false;
        let handDone = false;

        const checkDone = () => {
            if (echoDone && handDone) {
                renderAll();
                setTimeout(() => {
                    // 첫 상대 공개
                    revealNewEnemy(() => {
                        phaseWaitHandCleanup();
                    });
                }, 500);
            }
        };

        const doEchoReveal = () => {
            // 메아리덱에서 2장 공개 효과 (UI만 갱신하면서 한 장씩)
            let reveals = 0;
            const revealNext = () => {
                if (reveals < 2 && G.echoDeck.length > reveals) {
                    const toId = `echo-reveal-${reveals + 1}`;
                    animateCardFly('deck-echo', toId, () => {
                        G.revealedEchoes = reveals + 1;
                        renderDecks(); // 렌더링하면서 메아리 카드와 덱 카운트 갱신
                        reveals++;
                        revealNext();
                    }, 'enemy');
                } else {
                    echoDone = true;
                    checkDone();
                }
            };
            revealNext();
        };

        const doEchoMove = () => {
            if (echoMoves < 5 && G.enemyDeck.length > 0) {
                const card = G.enemyDeck.shift();
                animateCardFly('deck-enemy', 'deck-echo', () => {
                    G.echoDeck.push(card);
                    renderDecks();
                    echoMoves++;
                    doEchoMove();
                }, 'enemy');
            } else {
                doEchoReveal();
            }
        };

        const doHandMove = () => {
            if (handMoves < 4 && G.actionDeck.length > 0) {
                const card = G.actionDeck.shift();
                G.hand.push(card);
                animateCardFly('deck-action', 'hand-zone', () => {
                    renderHand();
                    handMoves++;
                    doHandMove();
                }, 'action', card);
            } else {
                handDone = true;
                checkDone();
            }
        };

        doEchoMove();
        doHandMove();
    }, 1200); // 셔플 애니메이션 대기
}

// ===== 주사위 =====
function rollD6() { return Math.floor(Math.random() * 6) + 1; }
function rollDice(n) { return Array.from({ length: n }, rollD6); }

// ===== 덱 관리 =====
function drawAction(n) {
    for (let i = 0; i < n; i++) {
        if (G.actionDeck.length === 0) {
            if (G.actionDiscard.length === 0) break;
            G.actionDeck = shuffle([...G.actionDiscard]);
            G.actionDiscard = [];
            log('▶ 행동 버림 더미 셔플 → 새 행동 덱', 'event');
        }
        G.hand.push(G.actionDeck.shift());
    }
}

function refillHand() {
    const needed = 4 - G.hand.length;
    if (needed > 0) drawAction(needed);
}

// 상대덱에서 새 상대 공개 (애니메이션 포함)
function revealNewEnemy(onDone) {
    if (G.fieldCard || G.enemyDeck.length === 0) { if (onDone) onDone(); return; }
    G.fieldCard = G.enemyDeck.shift();
    log(`▶ 새 상대 등장: ${G.fieldCard.name}`, 'event');
    renderDecks();
    // 상대 카드 등장 애니메이션
    animateCardFly('deck-enemy', 'field-card-wrapper', () => {
        renderField();
        renderDecks();
        if (onDone) onDone();
    }, 'enemy');
}

// ===== 메아리 공개 =====
function resolveEcho(cards, onDone) {
    if (cards.length === 0) { if (onDone) onDone(); return; }
    const panel = q('#echo-panel');
    const row = q('#echo-cards-row');
    row.innerHTML = '';
    panel.classList.add('active');
    q('#echo-panel-title').textContent = `⚡ 메아리 공개 (${cards.length}장)`;

    let idx = 0;
    const next = () => {
        if (idx >= cards.length) {
            G.echoDeck.push(...cards);
            panel.classList.remove('active');
            if (G.hp <= 0) { endGame(false); return; }
            if (onDone) onDone();
            return;
        }
        const card = cards[idx++];
        const el = createEnemyCardEl(card, true);
        row.appendChild(el);
        log(`메아리: [${card.name}] Echo = ${card.echo}`, 'event');
        if (card.echoConcept === 'choice') {
            showChoiceModal(card, next);
        } else {
            card.echoEffect(G);
            if (G.hp <= 0) { endGame(false); return; }
            renderStats();
            setTimeout(next, 700);
        }
    };
    next();
}

function triggerEchoPhase(onDone) {
    const count = Math.max(0, Math.min(5, G.karma + (G.echoCountModifier || 0)));
    const reactionCard = G.hand.find(c => c.isReaction);

    if (reactionCard && count > 0) {
        showReactionModal(reactionCard, () => {
            playReactionCard(reactionCard, () => {
                triggerEchoPhase(onDone); // 재귀 호출: 수정된 modifier로 재계산
            });
        }, () => {
            // 반응 카드 미사용 시 기존 루틴 진행
            const finalCount = Math.max(0, Math.min(5, G.karma + (G.echoCountModifier || 0)));
            G.echoCountModifier = 0;
            if (finalCount === 0) { log('▶ 메아리 없음 (공개 0장)', 'muted'); if (onDone) onDone(); return; }
            const toReveal = G.echoDeck.splice(0, finalCount);
            resolveEcho(toReveal, onDone);
        });
    } else {
        G.echoCountModifier = 0;
        if (count === 0) { log('▶ 메아리 없음 (공개 0장)', 'muted'); if (onDone) onDone(); return; }
        const toReveal = G.echoDeck.splice(0, count);
        resolveEcho(toReveal, onDone);
    }
}

// 살생 성공 시 메아리 1장
function triggerKillEcho(onDone) {
    if (G.echoDeck.length === 0) { if (onDone) onDone(); return; }

    const reactionCard = G.hand.find(c => c.isReaction);
    if (reactionCard) {
        showReactionModal(reactionCard, () => {
            playReactionCard(reactionCard, () => {
                // 살생 메아리는 보통 1장임. 침묵(-2) 사용 시 0장이 됨.
                log('⚡ 침묵 효과로 살생 성공 메아리가 봉인되었습니다.', 'muted');
                G.echoCountModifier = 0;
                if (onDone) onDone();
            });
        }, () => {
            actuallyTriggerKillEcho(onDone);
        });
    } else {
        actuallyTriggerKillEcho(onDone);
    }
}

function actuallyTriggerKillEcho(onDone) {
    const card = G.echoDeck.shift();
    log(`⚡ 살생 성공 메아리 1장 공개: [${card.name}]`, 'event');
    if (card.echoConcept === 'choice') {
        showChoiceModal(card, () => {
            G.echoDeck.push(card);
            if (G.hp <= 0) { endGame(false); return; }
            if (onDone) onDone();
        });
    } else {
        card.echoEffect(G);
        G.echoDeck.push(card);
        renderStats();
        if (G.hp <= 0) { endGame(false); return; }
        if (onDone) onDone();
    }
}

// ===== 턴 구조 =====

// 턴 시작: 대화 토큰 → 새 상대 공개 → 손패 정리
function startTurn() {
    // 이전 턴 주사위 결과 지우기
    const diceArea = q('#dice-area');
    if (diceArea) diceArea.innerHTML = '';

    // [0] 대화 토큰 성장
    if ([6, 11, 16].includes(G.turn)) {
        G.talkTokens = Math.min(4, G.talkTokens + 1);
        log(`🗣 대화 토큰 +1 (현재 ${G.talkTokens}개)`, 'event');
    }

    // 다음 턴 수정자 반영
    G.killCostModifier = G.nextTurnKillCostBonus || 0;
    G.talkCostModifier = G.nextTurnTalkCostBonus || 0;
    G.nextTurnKillCostBonus = 0;
    G.nextTurnTalkCostBonus = 0;
    G.actionDone = false;
    G.specialKillNoRoll = false;
    G.specialRemoveEnemy = false;
    G.freeTalkThisTurn = false;
    G.usedTalkBoostCard = false;
    G.talkDiceBonus = 0;
    G.echoCountModifier = 0;
    G.overkillActiveCount = 0;

    log(`\n━━ ${G.turn}턴 시작 ━━`, 'event');

    // [1] 필드 확인: 상대 없으면 공개 후 손패 정리
    if (!G.fieldCard) {
        revealNewEnemy(() => {
            renderAll();
            phaseWaitHandCleanup();
        });
    } else {
        renderAll();
        phaseWaitHandCleanup();
    }
}

// 손패 정리 진입 전 대기 단계
function phaseWaitHandCleanup() {
    G.phase = 'wait-hand-cleanup';
    renderAll();
    setActionBtnsState();
}

// 손패 정리 단계
function phaseHandCleanup() {
    G.phase = 'hand-cleanup';
    // 손패 패널티 적용
    if (G.nextTurnHandPenalty > 0) {
        const penalty = Math.min(G.nextTurnHandPenalty, Math.max(0, G.hand.length - 2));
        for (let i = 0; i < penalty; i++) G.actionDiscard.push(G.hand.shift());
        if (penalty > 0) log(`⚡ 손패 패널티: -${penalty}장`, 'danger');
        G.nextTurnHandPenalty = 0;
    }
    refillHand();
    renderAll();
    showDiscardModal();
}

// 카드 사용 단계
function phaseCardPlay() {
    G.phase = 'card-play';
    closeDiscardModal();
    renderAll();
    setActionBtnsState();
}

// 선택 행동 단계
function phaseSelectAction() {
    G.phase = 'select-action';
    renderAll();
    setActionBtnsState();
}

// 휴식 단계 → 성찰(선택) → 손패 보충, Karma패널티, 턴+1 → 새 상대 공개 → 다음 턴 시작
function phaseRest() {
    G.phase = 'rest';

    // 사용한 행동카드를 버림 덱으로
    if (G.playedActionCards && G.playedActionCards.length > 0) {
        G.playedActionCards.forEach(c => G.actionDiscard.push(c));
        G.playedActionCards = [];
        renderPlayedCards();
        log(`▶ 사용한 행동카드 버림 덱으로 이동`, 'muted');
    }

    refillHand();
    renderAll();

    // 성찰 모달 표시 (플레이어 선택 유도)
    q('#reflection-modal').classList.add('active');
}

function doReflect(type) {
    q('#reflection-modal').classList.remove('active');

    if (type === 'normal') {
        G.hp = Math.min(20, G.hp + 1);
        G.mp = Math.min(8, G.mp + 1);
        log('🧘 휴식: HP +1, MP +1 회복', 'success');
    } else if (type === 'karma') {
        G.hp -= 3;
        G.karma = Math.max(0, G.karma - 1);
        log('🧘 깊은 명상: 고행의 대가(HP-3)를 치르고 Karma -1 정화', 'danger');
    } else if (type === 'token') {
        G.hp -= 3;
        G.talkTokens = Math.min(4, G.talkTokens + 1);
        log('🧘 간절한 기도: 고행의 대가(HP-3)를 치르고 대화 토큰 +1 획득', 'danger');
    }

    renderStats();
    if (G.hp <= 0) { endGame(false); return; }

    // 이후 공통 정산 로직
    let hpPenalty = 0;
    if (G.karma >= 9) hpPenalty = 2;
    else if (G.karma >= 4) hpPenalty = 1;
    if (hpPenalty > 0) {
        G.hp -= hpPenalty;
        log(`☠ 카르마 패널티: HP -${hpPenalty} (Karma ${G.karma})`, 'danger');
    }

    G.turn++;
    renderAll();

    if (G.hp <= 0) { endGame(false); return; }
    if (G.turn > 20) { endGame(true); return; }

    // 휴식 후 새 상대가 없으면 공개 → 그 다음 다음 턴(손패 정리)
    if (!G.fieldCard) {
        setTimeout(() => {
            revealNewEnemy(() => {
                renderAll();
                setTimeout(() => startTurn(), 400);
            });
        }, 400);
    } else {
        setTimeout(() => startTurn(), 500);
    }
}

// ===== 카드 사용 =====
// 카드 클릭 → 줌 확인 모달 → "사용" 버튼으로만 실제 적용
function onHandCardClick(card) {
    if (G.phase === 'hand-cleanup') {
        toggleDiscardSelect(card);
    } else if (G.phase === 'card-play') {
        // 확인 단계: 줌 모달 띄우고 "사용" 눌러야 실제 적용
        showCardZoom(card, true);
    }
}

function playCard(card) {
    if (G.phase !== 'card-play') { showToast('카드 사용 단계가 아닙니다'); return; }
    if (G.mp < card.cost) { showToast('MP가 부족합니다'); return; }

    if ((card.id === 'action_talk_1' || card.id === 'action_talk_3') && G.usedTalkBoostCard) {
        showToast('경청과 중재는 같은 턴에 함께 사용할 수 없습니다'); return;
    }
    if (card.isReaction) {
        showToast('침묵은 메아리 단계에서만 사용 가능합니다'); return;
    }

    q('#card-zoom-modal').classList.remove('active');

    if (card.id === 'action_kill_1') { doPlayCardAnim(card, tryKill); return; }
    if (card.id === 'action_kill_2') { doPlayCardAnim(card, doConfirmKill); return; }
    if (card.id === 'action_talk_4') { doPlayCardAnim(card, doConfess); return; }

    doPlayCardAnim(card, null);
}

// ===== 반응 카드 처리 =====
function showReactionModal(card, onUse, onSkip) {
    const modal = q('#reaction-modal');
    const slot = q('#reaction-card-slot');
    slot.innerHTML = '';
    // 카드 형태를 그대로 보여줌
    slot.appendChild(createActionCardEl(card, true));

    const desc = q('#reaction-modal .reaction-modal-desc');
    if (desc) desc.innerHTML = `${card.name} 카드를 사용하여 메아리 효과를 줄이시겠습니까?<br><small>(비용 MP ${card.cost})</small>`;

    modal.classList.add('active');

    q('#reaction-use-btn').onclick = () => {
        modal.classList.remove('active');
        onUse();
    };
    q('#reaction-skip-btn').onclick = () => {
        modal.classList.remove('active');
        onSkip();
    };
}

function playReactionCard(card, onDone) {
    if (G.mp < card.cost) {
        showToast('MP가 부족하여 반응 카드를 사용할 수 없습니다.');
        return;
    }

    G.mp -= card.cost;
    G.hand = G.hand.filter(c => c.uid !== card.uid);
    if (!G.playedActionCards) G.playedActionCards = [];
    G.playedActionCards.push(card);

    log(`⚡ 반응 사용: ${card.name}`, 'success');

    // 카드가 날아가는 애니메이션
    const slotIdx = Math.min(G.playedActionCards.length, 3);
    const targetSlot = `used-card-${slotIdx}`;

    animateCardFly('hand-zone', targetSlot, () => {
        card.effect(G); // e.g. echoCountModifier -= 2
        renderPlayedCards();
        renderStats();
        if (G.hp <= 0) { endGame(false); return; }
        if (onDone) onDone();
    }, 'action', card);
}

// 카드 사용 처리 (손패 → 버림더미/사용한카드 애니메이션)
function doPlayCardAnim(card, afterCb) {
    G.mp -= card.cost;
    G.hand = G.hand.filter(c => c.uid !== card.uid);
    if (!G.playedActionCards) G.playedActionCards = [];
    G.playedActionCards.push(card);
    log(`🃏 카드 사용: ${card.name} (MP -${card.cost})`, 'info');

    const slotIdx = Math.min(G.playedActionCards.length, 3);
    const targetSlot = `used-card-${slotIdx}`;

    // 손패에서 사용한 행동카드 슬롯으로 애니메이션
    animateCardFly('hand-zone', targetSlot, () => {
        card.effect(G);
        renderPlayedCards();
        renderAll();
        if (afterCb) afterCb();
    }, 'action', card);
}

function doConfirmKill() {
    if (!G.fieldCard) { showToast('현재 상대가 없습니다'); return; }
    log(`⚔ 확인 사살: ${G.fieldCard.name} → 메아리 덱으로 이동`, 'danger');
    G.karma = Math.min(99, G.karma + 1);
    G.actionDone = true;
    // 필드 → 메아리덱 애니메이션
    animateCardFly('field-card-wrapper', 'deck-echo', () => {
        G.echoDeck.push(G.fieldCard);
        G.fieldCard = null;
        renderStats();
        renderField();
        renderDecks();
        triggerKillEcho(() => {
            renderAll();
            phaseSelectAction();
        });
    }, 'enemy');
}

function doConfess() {
    if (!G.fieldCard) { showToast('현재 상대가 없습니다'); return; }

    const snap = { hp: G.hp, mp: G.mp, karma: G.karma, talkTokens: G.talkTokens };

    G.karma = Math.max(0, G.karma - 1);
    G.hp -= 4;
    log(`💔 고백: HP-4, Karma-1, ${G.fieldCard.name} 제거`, 'danger');
    const enemyToDie = G.fieldCard;
    G.fieldCard = null;
    G.actionDone = true;
    renderStats();
    renderField();
    if (G.hp <= 0) { endGame(false); return; }

    animateCardFly('field-card-wrapper', 'deck-enemy-dead', () => {
        G.deadEnemyDeck.push(enemyToDie);
        renderDecks();
        renderAll();
        showActionResult('💔 고백 완료', `[${enemyToDie.name}] 제거됨.<br><br><b>[최종 효과 요약]</b><br>${getEffectSummary(snap)}`, false, () => {
            phaseSelectAction();
        });
    }, 'enemy');
}

// ===== 살생 시도 =====
function tryKill() {
    if (G.actionDone) { showToast('이미 이번 턴 선택 행동을 완료했습니다'); return; }
    if (!G.fieldCard) { showToast('현재 상대가 없습니다'); return; }

    const snap = { hp: G.hp, mp: G.mp, karma: G.karma, talkTokens: G.talkTokens };

    let cost = 1;
    if (G.karma >= 7) cost += 1;
    cost += (G.killCostModifier || 0);
    cost = Math.max(0, Math.min(cost, 3));

    if (G.mp < cost) { showToast(`살생 비용 MP ${cost} 부족 (현재 MP ${G.mp})`); return; }
    G.mp -= cost;
    G.killCostModifier = 0;

    const dice = rollDice(3);
    const success = dice.some(d => d >= 5);
    G.actionDone = true;
    setActionBtnsState();

    playDiceAnimation('kill', dice, success, null, () => {
        log(`⚔ 살생 시도 (비용 MP ${cost}): 주사위 [${dice.join(', ')}] → ${success ? '✅ 성공' : '❌ 실패'}`, success ? 'success' : 'danger');
        G.karma = Math.min(99, G.karma + 1);

        // [사이드 이펙트] 과잉 진압: 살생 성공 시 50% 확률로 추가 Karma +1
        if (success && G.overkillActiveCount > 0) {
            for (let i = 0; i < G.overkillActiveCount; i++) {
                if (Math.random() < 0.5) {
                    G.karma = Math.min(99, G.karma + 1);
                    log(`⚠️ [과잉 진압] 부작용: 추가 Karma +1`, 'danger');
                }
            }
        }

        if (success) {
            const enemy = G.fieldCard;
            log(`✅ ${enemy.name} → 메아리 덱으로`, 'success');
            // 필드 → 메아리덱 애니메이션
            animateCardFly('field-card-wrapper', 'deck-echo', () => {
                G.echoDeck.push(enemy);
                G.fieldCard = null;
                renderStats(); renderField(); renderDecks();
                triggerKillEcho(() => {
                    renderAll();
                    showActionResult('⚔ 살생 성공', `적[${enemy.name}]을(를) 메아리 덱으로 보냈습니다.<br><br><b>[최종 효과 요약]</b><br>${getEffectSummary(snap)}`, true, () => {
                        setTimeout(() => phaseSelectAction(), 300);
                    });
                });
            }, 'enemy');
        } else {
            const dmg = G.fieldCard.a;
            G.hp -= dmg;
            log(`❌ 살생 실패: HP -${dmg} (${G.fieldCard.name})`, 'danger');
            const enemy = G.fieldCard;
            G.fieldCard = null;
            G.enemyDeck = shuffle([...G.enemyDeck, enemy]);
            renderStats();
            if (G.hp <= 0) { endGame(false); return; }
            triggerEchoPhase(() => {
                renderAll();
                showActionResult('❌ 살생 실패', `살생에 실패했습니다. [${enemy.name}] 귀환.<br><br><b>[최종 효과 요약]</b><br>${getEffectSummary(snap)}`, false, () => {
                    setTimeout(() => phaseSelectAction(), 300);
                });
            });
        }
    });
}

// ===== 대화 시도 =====
function tryTalk() {
    if (G.actionDone) { showToast('이미 이번 턴 선택 행동을 완료했습니다'); return; }
    if (!G.fieldCard) { showToast('현재 상대가 없습니다'); return; }

    const snap = { hp: G.hp, mp: G.mp, karma: G.karma, talkTokens: G.talkTokens };

    let cost = 2;
    cost += (G.talkCostModifier || 0);
    cost = Math.max(0, cost);

    if (!G.freeTalkThisTurn && G.mp < cost) {
        showToast(`대화 비용 MP ${cost} 부족 (현재 MP ${G.mp})`); return;
    }
    if (!G.freeTalkThisTurn) G.mp -= cost;
    else G.freeTalkThisTurn = false;
    G.talkCostModifier = 0;

    showTokenModal((tokensUsed) => {
        G.talkTokens -= tokensUsed;
        const diceCount = 1 + (G.talkDiceBonus || 0) + tokensUsed;
        const dice = rollDice(diceCount);
        const total = dice.reduce((a, b) => a + b, 0);
        const threshold = (G.fieldCard ? G.fieldCard.r : 0) + G.karma;
        const success = total >= threshold;
        G.talkDiceBonus = 0;
        G.actionDone = true;
        setActionBtnsState();

        playDiceAnimation('talk', dice, success, threshold, () => {
            log(`🗣 대화 (비용 MP ${cost}, ${diceCount}d6): [${dice.join(', ')}] = ${total} vs 목표 ${threshold} → ${success ? '✅ 성공' : '❌ 실패'}`, success ? 'talk' : 'danger');

            if (success) {
                log(`✅ 대화 성공: ${G.fieldCard.name} 완전 제거`, 'talk');
                const enemyToDie = G.fieldCard;
                G.fieldCard = null;
                G.karma = Math.max(0, G.karma - 1);
                if (tokensUsed === 0) {
                    G.talkTokens = Math.min(4, G.talkTokens + 1);
                } else {
                    log(`(토큰 사용 성공: 추가 토큰 획득 없음)`, 'muted');
                }
                renderStats(); renderField();
                animateCardFly('field-card-wrapper', 'deck-enemy-dead', () => {
                    G.deadEnemyDeck.push(enemyToDie);
                    renderDecks();
                    showActionResult('🗣 대화 성공', `[${enemyToDie.name}]을(를) 완전히 제거했습니다.<br><br><b>[최종 효과 요약]</b><br>${getEffectSummary(snap)}`, true, () => {
                        setTimeout(() => phaseSelectAction(), 300);
                    });
                }, 'enemy');
            } else {
                const enemy = G.fieldCard;
                G.fieldCard = null;
                const dmg = enemy.a;
                G.hp -= dmg;
                log(`❌ 대화 실패: HP -${dmg} (${enemy.name})`, 'danger');
                G.enemyDeck = shuffle([...G.enemyDeck, enemy]);
                renderStats();
                if (G.hp <= 0) { endGame(false); return; }
                if (G.karma >= 3 && G.echoDeck.length > 0) {
                    const card = G.echoDeck.shift();
                    log(`⚡ 대화 실패 메아리 1장 공개: [${card.name}]`, 'event');
                    resolveEcho([card], () => {
                        renderAll();
                        showActionResult('❌ 대화 실패', `대화에 실패했습니다. (메아리 발동됨)<br><br><b>[최종 효과 요약]</b><br>${getEffectSummary(snap)}`, false, () => {
                            setTimeout(() => phaseSelectAction(), 300);
                        });
                    });
                } else {
                    renderAll();
                    showActionResult('❌ 대화 실패', `대화에 실패했습니다.<br><br><b>[최종 효과 요약]</b><br>${getEffectSummary(snap)}`, false, () => {
                        setTimeout(() => phaseSelectAction(), 300);
                    });
                }
            }
        });
    });
}

// ===== 시도 안 함 =====
function trySkip() {
    if (G.actionDone) { showToast('이미 이번 턴 선택 행동을 완료했습니다'); return; }
    if (!G.fieldCard) {
        G.actionDone = true;
        log('▶ 시도 안 함 (상대 없음)', 'muted');
        phaseSelectAction();
        return;
    }

    const snap = { hp: G.hp, mp: G.mp, karma: G.karma, talkTokens: G.talkTokens };

    G.hp -= G.fieldCard.a;
    log(`😶 시도 안 함: HP -${G.fieldCard.a} (${G.fieldCard.name})`, 'danger');
    const enemy = G.fieldCard;
    G.fieldCard = null;
    G.enemyDeck = shuffle([...G.enemyDeck, enemy]);
    G.actionDone = true;
    renderStats();
    if (G.hp <= 0) { endGame(false); return; }
    triggerEchoPhase(() => {
        renderAll();
        showActionResult('😶 시도 안 함', `아무것도 시도하지 않았습니다.<br><br><b>[최종 효과 요약]</b><br>${getEffectSummary(snap)}`, false, () => {
            setTimeout(() => phaseSelectAction(), 300);
        });
    });
}

function getEffectSummary(snap) {
    let summary = [];
    let dHP = G.hp - snap.hp;
    let dMP = G.mp - snap.mp;
    let dKarma = G.karma - snap.karma;
    let dTokens = G.talkTokens - snap.talkTokens;

    if (dHP !== 0) summary.push(`<span style="color:${dHP > 0 ? '#38b000' : '#e63946'}; font-weight:bold;">HP ${dHP > 0 ? '+' : ''}${dHP}</span>`);
    if (dMP !== 0) summary.push(`<span style="color:#74b9ff; font-weight:bold;">MP ${dMP > 0 ? '+' : ''}${dMP}</span>`);
    if (dKarma !== 0) summary.push(`<span style="color:var(--color-gold); font-weight:bold;">Karma ${dKarma > 0 ? '+' : ''}${dKarma}</span>`);
    if (dTokens !== 0) summary.push(`<span style="color:#ffeaa7; font-weight:bold;">토큰 ${dTokens > 0 ? '+' : ''}${dTokens}</span>`);

    if (summary.length === 0) return "능력치 변화 없음";
    return summary.join(' / ');
}

// ===== 선택 완료 후 휴식 =====
function endActionPhase() {
    if (!G.actionDone) { showToast('아직 선택 행동(살생/대화/시도 안 함)을 해야 합니다'); return; }
    phaseRest();
}

// ===== 게임 종료 =====
function endGame(won) {
    G.gameOver = true;
    G.won = won;
    showResultScreen(won);
}

// ============================================================
// ===== 카드 이동 애니메이션 시스템 =====
// ============================================================
/**
 * fromId: 출발 요소 id (getBoundingClientRect 기준)
 * toId:   도착 요소 id
 * onDone: 애니메이션 완료 콜백
 * type:   'action' | 'enemy'
 * card:   (선택) 카드 데이터 (보여줄 모양 결정)
 */
function animateCardFly(fromId, toId, onDone, type = 'action', card = null) {
    playSound('sfx-card-move');
    const fromEl = document.getElementById(fromId) || q(`#${fromId}`);
    const toEl = document.getElementById(toId) || q(`#${toId}`);

    if (!fromEl || !toEl) { if (onDone) onDone(); return; }

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    // 날아다닐 카드 요소 생성
    const fly = document.createElement('div');
    fly.className = `card fly-card ${type === 'enemy' ? 'card-enemy tier-weak' : 'card-action effect'}`;
    fly.style.cssText = `
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    width: ${type === 'enemy' ? '80px' : '72px'};
    height: ${type === 'enemy' ? '110px' : '104px'};
    left: ${fromRect.left + fromRect.width / 2}px;
    top:  ${fromRect.top + fromRect.height / 2}px;
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                top  0.4s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.35s ease;
    overflow: hidden;
    border-radius: 10px;
    background: ${type === 'enemy' ? 'linear-gradient(135deg,#2a1a2e,#3a2a4e)' : 'linear-gradient(135deg,#0a1a2e,#1a2a4e)'};
    border: 1.5px solid rgba(255,255,255,0.2);
    box-shadow: 0 8px 32px rgba(0,0,0,0.7);
  `;
    fly.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:rgba(255,255,255,0.3)">${card ? card.name : '▶'}</div>`;
    document.body.appendChild(fly);

    // 애니메이션: 출발지 → 도착지
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            fly.style.left = `${toRect.left + toRect.width / 2}px`;
            fly.style.top = `${toRect.top + toRect.height / 2}px`;
            fly.style.transform = 'translate(-50%, -50%) scale(0.6)';
            fly.style.opacity = '0';
        });
    });

    setTimeout(() => {
        if (fly.parentNode) fly.parentNode.removeChild(fly);
        if (onDone) onDone();
    }, 430);
}

// ============================================================
// ===== UI 렌더링 =====
// ============================================================

function renderAll() {
    renderStats();
    renderField();
    renderHand();
    renderDecks();
    renderPlayedCards();
    renderKarmaBar();
    setActionBtnsState();
}

function renderStats() {
    const sv = (id, v) => { const e = q(id); if (e) e.innerHTML = v; };
    sv('#stat-hp', G.hp);
    sv('#stat-mp', G.mp);
    sv('#stat-turn', `${G.turn}/20`);
    sv('#stat-token', G.talkTokens);
    sv('#stat-karma-val', G.karma);

    const hpBar = q('#hp-bar');
    if (hpBar) hpBar.style.width = Math.max(0, (G.hp / 20) * 100) + '%';

    const mpBar = q('#mp-bar');
    if (mpBar) mpBar.style.width = Math.max(0, (G.mp / 8) * 100) + '%';
}

function renderKarmaBar() {
    const tracker = q('#karma-tracker');
    if (!tracker) return;
    tracker.innerHTML = '';
    const maxSteps = 10;

    for (let i = 0; i <= maxSteps; i++) {
        if (i === maxSteps && G.karma > maxSteps) {
            const ovf = document.createElement('div');
            ovf.className = 'karma-overflow';
            ovf.textContent = `+${G.karma - maxSteps}`;
            tracker.appendChild(ovf);
            break;
        }

        const step = document.createElement('div');
        step.className = 'karma-step';
        if (G.karma >= i) step.classList.add('active');
        if (G.karma === i) step.classList.add('current');

        // 4, 7, 9 강조
        if (i === 4 || i === 7 || i === 9) {
            step.classList.add('highlight');
            step.onclick = () => {
                let desc = '';
                if (i === 4) desc = '해당 스텝 이상 진입 시: 매 턴 종료마다 HP -1 감소';
                if (i === 7) desc = '해당 스텝 이상 진입 시: 살생에 필요한 기본 MP 비용 1 증가';
                if (i === 9) desc = '해당 스텝 이상 진입 시: 매 턴 종료마다 HP -2 감소';
                showActionResult(`Karma ${i} 요주의 구간`, desc, null, null);
            };
        }

        tracker.appendChild(step);
    }
}

function renderField() {
    const wrapper = q('#field-card-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';
    if (G.fieldCard) {
        wrapper.appendChild(createEnemyCardEl(G.fieldCard, false, true));
    } else {
        const empty = document.createElement('div');
        empty.className = 'deck-mini enemy-deck';
        empty.style.cssText = 'width:120px;height:170px;font-size:0.75rem;color:rgba(255,255,255,0.25)';
        empty.innerHTML = '<span>상대 없음</span>';
        wrapper.appendChild(empty);
    }
}

function renderHand() {
    const zone = q('#hand-zone');
    if (!zone) return;
    zone.innerHTML = '';
    G.hand.forEach(card => zone.appendChild(createActionCardEl(card)));
}

function renderDecks() {
    const sd = (id, cnt, bgImg) => {
        const el = q(id);
        if (!el) return;
        el.querySelector('.deck-count').textContent = cnt;
        if (bgImg) {
            el.style.backgroundImage = `url('${bgImg}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            let layers = Math.min(8, Math.ceil(cnt / 2));
            let shadow = '0 0 4px rgba(0,0,0,0.8)';
            for (let i = 1; i <= layers; i++) {
                shadow += `, -${i}px ${i}px 0 #1a1a2e, -${i}px ${i}px 0 rgba(255,255,255,0.3)`;
            }
            el.style.boxShadow = cnt > 0 ? shadow : 'none';
        }
    };
    sd('#deck-action', G.actionDeck.length, 'card_back_1.png');
    sd('#deck-discard', G.actionDiscard.length, 'card_back_1.png');
    sd('#deck-enemy', G.enemyDeck.length, 'card_back_2.png');
    sd('#deck-enemy-dead', G.deadEnemyDeck ? G.deadEnemyDeck.length : 0, 'card_back_2.png');

    // 처음에 G.revealedEchoes가 세팅된 경우, 덱 카운트에서 해당 수만큼 뺌
    const revealedLimit = (typeof G.revealedEchoes !== 'undefined') ? G.revealedEchoes : 2;
    const actualRevealed = Math.min(G.echoDeck ? G.echoDeck.length : 0, revealedLimit);
    sd('#deck-echo', G.echoDeck ? G.echoDeck.length - actualRevealed : 0, 'card_back_2.png');

    // 메아리 공개 1, 2
    renderEchoReveals();
}

function renderEchoReveals() {
    const r1 = q('#echo-reveal-1');
    const r2 = q('#echo-reveal-2');
    if (r1) r1.innerHTML = '';
    if (r2) r2.innerHTML = '';

    const limit = typeof G.revealedEchoes !== 'undefined' ? G.revealedEchoes : 2;

    if (limit > 0 && G.echoDeck && G.echoDeck.length > 0 && r1) {
        const c1 = createEnemyCardEl(G.echoDeck[0], true, false);
        c1.style.width = '100%';
        c1.style.height = '100%';
        r1.appendChild(c1);
    }
    if (limit > 1 && G.echoDeck && G.echoDeck.length > 1 && r2) {
        const c2 = createEnemyCardEl(G.echoDeck[1], true, false);
        c2.style.width = '100%';
        c2.style.height = '100%';
        r2.appendChild(c2);
    }
}

function renderPlayedCards() {
    [1, 2, 3].forEach(i => {
        const slot = q(`#used-card-${i}`);
        if (slot) slot.innerHTML = '';
    });
    if (!G.playedActionCards) return;

    G.playedActionCards.forEach((c, idx) => {
        const slotIdx = Math.min(idx + 1, 3);
        const slot = q(`#used-card-${slotIdx}`);
        if (slot) {
            const el = createActionCardEl(c, true);
            el.style.width = '100%';
            el.style.height = '100%';
            slot.appendChild(el);
        }
    });
}

// ===== 카드 요소 생성 =====
function createActionCardEl(card, forZoom = false) {
    const el = document.createElement('div');
    el.className = `card card-action ${card.subtype} illustration-only`;
    el.dataset.uid = card.uid;

    el.innerHTML = `
    <div class="card-inner">
      <div class="card-image-area">
        ${card.image ? `<img src="${card.image}" alt="${card.name}">` : '<div class="card-image-placeholder">일러스트<br>추가 예정</div>'}
      </div>
    </div>`;

    if (!forZoom) {
        addLongPress(el, () => showCardZoom(card, true));
        let pressStart = 0;
        el.addEventListener('mousedown', () => { pressStart = Date.now(); });
        el.addEventListener('touchstart', () => { pressStart = Date.now(); }, { passive: true });
        el.addEventListener('click', () => {
            if (Date.now() - pressStart < 450) onHandCardClick(card);
        });
    }
    return el;
}

function createEnemyCardEl(card, small = false, isField = false, forZoom = false) {
    const el = document.createElement('div');
    const tierClass = tierToClass(card.tier);
    el.className = `card card-enemy ${tierClass}${isField ? ' card-field' : ''} illustration-only`;
    if (isField) { el.style.width = '120px'; el.style.height = '170px'; }
    el.innerHTML = `
    <div class="card-inner">
      <div class="card-image-area">
        ${card.image ? `<img src="${card.image}" alt="${card.name}">` : '<div class="card-image-placeholder">일러스트<br>추가 예정</div>'}
      </div>
    </div>`;

    if (!forZoom) {
        addLongPress(el, () => showCardZoom(card, false));
        let pressStart = 0;
        el.addEventListener('mousedown', () => { pressStart = Date.now(); });
        el.addEventListener('touchstart', () => { pressStart = Date.now(); }, { passive: true });
        el.addEventListener('click', () => {
            if (Date.now() - pressStart < 450) showCardZoom(card, false);
        });
    }
    return el;
}

function tierToClass(t) {
    return t === '약' ? 'tier-weak' : t === '중' ? 'tier-mid' : 'tier-strong';
}

// ===== 손패 버림 선택 토글 =====
function toggleDiscardSelect(card) {
    const idx = G.discardSelected.findIndex(c => c.uid === card.uid);
    if (idx >= 0) {
        G.discardSelected.splice(idx, 1);
    } else {
        if (G.discardSelected.length >= 3) { showToast('최대 3장까지 버릴 수 있습니다'); return; }
        G.discardSelected.push(card);
    }
    renderDiscardModal();
}

// ===== 액션 버튼 상태 =====
function setActionBtnsState() {
    const killBtn = q('#btn-kill');
    const talkBtn = q('#btn-talk');
    const skipBtn = q('#btn-skip');
    const tokenBtn = q('#btn-token');
    const nextBtn = q('#btn-next-phase');
    const cleanupBtn = q('#btn-hand-cleanup');

    const isSel = G.phase === 'select-action' || G.phase === 'card-play';
    const isWaitCleanup = G.phase === 'wait-hand-cleanup';

    if (killBtn) killBtn.disabled = !isSel || G.actionDone;
    if (talkBtn) talkBtn.disabled = !isSel || G.actionDone;
    if (skipBtn) skipBtn.disabled = !isSel || G.actionDone;
    if (tokenBtn) tokenBtn.disabled = !isSel || G.actionDone;

    if (nextBtn) {
        nextBtn.style.display = (isSel && G.actionDone) ? 'inline-block' : 'none';
        nextBtn.disabled = !isSel || !G.actionDone;
    }

    if (cleanupBtn) {
        cleanupBtn.style.display = isWaitCleanup ? 'inline-block' : 'none';
        cleanupBtn.disabled = !isWaitCleanup;
    }
}

// ===== 줌 모달 =====
let zoomTarget = null;
let zoomIsEnemy = false;

function showCardZoom(card, isAction = true) {
    if (G.gameOver) return;
    zoomTarget = card;
    zoomIsEnemy = !isAction;

    const area = q('#zoom-card-area');
    area.innerHTML = '';

    // 확대된 카드 추가
    const cardEl = isAction ? createActionCardEl(card, true) : createEnemyCardEl(card, false, false, true);
    cardEl.style.width = '100%';
    cardEl.style.height = '100%';
    area.appendChild(cardEl);

    // 설명 버튼 및 오버레이 초기화/추가
    let descBtn = q('#zoom-desc-btn');
    let infoOverlay = q('#zoom-info-overlay');

    if (!descBtn) {
        descBtn = document.createElement('button');
        descBtn.id = 'zoom-desc-btn';
        descBtn.textContent = '설명';
    }
    descBtn.style.display = 'block';
    area.appendChild(descBtn);

    if (!infoOverlay) {
        infoOverlay = document.createElement('div');
        infoOverlay.id = 'zoom-info-overlay';
    }
    infoOverlay.classList.remove('active');
    area.appendChild(infoOverlay);

    if (isAction) {
        infoOverlay.innerHTML = `
            <div class="info-title">${card.name}</div>
            <div class="info-desc">
                [비용: MP ${card.cost}]<br><br>
                ${card.description}<br><br>
                <small style="color:var(--color-gold)">${card.sideEffect || ''}</small>
            </div>
            <button class="info-close-btn" onclick="document.getElementById('zoom-info-overlay').classList.remove('active')">닫기</button>
        `;
    } else {
        infoOverlay.innerHTML = `
            <div class="info-title">${card.name}</div>
            <div class="info-desc">
                [티어: ${card.tier} | R: ${card.r} | A: ${card.a}]<br><br>
                <span style="color:var(--color-gold)">Echo: ${card.echo}</span>
            </div>
            <button class="info-close-btn" onclick="document.getElementById('zoom-info-overlay').classList.remove('active')">닫기</button>
        `;
    }

    descBtn.onclick = (e) => {
        e.stopPropagation();
        infoOverlay.classList.add('active');
    };

    const playBtn = q('#zoom-play-btn');
    if (isAction) {
        playBtn.style.display = '';
        // 카드 사용 단계이고 MP 있고 반응 카드 아닐 때만 사용 가능
        const canPlay = G.phase === 'card-play' && G.mp >= card.cost && !card.isReaction;
        playBtn.disabled = !canPlay;
        playBtn.textContent = canPlay ? `사용 (MP -${card.cost})` : '사용 불가';
    } else {
        playBtn.style.display = 'none';
    }
    q('#card-zoom-modal').classList.add('active');
}

// ===== 주사위 굴림 애니메이션 + 결과 =====
function playDiceAnimation(type, dice, success, threshold, onDone) {
    const logEl = q('#dice-area');
    if (!logEl) { if (onDone) onDone(); return; }
    logEl.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'dice-container';

    // 초기 굴러가는 상태 엘리먼트 생성
    const dieEls = dice.map(() => {
        const d = document.createElement('div');
        d.className = 'die rolling';
        d.textContent = rollD6();
        row.appendChild(d);
        return d;
    });

    logEl.appendChild(row);

    playSound('sfx-dice');

    let rolls = 0;
    const interval = setInterval(() => {
        dieEls.forEach(d => { d.textContent = rollD6(); });
        rolls++;
        if (rolls >= 10) { // 10 * 60ms = 600ms 동안 굴리기
            clearInterval(interval);

            // 최종 결과 반영
            dieEls.forEach((d, i) => {
                d.textContent = dice[i];
                d.className = 'die' + (type === 'kill' ? (dice[i] >= 5 ? ' success' : ' fail') : (success ? ' success' : ' fail'));
            });

            // 목표(threshold) 정보 표시
            if (threshold !== null) {
                const total = dice.reduce((a, b) => a + b, 0);
                const label = document.createElement('span');
                label.style.cssText = `font-size:0.8rem;color:${success ? '#38b000' : '#e63946'};margin-left:8px; opacity: 0; transition: opacity 0.3s;`;
                label.textContent = ` = ${total} (목표 ${threshold})`;
                row.appendChild(label);
                setTimeout(() => label.style.opacity = '1', 50);
            }

            // 사용자가 결과를 확인할 수 있도록 800ms 정도 대기 후 결과 모달 콜백 실행
            setTimeout(() => {
                if (onDone) onDone();
            }, 800);
        }
    }, 60);
}

// ===== 토큰 모달 =====
let tokenModalCallback = null;
let tokenCount = 0;

function showTokenModal(cb) {
    tokenModalCallback = cb;
    tokenCount = 0;
    q('#token-count-display').textContent = 0;
    q('#token-max').textContent = G.talkTokens;
    q('#token-modal').classList.add('active');
}

// ===== 빚쟁이 선택 모달 =====
let choiceCard = null;
let choiceDone = null;

function showChoiceModal(card, onDone) {
    choiceCard = card;
    choiceDone = onDone;
    q('#choice-modal-desc').textContent = `[${card.name}] Echo: ${card.echo}`;
    q('#choice-modal').classList.add('active');
}

// ===== 손패 정리 모달 =====
function showDiscardModal() {
    G.discardSelected = [];
    const modal = q('#discard-modal');
    if (!modal) return;
    modal.classList.remove('minimized');
    const hideBtn = q('#discard-hide-btn');
    if (hideBtn) hideBtn.textContent = '숨기기';
    modal.classList.add('active');
    renderDiscardModal();
}

function renderDiscardModal() {
    const row = q('#discard-hand-row');
    if (!row) return;
    row.innerHTML = '';
    G.hand.forEach(card => {
        const el = createActionCardEl(card);
        const isSelected = !!G.discardSelected.find(c => c.uid === card.uid);
        if (isSelected) el.classList.add('discard-selected');
        row.appendChild(el);
    });
    const btn = q('#discard-confirm-btn');
    if (btn) btn.textContent = `버리기 (${G.discardSelected.length}장 선택) → 계속`;
}

function closeDiscardModal() {
    const m = q('#discard-modal');
    if (m) m.classList.remove('active');
}

function confirmDiscard() {
    // 선택된 카드 → 버림더미 애니메이션
    const toDiscard = [...G.discardSelected];
    toDiscard.forEach(c => {
        G.hand = G.hand.filter(h => h.uid !== c.uid);
        G.actionDiscard.push(c);
    });
    if (toDiscard.length > 0) {
        log(`♻ ${toDiscard.length}장 버림`, 'muted');
        // 버림 애니메이션
        animateCardFly('discard-hand-row', 'deck-discard', () => { }, 'action');
    }
    G.discardSelected = [];
    // 4장까지 보충
    const prevLen = G.hand.length;
    refillHand();
    const added = G.hand.length - prevLen;
    if (added > 0) {
        // 덱 → 손패 애니메이션
        for (let i = 0; i < Math.min(added, 3); i++) {
            setTimeout(() => {
                animateCardFly('deck-action', 'hand-zone', () => { }, 'action');
            }, i * 80);
        }
    }
    setTimeout(() => phaseCardPlay(), 200);
}

// ===== 결과 화면 =====
function showResultScreen(won) {
    const screen = q('#result-screen');
    screen.className = `screen active ${won ? 'result-win' : 'result-lose'}`;
    q('#result-title').textContent = won ? '생존!' : '패배';
    q('#result-subtitle').textContent = won ? '20턴을 버텨냈습니다.' : 'HP가 0이 되었습니다.';
    q('#result-stats-text').innerHTML = `최종 턴: ${G.turn}턴 | HP: ${G.hp} | Karma: ${G.karma}`;
    showScreen('result-screen');
}

// ===== 액션 결과 화면 =====
function showActionResult(title, descHtml, isSuccess, onDone) {
    playSound('sfx-card-move');
    const modal = q('#action-result-modal');
    if (!modal) {
        if (onDone) onDone();
        return;
    }
    q('#action-result-title').textContent = title;

    if (isSuccess === null) {
        q('#action-result-title').style.color = 'var(--color-gold)';
    } else {
        q('#action-result-title').style.color = isSuccess ? 'var(--color-effect)' : 'var(--color-kill)';
    }

    q('#action-result-desc').innerHTML = descHtml;

    modal.classList.add('active');

    const clickHandler = () => {
        modal.classList.remove('active');
        modal.removeEventListener('click', clickHandler);
        if (onDone) onDone();
    };
    modal.addEventListener('click', clickHandler);
}

// ===== 화면 전환 =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ===== 로그 =====
function log(text, type = '') {
    const lz = q('#log-zone');
    if (!lz) return;
    const p = document.createElement('p');
    p.textContent = text;
    if (type === 'event') p.classList.add('log-event');
    if (type === 'danger') p.classList.add('log-danger');
    if (type === 'success') p.classList.add('log-success');
    if (type === 'talk') p.classList.add('log-talk');
    lz.appendChild(p);
    lz.scrollTop = lz.scrollHeight;
}

// ===== 토스트 / 사운드 =====
let toastTimer = null;
function showToast(msg) {
    const t = q('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

let sfxVolume = 1;

function playSound(id) {
    const s = document.getElementById(id);
    if (!s) return;
    const clone = s.cloneNode();
    clone.volume = (s.volume || 1) * sfxVolume;
    clone.play().catch(e => console.log('SFX 재생 실패:', e));
}

// ===== 길게 누르기 =====
function addLongPress(el, cb, duration = 500) {
    let timer = null;
    const start = () => { timer = setTimeout(() => { cb(); timer = null; }, duration); };
    const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('mouseup', cancel);
    el.addEventListener('mouseleave', cancel);
    el.addEventListener('touchend', cancel);
    el.addEventListener('touchcancel', cancel);
}

// ===== 파티클 =====
function createParticles() {
    const c = q('.bg-particles');
    if (!c) return;
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.bottom = '-10px';
        const dur = 8 + Math.random() * 12;
        p.style.animationDuration = dur + 's';
        p.style.animationDelay = (Math.random() * 12) + 's';
        const sz = (1 + Math.random() * 2) + 'px';
        p.style.width = sz; p.style.height = sz;
        c.appendChild(p);
    }
}

// ===== DOM 준비 =====
document.addEventListener('DOMContentLoaded', () => {
    createParticles();

    // 글로벌 클릭 효과음
    document.body.addEventListener('click', e => {
        if (e.target.closest('button, .card, .karma-step, .die, input[type="range"]')) {
            playSound('sfx-click');
        }
    }, true); // 캡처링 단계에서 소리 재생 (모달에 의해 막히지 않도록)

    // 손패 정리 모달 숨기기/열기 버튼
    q('#discard-hide-btn')?.addEventListener('click', () => {
        const m = q('#discard-modal');
        if (m) {
            m.classList.toggle('minimized');
            q('#discard-hide-btn').textContent = m.classList.contains('minimized') ? '열기' : '숨기기';
        }
    });

    // 타이틀
    q('#btn-start').onclick = () => { showScreen('game-screen'); initGame(); };
    q('#btn-help-title').onclick = () => { q('#help-back-to').dataset.from = 'title-screen'; showScreen('help-screen'); };

    // 볼륨 조절
    q('#bgm-volume').oninput = e => {
        const bgm = q('#bgm');
        if (bgm) bgm.volume = parseFloat(e.target.value);
    };
    q('#sfx-volume').oninput = e => {
        sfxVolume = parseFloat(e.target.value);
    };

    // 인게임 메뉴
    q('#menu-btn').onclick = () => q('#ingame-menu').classList.add('active');
    q('#ingame-main-btn').onclick = () => { q('#ingame-menu').classList.remove('active'); showScreen('title-screen'); };
    q('#ingame-new-btn').onclick = () => { q('#ingame-menu').classList.remove('active'); initGame(); };
    q('#ingame-help-btn').onclick = () => { q('#ingame-menu').classList.remove('active'); q('#help-back-to').dataset.from = 'game-screen'; showScreen('help-screen'); };
    q('#ingame-back-btn').onclick = () => q('#ingame-menu').classList.remove('active');

    // 도움말
    q('#help-close-btn').onclick = () => showScreen(q('#help-back-to').dataset.from || 'title-screen');

    // 손패 정리 버튼
    q('#discard-confirm-btn').onclick = confirmDiscard;
    q('#btn-hand-cleanup').onclick = phaseHandCleanup;

    // 행동 버튼
    q('#btn-kill').onclick = tryKill;
    q('#btn-talk').onclick = tryTalk;
    q('#btn-skip').onclick = trySkip;
    q('#btn-token').onclick = () => showToast('대화 시 행동으로 토큰을 사용할 수 있습니다');
    q('#btn-next-phase').onclick = endActionPhase;

    // 줌 모달 - "사용" 버튼이 실제 카드 사용을 실행
    q('#zoom-cancel-btn').onclick = () => q('#card-zoom-modal').classList.remove('active');
    q('#zoom-play-btn').onclick = () => {
        if (zoomTarget && !zoomIsEnemy) playCard(zoomTarget);
    };
    q('#card-zoom-modal').addEventListener('click', e => {
        if (e.target === q('#card-zoom-modal')) q('#card-zoom-modal').classList.remove('active');
    });

    // 토큰 모달
    q('#token-minus').onclick = () => { tokenCount = Math.max(0, tokenCount - 1); q('#token-count-display').textContent = tokenCount; };
    q('#token-plus').onclick = () => { tokenCount = Math.min(G.talkTokens, tokenCount + 1); q('#token-count-display').textContent = tokenCount; };
    q('#token-confirm-btn').onclick = () => {
        q('#token-modal').classList.remove('active');
        if (tokenModalCallback) { tokenModalCallback(tokenCount); tokenModalCallback = null; }
    };

    // 빚쟁이 선택 모달
    q('#choice-hp-btn').onclick = () => {
        q('#choice-modal').classList.remove('active');
        if (choiceCard) { choiceCard.echoEffect(G, true); renderStats(); }
        if (choiceDone) choiceDone();
    };
    q('#choice-mp-btn').onclick = () => {
        q('#choice-modal').classList.remove('active');
        if (choiceCard) {
            if (G.mp > 0) choiceCard.echoEffect(G, false);
            else { showToast('MP 0 → HP -2 적용'); choiceCard.echoEffect(G, true); }
            renderStats();
        }
        if (choiceDone) choiceDone();
    };

    // 결과 화면
    q('#result-new-btn').onclick = () => { showScreen('game-screen'); initGame(); };
    q('#result-main-btn').onclick = () => showScreen('title-screen');

    // 침묵 반응 카드 버튼
    q('#btn-silence')?.addEventListener('click', () => {
        const sc = G.hand.find(c => c.id === 'action_effect_5');
        if (!sc) { showToast('손패에 침묵 카드가 없습니다'); return; }
        if (G.mp < sc.cost) { showToast('MP가 부족합니다'); return; }
        G.mp -= sc.cost;
        G.hand = G.hand.filter(c => c.uid !== sc.uid);

        if (!G.playedActionCards) G.playedActionCards = [];
        G.playedActionCards.push(sc);

        sc.effect(G);
        log('🔇 침묵 사용: 메아리 -2장', 'event');
        renderPlayedCards();
        renderStats();
    });

    // 성찰 모달 버튼
    q('#reflect-normal-btn').onclick = () => doReflect('normal');
    q('#reflect-karma-btn').onclick = () => doReflect('karma');
    q('#reflect-token-btn').onclick = () => doReflect('token');
});

// 필요한 함수들 전역 노출
window.initGame = initGame;
window.showTokenModal = showTokenModal;
window.confirmDiscard = confirmDiscard;
window.phaseHandCleanup = phaseHandCleanup;
window.tryKill = tryKill;
window.tryTalk = tryTalk;
window.trySkip = trySkip;
window.endActionPhase = endActionPhase;
window.showScreen = showScreen;
window.playCard = playCard;

