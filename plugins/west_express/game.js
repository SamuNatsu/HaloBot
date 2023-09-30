/// Game model

/* Utils */
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

/* Player colors */
const playerColors = ['🔴', '🟠', '🟡', '🔵', '🟣', '🟤'];

/* Assets tile */
const assetInfoMap = {
  money_bag: {
    name: '钱袋',
    icon: '💰',
    description: '可能装有 250~500 不等的钱，你只能知道在你身上的钱袋的价值'
  },
  diamon: {
    name: '钻石',
    icon: '💎',
    description: '固定 700 价值'
  },
  briefcase: {
    name: '公文包',
    icon: '💼',
    description: '固定 1000 价值'
  }
};
const assetsTile = [
  { type: 'money_bag', icon: '💰', value: 250 },
  { type: 'money_bag', icon: '💰', value: 300 },
  { type: 'money_bag', icon: '💰', value: 350 },
  { type: 'money_bag', icon: '💰', value: 400 },
  { type: 'money_bag', icon: '💰', value: 450 },
  { type: 'money_bag', icon: '💰', value: 500 },
  { type: 'diamon', icon: '💎', value: 700 },
  { type: 'diamon', icon: '💎', value: 700 },
  { type: 'diamon', icon: '💎', value: 700 },
  { type: 'diamon', icon: '💎', value: 700 },
  { type: 'diamon', icon: '💎', value: 700 }
];
const briefcaseCard = { type: 'briefcase', icon: '💼', value: 1000 };

function renderAssetsHelp() {
  return Object.values(assetInfoMap)
    .map((value) => `${value.icon + value.name}：${value.description}`)
    .join('\n');
}
function renderAssets(arr) {
  arr.sort((a, b) => (a.type < b.type ? -1 : 1));
  return arr.reduce((last, cur) => last + cur.icon, '');
}

/* Actions tile */
const actionInfoMap = {
  move: {
    name: '移动',
    icon: '🚶',
    description:
      '如果你在车厢内，那么你可以移动到相邻的车厢内；如果你在车厢顶上，那么你可以最远移动三个车厢到其他的车厢顶上'
  },
  climb: {
    name: '攀爬',
    icon: '🪜',
    description:
      '如果你在车厢内，则移动到该车厢的顶上；如果你在车厢顶上，则移动到该车厢内'
  },
  rob: {
    name: '抢劫',
    icon: '💰',
    description: '如果你所在的位置有财物，那么你可以选择一个拿走'
  },
  shoot: {
    name: '射击',
    icon: '🔫',
    description:
      '如果你在车厢内且相邻车厢内有其他大盗，那么你可以选择一人请他吃一发子弹；如果你在车厢顶上，那么你可以射击任何一个在车厢顶上的其他大盗'
  },
  punch: {
    name: '拳击',
    icon: '👊',
    description:
      '如果你所在的位置有其他大盗，那么你可以选择一人将他击退到相邻的车厢，并任选他身上的一个财物掉落在你所在的位置上'
  },
  sheriff: {
    name: '警长',
    icon: '🤠',
    description: '将警长移动到他所在位置相邻的车厢中'
  },
  bullet: {
    name: '子弹',
    icon: '❌',
    description: '这张牌无法被打出'
  }
};
const actionsTile = [
  { type: 'move', icon: '🚶' },
  { type: 'move', icon: '🚶' },
  { type: 'climb', icon: '🪜' },
  { type: 'climb', icon: '🪜' },
  { type: 'rob', icon: '💰' },
  { type: 'rob', icon: '💰' },
  { type: 'shoot', icon: '🔫' },
  { type: 'shoot', icon: '🔫' },
  { type: 'punch', icon: '👊' },
  { type: 'sheriff', icon: '🤠' }
];
const bulletCard = { type: 'bullet', icon: '❌' };

function renderActionHelp() {
  return Object.values(actionInfoMap)
    .map((value) => `${value.icon + value.name}：${value.description}`)
    .join('\n');
}
function createActionsTile() {
  return JSON.parse(JSON.stringify(actionsTile));
}

/* Journey cards */
const environmentInfoMap = {
  normal: {
    name: '无事发生',
    icon: '🚞',
    description: '快车正常行驶'
  },
  tunnel: {
    name: '经过隧道',
    icon: '🚇',
    description: '伸手不见五指，做了什么事情只有你自己知道'
  },
  fast: {
    name: '列车加速',
    icon: '🚀',
    description: '动作要快，要么连续打出两张行动，要么静待观察'
  },
  reverse: {
    name: '准备倒车',
    icon: '🔙',
    description: '这一轮次的行动顺序会倒着结算'
  }
};
const environmentsTile = [
  { type: 'normal', icon: '🚞' },
  { type: 'tunnel', icon: '🚇' },
  { type: 'fast', icon: '🚀' },
  { type: 'reverse', icon: '🔙' }
];
const eventInfoMap = {
  none: {
    name: '平静的一天',
    icon: '🕊️',
    description: '旅程结束时，什么也不会发生'
  },
  angry: {
    name: '愤怒的警长',
    icon: '💢',
    description:
      '旅程结束时，警长将射击所有在它所在车厢顶上的大盗，随后往车尾移动一格'
  },
  wind: {
    name: '起风了',
    icon: '💨',
    description: '旅程结束时，所有车顶上的大盗移动到车尾顶上'
  },
  break: {
    name: '急刹车',
    icon: '🛑',
    description: '旅程结束时，所有车顶上的大盗向火车头前进一格'
  },
  provoke: {
    name: '有本事你就来',
    icon: '🫵',
    description: '旅程结束时，将一个新的手提箱放到警长当前所在的车厢内'
  },
  revolt: {
    name: '乘客的反抗',
    icon: '💥',
    description: '旅程结束时，所有车厢内的大盗分别吃一发子弹'
  },
  steal: {
    name: '扒窃',
    icon: '🫳',
    description: '旅程结束时，独处的大盗可以从其所在位置拿一个钱袋'
  },
  revenge: {
    name: '警长的复仇',
    icon: '🤠',
    description:
      '旅程结束时，呆在警长所在车厢顶上的大盗分别掉落自己身上价值最低的钱'
  },
  hijack: {
    name: '劫持售票员',
    icon: '😨',
    description: '旅程结束时，所有在火车头的大盗获得价值 250 的钱袋'
  }
};
const eventsTile = [
  { type: 'none', icon: '🕊️' },
  { type: 'angry', icon: '💢' },
  { type: 'wind', icon: '💨' },
  { type: 'break', icon: '🛑' },
  { type: 'provoke', icon: '🫵' },
  { type: 'revolt', icon: '💥' },
  { type: 'steal', icon: '🫳' },
  { type: 'revenge', icon: '🤠' },
  { type: 'hijack', icon: '😨' }
];

function renderEnvironmentHelp() {
  return Object.values(environmentInfoMap)
    .map((value) => `${value.icon + value.name}：${value.description}`)
    .join('\n');
}
function renderEventHelp() {
  return Object.values(eventInfoMap)
    .map((value) => `${value.icon + value.name}：${value.description}`)
    .join('\n');
}
function createJourney(isLast) {
  const len = getRndInt(2, 5);
  const env = [];
  for (let i = 0; i < len; i++) {
    const odd = Math.random();
    if (odd < 0.7) {
      env.push(environmentsTile[0]);
    } else if (odd < 0.8) {
      env.push(environmentsTile[1]);
    } else if (odd < 0.9) {
      env.push(environmentsTile[2]);
    } else {
      env.push(environmentsTile[3]);
    }
  }
  if (isLast) {
    return { environment: env, event: eventsTile[getRndInt(6, 8)] };
  } else {
    return { environment: env, event: eventsTile[getRndInt(0, 5)] };
  }
}
function renderJourney(journey) {
  return (
    journey.environment.reduce((last, cur) => last + cur.icon, '') +
    journey.event.icon
  );
}

/* Task */
function renderTask(task) {
  return task
    .flatMap((v1) =>
      v1.actions.map(
        (v2) =>
          v2.icon + (v1.environment.type === 'tunnel' ? '❓' : v2.action.icon)
      )
    )
    .join('➡️');
}

/* Export class */
export default class Game {
  constructor(masterId, onEnd) {
    this.master = masterId;
    this.players = [masterId];
    this.status = 'waiting_players';

    this.onEnd = onEnd;
    this.refreshTimeout();
  }

  // Action timeout
  refreshTimeout() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(this.onEnd, 300000);
  }
  cleanUp() {
    clearTimeout(this.timeout);
  }

  join(playerId) {
    // Check status
    if (this.status !== 'waiting_players') {
      return false;
    }

    // Check joined
    if (this.players.find((value) => value === playerId) !== undefined) {
      this.refreshTimeout();
      return [
        false,
        `[CQ:at,qq=${playerId}] 你已经在游戏中\n目前已有 ${this.players.length} 名玩家`
      ];
    }

    // Check full
    if (this.players.length >= 6) {
      this.refreshTimeout();
      return [false, '游戏玩家已满\n目前已有 6 名玩家'];
    }

    // Join
    this.players.push(playerId);
    this.refreshTimeout();
    return [
      true,
      `[CQ:at,qq=${playerId}] 加入了游戏\n目前已有 ${this.players.length} 名玩家`
    ];
  }

  leave(playerId) {
    // Check status
    if (this.status !== 'waiting_players') {
      return false;
    }

    // Check is joined
    if (this.players.find((value) => value === playerId) === undefined) {
      return false;
    }

    // Check master leave
    if (playerId === this.master) {
      if (this.players.length === 1) {
        // Game over
        this.cleanUp();
        return [null, '所有玩家都退出了游戏\n本次游戏结束'];
      } else {
        // Change master
        this.players = this.players.filter((value) => value !== playerId);
        this.master = this.players[0];

        this.refreshTimeout();
        return [
          true,
          `房主 [CQ:at,qq=${playerId}] 离开了游戏\n现在 [CQ:at,qq=${this.master}] 是新房主`
        ];
      }
    } else {
      // Remove player
      this.players = this.players.filter((value) => value !== playerId);

      this.refreshTimeout();
      return [
        true,
        `玩家 [CQ:at,qq=${playerId}] 离开了游戏\n目前已有 ${this.players.length} 名玩家`
      ];
    }
  }

  start(operatorId) {
    // Check status and operator
    if (this.status !== 'waiting_players' || operatorId !== this.master) {
      return false;
    }

    // Check minimum player count
    if (this.players.length < 2) {
      this.refreshTimeout();
      return [false, '至少需要 2 名玩家才能开始游戏\n目前已有 1 名玩家'];
    }

    // Lock players
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
    // Check status and operator
    if (this.status !== 'waiting_for_start' || operatorId !== this.master) {
      return false;
    }

    // Unlock players
    this.status = 'waiting_players';
    this.refreshTimeout();
    return [
      true,
      `游戏玩家已解锁\n现在游戏可以继续加入/退出\n目前已有 ${this.players.length} 名玩家`
    ];
  }

  confirm(operatorId) {
    // Check status and operator
    if (this.status !== 'waiting_for_start' || operatorId !== this.master) {
      return false;
    }

    // Update status
    this.status = 'game_setup';
    this.refreshTimeout();
    return [
      true,
      `游戏即将开始\n参与玩家：\n${this.players
        .map((value) => `[CQ:at,qq=${value}]`)
        .join('、')}`
    ];
  }

  setup() {
    // Shuffle players and set start player
    shuffle(this.players);
    this.startPlayer = -1;

    // Police position
    this.policePosition = 0;

    // Setup carriage assets
    this.carriage = [];
    for (let i = -1; i < this.players.length; i++) {
      this.carriage.push({ inner: [], top: [] });
    }
    assetsTile.forEach((value) => {
      this.carriage[getRndInt(0, this.players.length)].inner.push(value);
    });
    this.carriage[0].inner.push(briefcaseCard);

    // Setup player data
    this.playerData = {};
    this.players.forEach((value, index) => {
      this.playerData[value] = {
        icon: playerColors[index],
        bullet: 6,
        tiles: createActionsTile(),
        tileNext: 0,
        assets: [assetsTile[0]],
        inner: true,
        position: this.players.length - (index % 2),
        deck: []
      };
    });

    // Set journey
    this.currentJourney = 0;

    // Update status
    this.status = 'game_start';
    this.refreshTimeout();
    return (
      '玩家的行动顺序和颜色：\n' +
      this.players
        .map((value) => `${this.playerData[value].icon}[CQ:at,qq=${value}]`)
        .join('\n')
    );
  }

  renderCarriage() {
    return this.carriage
      .map((value, index) => {
        let ret = index > 0 ? `🚃车厢 #${index}：` : '🚂车头：';

        // Inner
        ret += '[' + renderAssets(value.inner);
        ret += this.players
          .filter(
            (value) =>
              this.playerData[value].position === index &&
              this.playerData[value].inner
          )
          .map((value) => this.playerData[value].icon)
          .join('');
        if (this.policePosition === index) {
          ret += '🤠';
        }
        ret += ']';

        // Top
        ret += renderAssets(value.top);
        ret += this.players
          .filter(
            (value) =>
              this.playerData[value].position === index &&
              !this.playerData[value].inner
          )
          .map((value) => this.playerData[value].icon)
          .join();

        return ret;
      })
      .join('\n');
  }

  getGameState() {
    // Journey state
    const journey = renderJourney(this.journey);

    // Carriage state
    const carriage = this.renderCarriage();

    return `🏜️旅程 (${this.currentJourney}/5)：${journey}\n\n${carriage}`;
  }

  newJourney() {
    // Update journey
    this.currentJourney++;
    this.journey = createJourney(this.currentJourney === 5);

    // Update start player and current player
    this.startPlayer = (this.startPlayer + 1) % this.players.length;
    this.currentPlayer = this.startPlayer - 1;

    // Reset player tiles
    this.players.forEach((value) => {
      const player = this.playerData[value];

      shuffle(player.tiles);
      player.tileNext = 6;
      player.deck = player.tiles.slice(0, 6);
    });

    // Reset tasks
    this.tasks = [];

    // Refresh
    this.refreshTimeout();
    return (
      (this.currentJourney === 5
        ? '⚠️列车就要到站了！\n'
        : '✨新的旅程开始了！\n') + this.getGameState()
    );
  }

  nextRound() {
    // Update current player
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    const playerId = this.players[this.currentPlayer];

    // Update task
    if (this.currentPlayer === this.startPlayer) {
      if (this.tasks.length === this.journey.environment.length) {
        return false;
      }

      this.tasks.push({
        environment: this.journey.environment[this.tasks.length],
        actions: []
      });
    }

    // Refresh
    const env = this.tasks[this.tasks.length - 1].environment;

    let ret = `${this.playerData[playerId].icon} [CQ:at,qq=${playerId}] 开始行动\n`;
    ret += `🏜️旅程 ${this.currentJourney}/5：${this.journey.environment
      .map((value, index) =>
        this.tasks.length - 1 === index ? `[${value.icon}]` : value.icon
      )
      .join('')}${this.journey.event.icon}\n`;
    ret += `${env.icon}${environmentInfoMap[env.type].name}：${
      environmentInfoMap[env.type].description
    }\n`;
    ret += `📝大家的行动记录：\n` + renderTask(this.tasks);

    this.refreshTimeout();
    return ret;
  }
}

let a = new Game(1, () => {});
a.join(2);
a.join(3);
a.join(4);
a.join(5);
a.join(6);
a.start(1);
a.confirm(1);
console.log(a.setup());
console.log(a.newJourney());
while (1) {
  const ret = a.nextRound();
  if (ret === false) {
    if (a.currentJourney === 5) {
      break;
    }
    console.log(a.newJourney());
    continue;
  }
  console.log(ret);
  a.tasks[a.tasks.length - 1].actions.push({
    playerId: a.players[a.currentPlayer],
    icon: a.playerData[a.players[a.currentPlayer]].icon,
    action: a.playerData[a.players[a.currentPlayer]].deck[0]
  });
}
