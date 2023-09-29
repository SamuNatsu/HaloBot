/// Game model

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function getRndInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const colors = ['🔴', '🔵', '🟡', '🟠', '🟣', '🟤'];
const assets = [250, 300, 350, 400, 450, 500, 'diamond', 'diamond', 'diamond', 'diamond', 'diamond'];
const tile = [
  'move',
  'move',
  'lift',
  'lift',
  'pick',
  'pick',
  'punch',
  'shoot',
  'shoot',
  'police'
];
const event = ['none', 'angry', 'wind', 'break', 'provoke', 'revolt'];
const endEvent = ['steal', 'revenge', 'hijack'];

export default class Game {
  constructor(masterId, onEnd) {
    this.master = masterId;
    this.players = [masterId];
    this.status = 'waiting_players';

    this.onEnd = onEnd;
    this.refreshTimeout();
  }

  refreshTimeout() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(this.onEnd, 300000);
  }
  cleanUp() {
    clearTimeout(this.timeout);
  }

  join(playerId) {
    if (this.status !== 'waiting_players') {
      return false;
    }

    if (this.players.find((value) => value === playerId) !== undefined) {
      this.refreshTimeout();
      return [
        false,
        `[CQ:at,qq=${playerId}] 你已经在游戏中\n目前已有 ${this.players.length} 名玩家`
      ];
    }

    if (this.players.length >= 6) {
      this.refreshTimeout();
      return [false, '游戏玩家已满\n目前已有 6 名玩家'];
    }

    this.players.push(playerId);
    this.refreshTimeout();
    return [
      true,
      `[CQ:at,qq=${playerId}] 加入了游戏\n目前已有 ${this.players.length} 名玩家`
    ];
  }

  leave(playerId) {
    if (this.status !== 'waiting_players') {
      return false;
    }

    if (this.players.find((value) => value === playerId) === undefined) {
      return false;
    }

    if (playerId === this.master) {
      if (this.players.length === 1) {
        this.cleanUp();
        return [null, '所有玩家都退出了游戏\n本次游戏结束'];
      } else {
        this.players = this.players.filter((value) => value !== playerId);
        this.master = this.players[0];
        this.refreshTimeout();
        return [
          true,
          `房主 [CQ:at,qq=${playerId}] 离开了游戏\n现在 [CQ:at,qq=${this.master}] 是新房主`
        ];
      }
    } else {
      this.players = this.players.filter((value) => value !== playerId);
      this.refreshTimeout();
      return [
        true,
        `玩家 [CQ:at,qq=${playerId}] 离开了游戏\n目前已有 ${this.players.length} 名玩家`
      ];
    }
  }

  start(operatorId) {
    if (this.status !== 'waiting_players' || operatorId !== this.master) {
      return false;
    }

    if (this.players.length < 2) {
      this.refreshTimeout();
      return [false, '至少需要 2 名玩家才能开始游戏\n目前已有 1 名玩家'];
    }

    this.status = 'waiting_for_start';
    this.refreshTimeout();
    return [
      true,
      `目前有 ${
        this.players.length
      } 名玩家加入了游戏，他们分别是：\n${this.players
        .map((value) => `[CQ:at,qq=${value}]`)
        .join('、')}\n\n目前游戏玩家已锁定，请房主 [CQ:at,qq=${
        this.master
      }] 输入命令：\n[#wxpr confirm] 确认无误，开始游戏\n[#wxpr cancel] 解除锁定，再看看有没有其他玩家`
    ];
  }

  cancel(operatorId) {
    if (this.status !== 'waiting_for_start' || operatorId !== this.master) {
      return false;
    }

    this.status = 'waiting_players';
    this.refreshTimeout();
    return [
      true,
      `游戏玩家已解锁\n现在游戏可以继续加入/退出\n目前已有 ${this.players.length} 名玩家`
    ];
  }

  confirm(operatorId) {
    if (this.status !== 'waiting_for_start' || operatorId !== this.master) {
      return false;
    }

    this.status = 'game_setup';
    this.refreshTimeout();
    return [
      true,
      `游戏将于 3 秒后开始\n参与玩家：\n${this.players
        .map((value) => `[CQ:at,qq=${value}]`)
        .join('、')}`
    ];
  }

  setup() {
    shuffle(this.players);
    this.startPlayer = -1;

    this.policePosition = 0;

    this.carriage = [];
    for (let i = -1; i < this.players.length; i++) {
      this.carriage.push([]);
    }
    assets.forEach((value) => {
      this.carriage[getRndInt(1, this.players.length)].push(value);
    });
    this.carriage[0].push('briefcase');

    this.playerData = {};
    this.players.forEach((value, index) => {
      this.playerData[value] = {
        color: colors[index],
        position: this.players.length - (index % 2),
        bullet: 6,
        assets: [250],
        tile: Array.from(tile),
        tileCurrent: 0,
        deck: []
      };
    });

    this.currentJourney = 0;

    this.environment = [];

    this.status = 'game_start';
    this.refreshTimeout();
  }

  newJourney() {
    this.currentJourney++;
    this.startPlayer = (this.startPlayer + 1) % this.players.length;
    this.currentPlayer = this.startPlayer;

    this.players.forEach((value) => {
      const player = this.playerData[value];
      shuffle(player.tile);
      player.tileCurrent = 6;
      player.deck = player.tile.slice(0, 6);
    });
  }
}
