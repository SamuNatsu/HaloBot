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

const colors = ['🔴', '🟠', '🟡', '🔵', '🟣', '🟤'];
const assets = [
  250,
  300,
  350,
  400,
  450,
  500,
  'diamond',
  'diamond',
  'diamond',
  'diamond',
  'diamond'
];
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
      this.carriage.push({ inner: [], top: [] });
    }
    assets.forEach((value) => {
      this.carriage[getRndInt(0, this.players.length)].inner.push(value);
    });
    this.carriage[0].inner.push('briefcase');

    this.playerData = {};
    this.players.forEach((value, index) => {
      this.playerData[value] = {
        color: colors[index],
        position: this.players.length - (index % 2),
        inner: true,
        bullet: 6,
        assets: [250],
        tile: Array.from(tile),
        tileCurrent: 0,
        deck: []
      };
    });

    this.currentJourney = 0;

    this.environment = [];
    this.event = 'none';

    this.status = 'game_start';
    this.refreshTimeout();
    return (
      '玩家的行动顺序和颜色：\n' +
      this.players
        .map((value) => `${this.playerData[value].color}[CQ:at,qq=${value}]`)
        .join('\n')
    );
  }

  getGameState() {
    let ret = `🏜️旅程 ${this.currentJourney}/5\n`;

    ret += '📍路途状况：';
    ret += this.environment
      .map((value) =>
        value === 'direct'
          ? '➡️'
          : value === 'tunnel'
          ? '⬛'
          : value === 'reverse'
          ? '↩️'
          : '⏩'
      )
      .join();
    ret += '\n';

    switch (this.event) {
      case 'none':
        ret += '🕊️平静的一天：旅程结束时，什么也不会发生';
        break;
      case 'angry':
        ret +=
          '💢愤怒的警长：旅程结束时，警长将射击所有在它所在车厢顶上的大盗，随后往车尾移动一格';
        break;
      case 'wind':
        ret += '💨起风了：旅程结束时，所有车顶上的大盗移动到车尾顶上';
        break;
      case 'break':
        ret += '🛑急刹车：旅程结束时，所有车顶上的大盗向火车头前进一格';
        break;
      case 'provoke':
        ret +=
          '🫵有本事你就来：旅程结束时，将一个新的手提箱放到警长当前所在的车厢内';
        break;
      case 'revolt':
        ret += '💥乘客的反抗：旅程结束时，所有车厢内的大盗分别吃一发子弹';
        break;
      case 'steal':
        ret += '🫳扒窃：旅程结束时，独处的大盗可以从其所在位置拿一个钱袋';
        break;
      case 'revenge':
        ret +=
          '🔫警长的复仇：旅程结束时，呆在警长所在车厢顶上的大盗分别掉落自己身上价值最低的钱袋';
        break;
      case 'hijack':
        ret +=
          '😨劫持售票员：旅程结束时，所有在火车头的大盗获得价值 250 的钱袋';
        break;
    }
    ret += '\n\n';

    ret += this.carriage
      .map((value, index) => {
        let ret = index === 0 ? '🚂火车头：' : `🚃车厢 #${index}：`;
        value.inner.forEach((value) => {
          if (typeof value === 'number') {
            ret += '💰';
          } else if (value === 'diamond') {
            ret += '💎';
          } else {
            ret += '💼';
          }
        });
        this.players.forEach((value) => {
          const player = this.playerData[value];
          if (player.position === index && player.inner) {
            ret += player.color;
          }
        });
        if (this.policePosition === index) {
          ret += '🤠';
        }
        ret += '|';
        value.top.forEach((value) => {
          if (typeof value === 'number') {
            ret += '💰';
          } else if (value === 'diamond') {
            ret += '💎';
          } else {
            ret += '💼';
          }
        });
        this.players.forEach((value) => {
          const player = this.playerData[value];
          if (player.position === index && !player.inner) {
            ret += player.color;
          }
        });
        return ret;
      })
      .join('\n');
    return ret;
  }

  newJourney() {
    this.currentJourney++;
    this.startPlayer = (this.startPlayer + 1) % this.players.length;
    this.currentPlayer = this.startPlayer - 1;

    this.players.forEach((value) => {
      const player = this.playerData[value];
      shuffle(player.tile);
      player.tileCurrent = 6;
      player.deck = player.tile.slice(0, 6).sort((a, b) => (a < b ? -1 : 1));
    });

    const envLen = getRndInt(2, 5);
    this.environment = [];
    this.actions = [];
    for (let i = 0; i < envLen; i++) {
      const odd = Math.random();
      if (odd < 0.5) {
        this.environment.push('direct');
      } else if (odd < 0.8) {
        this.environment.push('tunnel');
      } else if (odd < 0.9) {
        this.environment.push('reverse');
      } else {
        this.environment.push('speedUp');
      }
    }
    if (this.currentJourney < 5) {
      this.event = event[getRndInt(0, 5)];
    } else {
      this.event = endEvent[getRndInt(0, 2)];
    }
    this.currentEnv = 0;

    this.refreshTimeout();
    return (
      (this.currentJourney === 5
        ? '⚠️列车就要到站了！\n'
        : '✨新的旅程开始了！\n') + this.getGameState()
    );
  }

  nextRound() {
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    const playerId = this.players[this.currentPlayer];

    let ret = `${this.playerData[playerId].color}[CQ:at,qq=${playerId}] 开始行动\n`;
    ret += `🏜️旅程 ${this.currentJourney}/5\n`;
    switch (this.environment[this.currentEnv]) {
      case 'direct':
        ret += '➡️直行：列车正常运行在铁道上\n';
        break;
      case 'tunnel':
        ret += '⬛隧道：伸手不见五指！只有你知道自己干了什么\n';
        break;
      case 'reverse':
        ret += '↩️倒车：在这一轮的行动会倒着结算\n';
        break;
      case 'speedUp':
        ret += '⏩加速：动作快！这一轮你需要连续进行两次行动，或者静待观察\n';
        break;
    }
    ret +=
      `📝大家的行动记录：\n` +
      this.actions
        .map((value, index) =>
          value
            .map((value) => {
              const player = this.playerData[value.player];
              let ret = player.color;

              if (this.environment[index] === 'tunnel') {
                return ret + '❓⬛';
              }

              switch (value.action) {
                case 'move':
                  ret += '🚶';
                  break;
                case 'lift':
                  ret += '🪜';
                  break;
                case 'pick':
                  ret += '💰';
                  break;
                case 'punch':
                  ret += '👊';
                  break;
                case 'shoot':
                  ret += '🔫';
                  break;
                case 'police':
                  ret += '🤠';
                  break;
              }
              return ret + this.environment[index] === 'direct'
                ? '➡️'
                : this.environment[index] === 'reverse'
                ? '↩️'
                : '⏩';
            })
            .join(' → ')
        )
        .join(' → ');

    if (this.actions[this.currentEnv] === undefined) {
      this.actions.push([]);
    }

    if ((this.currentPlayer + 1) % this.players.length === this.startPlayer) {
      this.currentEnv++;
    }
    return ret;
  }
}

let a = new Game(1, () => {});
console.log(a.join(2));
console.log(a.join(3));
console.log(a.join(4));
console.log(a.start(1));
console.log(a.confirm(1));
console.log(a.setup());
console.log(a.newJourney());

console.log(a.nextRound());
a.actions[0].push({ player: 1, action: 'move' });
console.log(a.nextRound());
a.actions[0].push({ player: 2, action: 'shoot' });
console.log(a.nextRound());
a.actions[0].push({ player: 3, action: 'pick' });
console.log(a.nextRound());
a.actions[0].push({ player: 4, action: 'punch' });
console.log(a.nextRound());
a.actions[0].push({ player: 5, action: 'police' });
console.log(a.nextRound());
a.actions[0].push({ player: 6, action: 'lift' });
log(a.nextRound());
