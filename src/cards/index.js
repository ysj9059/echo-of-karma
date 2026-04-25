import action_kill_1 from './actions/kill/action_kill_1.js';
import action_kill_2 from './actions/kill/action_kill_2.js';
import action_talk_1 from './actions/talk/action_talk_1.js';
import action_talk_2 from './actions/talk/action_talk_2.js';
import action_talk_3 from './actions/talk/action_talk_3.js';
import action_talk_4 from './actions/talk/action_talk_4.js';
import action_effect_1 from './actions/effect/action_effect_1.js';
import action_effect_2 from './actions/effect/action_effect_2.js';
import action_effect_3 from './actions/effect/action_effect_3.js';
import action_effect_4 from './actions/effect/action_effect_4.js';
import action_effect_5 from './actions/effect/action_effect_5.js';

import enemy_1 from './enemies/enemy_1.js';
import enemy_2 from './enemies/enemy_2.js';
import enemy_3 from './enemies/enemy_3.js';
import enemy_4 from './enemies/enemy_4.js';
import enemy_5 from './enemies/enemy_5.js';
import enemy_6 from './enemies/enemy_6.js';
import enemy_7 from './enemies/enemy_7.js';
import enemy_8 from './enemies/enemy_8.js';
import enemy_9 from './enemies/enemy_9.js';

import { buildActionDeck as _buildActionDeck, buildEnemyDeck as _buildEnemyDeck, shuffle as _shuffle } from './utils.js';

export const ACTION_CARDS_KILL = [action_kill_1, action_kill_2];
export const ACTION_CARDS_TALK = [action_talk_1, action_talk_2, action_talk_3, action_talk_4];
export const ACTION_CARDS_EFFECT = [action_effect_1, action_effect_2, action_effect_3, action_effect_4, action_effect_5];
export const ENEMY_CARDS = [enemy_1, enemy_2, enemy_3, enemy_4, enemy_5, enemy_6, enemy_7, enemy_8, enemy_9];

export const buildActionDeck = () => _buildActionDeck([...ACTION_CARDS_KILL, ...ACTION_CARDS_TALK, ...ACTION_CARDS_EFFECT]);
export const buildEnemyDeck = () => _buildEnemyDeck(ENEMY_CARDS);
export const shuffle = _shuffle;
