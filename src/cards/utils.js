// 덱 섞기
export function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 전체 행동 카드 덱 생성
export function buildActionDeck(allActionCards) {
    const deck = [];
    allActionCards.forEach(card => {
        for (let i = 0; i < card.count; i++) {
            deck.push({ ...card, uid: `${card.id}_${i}` });
        }
    });
    return shuffle(deck);
}

// 상대 카드 덱 생성
export function buildEnemyDeck(enemyCards) {
    const deck = [];
    enemyCards.forEach(card => {
        for (let i = 0; i < card.count; i++) {
            deck.push({ ...card, uid: `${card.id}_${i}` });
        }
    });
    return shuffle(deck);
}
