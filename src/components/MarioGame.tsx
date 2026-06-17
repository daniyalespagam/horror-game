import { useEffect, useRef, useState } from 'react';

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Platform = Rect & {
  color: string;
};

type Coin = Rect & {
  taken: boolean;
};

type Enemy = Rect & {
  startX: number;
  endX: number;
  speed: number;
  direction: 1 | -1;
  defeated: boolean;
};

type Boss = Rect & {
  startX: number;
  endX: number;
  speed: number;
  direction: 1 | -1;
  health: number;
  maxHealth: number;
  hurtUntil: number;
};

type GameStatus = 'playing' | 'won' | 'lost';

type HudState = {
  coins: number;
  totalCoins: number;
  level: number;
  lives: number;
  status: GameStatus;
};

type JumpParticle = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  life: number;
  maxLife: number;
};

type Pipe = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type StairBlock = {
  x: number;
  y: number;
  rows: number;
};

type Flag = Rect;

type LevelTheme = {
  sky: string;
  horizon: string;
  ridge: string;
  mountain: string;
  mountainLight: string;
  ground: string;
  groundTop: string;
};

type LevelMap = {
  platforms: Platform[];
  collisionPlatforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
  boss: Boss | null;
  pipes: Pipe[];
  stairBlocks: StairBlock[];
  flag: Flag;
  theme: LevelTheme;
  worldWidth: number;
};

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const BASE_WORLD_WIDTH = 3200;
const TOTAL_LEVELS = 20;
const GRAVITY = 0.75;
const MOVE_SPEED = 5.2;
const JUMP_FORCE = -14.5;
const GROUND_Y = 468;

const platforms: Platform[] = [
  { x: 0, y: GROUND_Y, width: 620, height: 72, color: '#3b8d3a' },
  { x: 700, y: GROUND_Y, width: 420, height: 72, color: '#3b8d3a' },
  { x: 1220, y: GROUND_Y, width: 560, height: 72, color: '#3b8d3a' },
  { x: 1880, y: GROUND_Y, width: 480, height: 72, color: '#3b8d3a' },
  { x: 2440, y: GROUND_Y, width: 760, height: 72, color: '#3b8d3a' },
  { x: 260, y: 372, width: 150, height: 28, color: '#b96b2c' },
  { x: 500, y: 305, width: 150, height: 28, color: '#b96b2c' },
  { x: 820, y: 330, width: 190, height: 28, color: '#b96b2c' },
  { x: 1085, y: 275, width: 150, height: 28, color: '#b96b2c' },
  { x: 1320, y: 345, width: 190, height: 28, color: '#b96b2c' },
  { x: 1585, y: 285, width: 205, height: 28, color: '#b96b2c' },
  { x: 1845, y: 250, width: 170, height: 28, color: '#b96b2c' },
  { x: 2100, y: 342, width: 235, height: 28, color: '#b96b2c' },
  { x: 2375, y: 302, width: 180, height: 28, color: '#b96b2c' },
  { x: 2665, y: 365, width: 170, height: 28, color: '#b96b2c' },
  { x: 2890, y: 315, width: 150, height: 28, color: '#b96b2c' },
  { x: 3025, y: 392, width: 110, height: 28, color: '#b96b2c' },
  { x: 3140, y: 356, width: 60, height: 28, color: '#b96b2c' },
];

const coinLayout: Coin[] = [
  { x: 345, y: 310, width: 24, height: 24, taken: false },
  { x: 420, y: 310, width: 24, height: 24, taken: false },
  { x: 880, y: 285, width: 24, height: 24, taken: false },
  { x: 955, y: 285, width: 24, height: 24, taken: false },
  { x: 1385, y: 300, width: 24, height: 24, taken: false },
  { x: 1710, y: 240, width: 24, height: 24, taken: false },
  { x: 1780, y: 240, width: 24, height: 24, taken: false },
  { x: 2155, y: 295, width: 24, height: 24, taken: false },
  { x: 2245, y: 295, width: 24, height: 24, taken: false },
  { x: 2460, y: 405, width: 24, height: 24, taken: false },
];

const enemyLayout: Enemy[] = [
  { x: 765, y: 426, width: 38, height: 42, startX: 740, endX: 1040, speed: 1.4, direction: 1, defeated: false },
  { x: 1370, y: 426, width: 38, height: 42, startX: 1280, endX: 1710, speed: 1.7, direction: -1, defeated: false },
  { x: 2140, y: 426, width: 38, height: 42, startX: 1960, endX: 2440, speed: 1.5, direction: 1, defeated: false },
  { x: 2720, y: 426, width: 38, height: 42, startX: 2490, endX: 3050, speed: 1.8, direction: -1, defeated: false },
];

const flag = {
  x: 3060,
  y: 275,
  width: 34,
  height: 193,
};

const pipes: Pipe[] = [
  { x: 565, y: 408, width: 54, height: 60 },
  { x: 1162, y: 392, width: 58, height: 76 },
  { x: 1800, y: 408, width: 54, height: 60 },
  { x: 2352, y: 400, width: 56, height: 68 },
  { x: 2860, y: 388, width: 62, height: 80 },
];

const stairBlocks: StairBlock[] = [
  { x: 640, y: 432, rows: 1 },
  { x: 674, y: 404, rows: 2 },
  { x: 708, y: 376, rows: 3 },
  { x: 1778, y: 432, rows: 1 },
  { x: 1812, y: 404, rows: 2 },
  { x: 1846, y: 376, rows: 3 },
  { x: 2925, y: 432, rows: 1 },
  { x: 2959, y: 404, rows: 2 },
  { x: 2993, y: 376, rows: 3 },
];

const levelThemes: LevelTheme[] = [
  { sky: '#82c9f4', horizon: '#bde9ff', ridge: '#75b9df', mountain: '#69a8d0', mountainLight: '#8bc4e2', ground: '#3b8d3a', groundTop: '#67bf57' },
  { sky: '#8fd6c9', horizon: '#caf3df', ridge: '#7bc6b9', mountain: '#63aa9e', mountainLight: '#9fe3d4', ground: '#3d9251', groundTop: '#70c464' },
  { sky: '#f2b56d', horizon: '#ffe3aa', ridge: '#d8935c', mountain: '#c77d4d', mountainLight: '#f3c58b', ground: '#5c9b45', groundTop: '#87c85c' },
  { sky: '#6c99d4', horizon: '#a9ccf1', ridge: '#5f86bd', mountain: '#4f73a5', mountainLight: '#91b5df', ground: '#3b7f5a', groundTop: '#65b96e' },
];

function buildCollisionPlatforms(levelPlatforms: Platform[], levelStairs: StairBlock[]) {
  return [
    ...levelPlatforms,
    ...levelStairs.map((stair) => ({
      x: stair.x,
      y: stair.y - (stair.rows - 1) * 28,
      width: 34,
      height: stair.rows * 28,
      color: '#8d4f25',
    })),
  ];
}

function createLevelMap(level: number): LevelMap {
  const difficulty = level - 1;
  const isBossLevel = level === TOTAL_LEVELS;
  const theme = levelThemes[difficulty % levelThemes.length];
  const worldWidth = BASE_WORLD_WIDTH;
  const levelPlatforms = platforms.map((platform, index) => {
    if (index < 5) {
      return {
        ...platform,
        color: theme.ground,
      };
    }

    const wave = ((index * 7 + difficulty * 5) % 5) - 2;
    const y = Math.max(238, Math.min(388, platform.y + wave * 8));
    const width = Math.max(110, platform.width - (difficulty % 4) * 8 + (index % 2) * 10);

    return {
      ...platform,
      y,
      width,
      color: '#b96b2c',
    };
  });
  const extraCoins = Array.from({ length: Math.min(8, Math.floor(difficulty / 3) + 1) }, (_, index) => ({
    x: 620 + index * 305 + (difficulty % 4) * 18,
    y: 236 + ((index + difficulty) % 4) * 36,
    width: 24,
    height: 24,
    taken: false,
  }));
  const levelCoins = [...coinLayout, ...extraCoins].map((coin, index) => ({
    ...coin,
    y: Math.max(218, Math.min(412, coin.y + (((index + difficulty) % 3) - 1) * 8)),
    taken: false,
  }));
  const levelEnemies = enemyLayout.map((enemy, index) => ({
    ...enemy,
    speed: enemy.speed + difficulty * 0.035 + (index % 2) * 0.08,
    defeated: false,
  })).filter((enemy) => !isBossLevel || enemy.x < 2400);
  const bonusEnemies = Array.from({ length: isBossLevel ? 2 : Math.min(5, Math.floor(difficulty / 6)) }, (_, index) => {
    const startX = 930 + index * 410;

    return {
      x: startX + 30,
      y: 426,
      width: 38,
      height: 42,
      startX,
      endX: startX + 260,
      speed: 1.25 + difficulty * 0.03,
      direction: index % 2 === 0 ? 1 : -1,
      defeated: false,
    } satisfies Enemy;
  });
  const levelStairs = stairBlocks.map((stair, index) => ({
    ...stair,
    rows: Math.min(4, stair.rows + (difficulty + index) % 2),
  }));
  const levelPipes = pipes.map((pipe, index) => ({
    ...pipe,
    height: Math.min(92, pipe.height + ((difficulty + index) % 3) * 4),
    y: pipe.y - ((difficulty + index) % 3) * 4,
  }));
  const boss: Boss | null = isBossLevel
    ? {
        x: 2745,
        y: 376,
        width: 122,
        height: 92,
        startX: 2645,
        endX: 2990,
        speed: 1.05,
        direction: -1,
        health: 3,
        maxHealth: 3,
        hurtUntil: 0,
      }
    : null;

  return {
    platforms: levelPlatforms,
    collisionPlatforms: buildCollisionPlatforms(levelPlatforms, levelStairs),
    coins: levelCoins,
    enemies: [...levelEnemies, ...bonusEnemies],
    boss,
    pipes: levelPipes,
    stairBlocks: levelStairs,
    flag,
    theme,
    worldWidth,
  };
}

function copyCoins(levelCoins: Coin[]) {
  return levelCoins.map((coin) => ({ ...coin, taken: false }));
}

function copyEnemies(levelEnemies: Enemy[]) {
  return levelEnemies.map((enemy) => ({ ...enemy, defeated: false }));
}

function intersects(first: Rect, second: Rect) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function drawPixelRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

export function MarioGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef({ left: false, right: false, jump: false });
  const bossImageRef = useRef<HTMLImageElement | null>(null);
  const [runId, setRunId] = useState(0);
  const [level, setLevel] = useState(1);
  const [hud, setHud] = useState<HudState>({ coins: 0, totalCoins: 0, level: 1, lives: 5, status: 'playing' });

  useEffect(() => {
    const image = new Image();
    image.src = '/boss.png';
    image.onload = () => {
      bossImageRef.current = image;
    };
    image.onerror = () => {
      bossImageRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const contextResult = canvas.getContext('2d');

    if (!contextResult) {
      return;
    }

    const context: CanvasRenderingContext2D = contextResult;
    context.imageSmoothingEnabled = false;
    const levelMap = createLevelMap(level);

    let animationFrame = 0;
    let cameraX = 0;
    let coins = copyCoins(levelMap.coins);
    let enemies = copyEnemies(levelMap.enemies);
    let boss = levelMap.boss ? { ...levelMap.boss } : null;
    let coinCount = 0;
    let lives = 5;
    let status: GameStatus = 'playing';
    let lastHud = '';
    let invincibleUntil = 0;
    let animationTick = 0;
    let jumpParticles: JumpParticle[] = [];
    let advancingLevel = false;

    const player = {
      x: 74,
      y: 260,
      width: 34,
      height: 48,
      velocityX: 0,
      velocityY: 0,
      onGround: false,
      facing: 1 as 1 | -1,
    };

    function publishHud() {
      const nextHud = `${coinCount}-${coins.length}-${level}-${lives}-${status}`;

      if (nextHud !== lastHud) {
        lastHud = nextHud;
        setHud({ coins: coinCount, totalCoins: coins.length, level, lives, status });
      }
    }

    function resetPlayer() {
      player.x = 74;
      player.y = 260;
      player.velocityX = 0;
      player.velocityY = 0;
      player.onGround = false;
      cameraX = 0;
      invincibleUntil = performance.now() + 1000;
    }

    function loseLife() {
      if (performance.now() < invincibleUntil || status !== 'playing') {
        return;
      }

      lives -= 1;

      if (lives <= 0) {
        status = 'lost';
        player.velocityX = 0;
        player.velocityY = 0;
      } else {
        resetPlayer();
      }
    }

    function spawnJumpDust() {
      const dustY = player.y + player.height - 4;
      const dustX = player.x + player.width / 2;
      const burst: JumpParticle[] = [
        { x: dustX - 16, y: dustY, velocityX: -1.9, velocityY: -1.1, size: 7, life: 22, maxLife: 22 },
        { x: dustX - 6, y: dustY + 2, velocityX: -0.9, velocityY: -1.7, size: 5, life: 18, maxLife: 18 },
        { x: dustX + 4, y: dustY + 2, velocityX: 0.9, velocityY: -1.7, size: 5, life: 18, maxLife: 18 },
        { x: dustX + 14, y: dustY, velocityX: 1.9, velocityY: -1.1, size: 7, life: 22, maxLife: 22 },
      ];

      jumpParticles = [...jumpParticles, ...burst];
    }

    function updateJumpEffects() {
      if (!player.onGround && player.velocityY < -2 && animationTick % 8 === 0) {
        jumpParticles.push({
          x: player.x + player.width / 2 - player.facing * 8,
          y: player.y + player.height - 6,
          velocityX: -player.facing * 0.7,
          velocityY: 0.9,
          size: 4,
          life: 12,
          maxLife: 12,
        });
      }

      jumpParticles = jumpParticles
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          velocityY: particle.velocityY + 0.12,
          life: particle.life - 1,
        }))
        .filter((particle) => particle.life > 0);
    }

    function updatePlayer() {
      if (status !== 'playing') {
        return;
      }

      const keys = keysRef.current;
      player.velocityX = 0;

      if (keys.left) {
        player.velocityX = -MOVE_SPEED;
        player.facing = -1;
      }

      if (keys.right) {
        player.velocityX = MOVE_SPEED;
        player.facing = 1;
      }

      if (keys.jump && player.onGround) {
        spawnJumpDust();
        player.velocityY = JUMP_FORCE;
        player.onGround = false;
      }

      player.x += player.velocityX;
      player.x = Math.max(0, Math.min(levelMap.worldWidth - player.width, player.x));

      for (const platform of levelMap.collisionPlatforms) {
        if (!intersects(player, platform)) {
          continue;
        }

        if (player.velocityX > 0) {
          player.x = platform.x - player.width;
        } else if (player.velocityX < 0) {
          player.x = platform.x + platform.width;
        }
      }

      player.velocityY += GRAVITY;
      player.y += player.velocityY;
      player.onGround = false;

      for (const platform of levelMap.collisionPlatforms) {
        if (!intersects(player, platform)) {
          continue;
        }

        if (player.velocityY >= 0 && player.y + player.height - player.velocityY <= platform.y + 8) {
          player.y = platform.y - player.height;
          player.velocityY = 0;
          player.onGround = true;
        } else if (player.velocityY < 0) {
          player.y = platform.y + platform.height;
          player.velocityY = 1;
        }
      }

      if (player.y > CANVAS_HEIGHT + 80) {
        loseLife();
      }
    }

    function updateWorld() {
      for (const enemy of enemies) {
        if (enemy.defeated) {
          continue;
        }

        enemy.x += enemy.speed * enemy.direction;

        if (enemy.x < enemy.startX || enemy.x + enemy.width > enemy.endX) {
          enemy.direction = enemy.direction === 1 ? -1 : 1;
        }

        if (intersects(player, enemy)) {
          const playerWasAbove = player.velocityY > 0 && player.y + player.height - player.velocityY <= enemy.y + 10;

          if (playerWasAbove) {
            enemy.defeated = true;
            player.velocityY = -9;
          } else {
            loseLife();
          }
        }
      }

      for (const coin of coins) {
        if (!coin.taken && intersects(player, coin)) {
          coin.taken = true;
          coinCount += 1;
        }
      }

      if (boss && boss.health > 0) {
        boss.x += boss.speed * boss.direction;

        if (boss.x < boss.startX || boss.x + boss.width > boss.endX) {
          boss.direction = boss.direction === 1 ? -1 : 1;
        }

        if (intersects(player, boss)) {
          const playerWasAbove = player.velocityY > 0 && player.y + player.height - player.velocityY <= boss.y + 18;

          if (playerWasAbove && performance.now() > boss.hurtUntil) {
            boss.health -= 1;
            boss.hurtUntil = performance.now() + 650;
            player.velocityY = -12;

            if (boss.health <= 0) {
              boss.y += 20;
              boss.height = 38;
            }
          } else if (!playerWasAbove) {
            loseLife();
          }
        }
      }

      if (intersects(player, levelMap.flag)) {
        if (boss && boss.health > 0) {
          player.x = levelMap.flag.x - player.width - 8;
          player.velocityX = 0;
          return;
        }

        if (level < TOTAL_LEVELS && !advancingLevel) {
          advancingLevel = true;
          keysRef.current = { left: false, right: false, jump: false };
          setLevel((current) => Math.min(TOTAL_LEVELS, current + 1));
          return;
        }

        status = 'won';
        player.velocityX = 0;
      }

      cameraX = Math.max(0, Math.min(levelMap.worldWidth - CANVAS_WIDTH, player.x - 330));
    }

    function drawBackground() {
      context.fillStyle = levelMap.theme.sky;
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.fillStyle = levelMap.theme.horizon;
      context.fillRect(0, 300, CANVAS_WIDTH, 168);

      context.fillStyle = levelMap.theme.ridge;
      for (let ridgeX = -80 - cameraX * 0.06; ridgeX < CANVAS_WIDTH + 220; ridgeX += 220) {
        drawPixelRect(context, ridgeX, 282, 130, 18);
        drawPixelRect(context, ridgeX + 30, 260, 72, 22);
        drawPixelRect(context, ridgeX + 52, 240, 28, 20);
      }

      context.fillStyle = levelMap.theme.mountain;
      for (let mountainX = -180 - cameraX * 0.12; mountainX < CANVAS_WIDTH + 260; mountainX += 360) {
        drawPixelRect(context, mountainX + 72, 236, 216, 64);
        drawPixelRect(context, mountainX + 116, 188, 128, 48);
        context.fillStyle = levelMap.theme.mountainLight;
        drawPixelRect(context, mountainX + 148, 200, 44, 28);
        context.fillStyle = levelMap.theme.mountain;
      }

      context.fillStyle = '#ffd95a';
      drawPixelRect(context, 760 - cameraX * 0.08, 58, 56, 56);
      context.fillStyle = '#fff0a3';
      drawPixelRect(context, 772 - cameraX * 0.08, 70, 32, 32);

      context.fillStyle = 'rgba(255, 255, 255, 0.78)';
      drawPixelRect(context, 88 - cameraX * 0.22, 72, 96, 24);
      drawPixelRect(context, 112 - cameraX * 0.22, 56, 48, 16);
      drawPixelRect(context, 490 - cameraX * 0.16, 112, 136, 24);
      drawPixelRect(context, 522 - cameraX * 0.16, 96, 64, 16);
      drawPixelRect(context, 820 - cameraX * 0.2, 58, 112, 24);
      drawPixelRect(context, 850 - cameraX * 0.2, 42, 56, 16);
      drawPixelRect(context, 1270 - cameraX * 0.18, 88, 116, 24);
      drawPixelRect(context, 1300 - cameraX * 0.18, 72, 54, 16);
      drawPixelRect(context, 1740 - cameraX * 0.2, 126, 144, 24);
      drawPixelRect(context, 1776 - cameraX * 0.2, 108, 62, 18);

      context.fillStyle = '#5fb35b';
      const firstHillX = 0 - cameraX * 0.38;
      drawPixelRect(context, firstHillX + 48, 428, 360, 40);
      drawPixelRect(context, firstHillX + 96, 392, 264, 36);
      drawPixelRect(context, firstHillX + 152, 360, 152, 32);
      const secondHillX = 1100 - cameraX * 0.3;
      drawPixelRect(context, secondHillX + 90, 420, 470, 48);
      drawPixelRect(context, secondHillX + 158, 380, 330, 40);
      drawPixelRect(context, secondHillX + 226, 340, 196, 40);
      context.fillStyle = '#3d9144';
      drawPixelRect(context, firstHillX + 178, 370, 28, 10);
      drawPixelRect(context, firstHillX + 245, 410, 42, 10);
      drawPixelRect(context, secondHillX + 255, 354, 34, 10);
      drawPixelRect(context, secondHillX + 382, 402, 50, 10);

      context.fillStyle = '#d4893e';
      for (let blockX = 520 - cameraX; blockX <= 620 - cameraX; blockX += 34) {
        drawPixelRect(context, blockX, 292, 28, 28);
        context.fillStyle = '#f2b84b';
        drawPixelRect(context, blockX + 4, 296, 20, 4);
        drawPixelRect(context, blockX + 12, 304, 6, 10);
        context.fillStyle = '#d4893e';
      }

      for (let blockX = 1460 - cameraX; blockX <= 1530 - cameraX; blockX += 34) {
        drawPixelRect(context, blockX, 250, 28, 28);
        context.fillStyle = '#f2b84b';
        drawPixelRect(context, blockX + 4, 254, 20, 4);
        drawPixelRect(context, blockX + 12, 262, 6, 10);
        context.fillStyle = '#d4893e';
      }

      for (let blockX = 2520 - cameraX; blockX <= 2622 - cameraX; blockX += 34) {
        drawPixelRect(context, blockX, 270, 28, 28);
        context.fillStyle = '#f2b84b';
        drawPixelRect(context, blockX + 4, 274, 20, 4);
        drawPixelRect(context, blockX + 12, 282, 6, 10);
        context.fillStyle = '#d4893e';
      }

      context.fillStyle = '#d4893e';
      for (let blockX = 3058 - cameraX; blockX <= 3126 - cameraX; blockX += 34) {
        drawPixelRect(context, blockX, 246, 28, 28);
        context.fillStyle = '#f2b84b';
        drawPixelRect(context, blockX + 4, 250, 20, 4);
        drawPixelRect(context, blockX + 12, 258, 6, 10);
        context.fillStyle = '#d4893e';
      }
    }

    function drawMapDecorations() {
      context.fillStyle = '#f6d557';
      for (let flowerX = 120 - cameraX; flowerX < levelMap.worldWidth - cameraX; flowerX += 185) {
        const flowerY = 452 + (Math.floor((flowerX + cameraX) / 185) % 2) * 6;
        drawPixelRect(context, flowerX, flowerY, 4, 4);
        drawPixelRect(context, flowerX + 8, flowerY, 4, 4);
        drawPixelRect(context, flowerX + 4, flowerY - 4, 4, 4);
        drawPixelRect(context, flowerX + 4, flowerY + 4, 4, 4);
        context.fillStyle = '#4b9b3f';
        drawPixelRect(context, flowerX + 5, flowerY + 8, 2, 8);
        context.fillStyle = '#f6d557';
      }

      context.fillStyle = '#2d7b36';
      for (let grassX = 48 - cameraX; grassX < levelMap.worldWidth - cameraX; grassX += 74) {
        drawPixelRect(context, grassX, 456, 4, 12);
        drawPixelRect(context, grassX + 5, 460, 4, 8);
        drawPixelRect(context, grassX + 11, 452, 4, 16);
      }

      for (const stair of levelMap.stairBlocks) {
        const x = stair.x - cameraX;

        for (let row = 0; row < stair.rows; row += 1) {
          context.fillStyle = '#8d4f25';
          drawPixelRect(context, x, stair.y - row * 28, 34, 28);
          context.fillStyle = '#c67a38';
          drawPixelRect(context, x + 3, stair.y + 3 - row * 28, 28, 5);
          context.fillStyle = '#603319';
          drawPixelRect(context, x + 4, stair.y + 18 - row * 28, 22, 4);
        }
      }

      for (const pipe of levelMap.pipes) {
        const x = pipe.x - cameraX;

        context.fillStyle = '#145c42';
        drawPixelRect(context, x - 5, pipe.y - 10, pipe.width + 10, 16);
        context.fillStyle = '#0b3327';
        drawPixelRect(context, x - 8, pipe.y - 13, pipe.width + 16, 4);
        context.fillStyle = '#23945f';
        drawPixelRect(context, x, pipe.y, pipe.width, pipe.height);
        context.fillStyle = '#35c27a';
        drawPixelRect(context, x + 7, pipe.y + 4, 10, pipe.height - 8);
        drawPixelRect(context, x + 20, pipe.y + 12, 5, pipe.height - 20);
        context.fillStyle = '#0f4432';
        drawPixelRect(context, x + pipe.width - 10, pipe.y + 4, 6, pipe.height - 8);
        context.fillStyle = '#083325';
        drawPixelRect(context, x - 5, pipe.y + 4, pipe.width + 10, 4);
      }

      const bushPositions = [170, 1035, 1265, 1985, 2220, 2740, 2995];
      for (const bushX of bushPositions) {
        const x = bushX - cameraX;
        context.fillStyle = '#236d38';
        drawPixelRect(context, x, 440, 62, 28);
        drawPixelRect(context, x + 14, 424, 34, 18);
        context.fillStyle = '#48a64e';
        drawPixelRect(context, x + 8, 434, 14, 12);
        drawPixelRect(context, x + 34, 430, 14, 12);
      }

      const stonePositions = [665, 1184, 1818, 2415, 3088];
      for (const stoneX of stonePositions) {
        const x = stoneX - cameraX;
        context.fillStyle = '#8a8f96';
        drawPixelRect(context, x, 448, 28, 20);
        context.fillStyle = '#c3c8cf';
        drawPixelRect(context, x + 5, 452, 10, 4);
        context.fillStyle = '#59616b';
        drawPixelRect(context, x + 18, 460, 7, 4);
      }

      const bridgeX = 2446 - cameraX;
      context.fillStyle = '#70421f';
      drawPixelRect(context, bridgeX, 438, 132, 10);
      context.fillStyle = '#9c6732';
      for (let plankX = bridgeX + 4; plankX < bridgeX + 128; plankX += 18) {
        drawPixelRect(context, plankX, 430, 12, 18);
      }
      context.fillStyle = '#4d2c17';
      drawPixelRect(context, bridgeX, 448, 132, 4);

      const castleX = levelMap.flag.x + 40 - cameraX;
      context.fillStyle = '#6c7080';
      drawPixelRect(context, castleX, 380, 78, 88);
      context.fillStyle = '#8b91a3';
      drawPixelRect(context, castleX + 10, 356, 18, 24);
      drawPixelRect(context, castleX + 50, 356, 18, 24);
      drawPixelRect(context, castleX + 28, 332, 22, 48);
      context.fillStyle = '#4a4e5a';
      drawPixelRect(context, castleX + 28, 428, 24, 40);
      drawPixelRect(context, castleX + 14, 392, 10, 14);
      drawPixelRect(context, castleX + 54, 392, 10, 14);
      context.fillStyle = '#b8becd';
      drawPixelRect(context, castleX + 8, 364, 22, 6);
      drawPixelRect(context, castleX + 48, 364, 22, 6);
      drawPixelRect(context, castleX + 27, 340, 24, 6);
      context.fillStyle = '#353944';
      for (let brickY = 386; brickY < 460; brickY += 16) {
        drawPixelRect(context, castleX + 8, brickY, 14, 3);
        drawPixelRect(context, castleX + 34, brickY + 6, 18, 3);
        drawPixelRect(context, castleX + 58, brickY, 12, 3);
      }
    }

    function drawPlatforms() {
      for (const platform of levelMap.platforms) {
        const x = platform.x - cameraX;

        context.fillStyle = platform.color;
        drawPixelRect(context, x, platform.y, platform.width, platform.height);
        context.fillStyle = platform.color === levelMap.theme.ground ? levelMap.theme.groundTop : '#d4893e';
        drawPixelRect(context, x, platform.y, platform.width, 12);

        context.fillStyle = platform.color === levelMap.theme.ground ? '#286829' : '#7e421d';
        for (let blockX = x; blockX < x + platform.width; blockX += 42) {
          drawPixelRect(context, blockX + 5, platform.y + 20, 24, 5);
        }

        if (platform.color === levelMap.theme.ground) {
          context.fillStyle = '#2b7130';
          for (let tileX = x + 16; tileX < x + platform.width; tileX += 54) {
            drawPixelRect(context, tileX, platform.y + 34, 18, 5);
            drawPixelRect(context, tileX + 24, platform.y + 52, 12, 4);
          }
        } else {
          context.fillStyle = '#6f391b';
          for (let tileX = x + 8; tileX < x + platform.width; tileX += 32) {
            drawPixelRect(context, tileX, platform.y + 8, 18, 3);
            drawPixelRect(context, tileX + 8, platform.y + 19, 18, 3);
          }
        }
      }
    }

    function drawCoins() {
      for (const coin of coins) {
        if (coin.taken) {
          continue;
        }

        const x = coin.x - cameraX;
        const bob = Math.round(Math.sin(animationTick / 12 + coin.x * 0.04) * 3);
        const y = coin.y + bob;
        context.fillStyle = '#ffd84d';
        drawPixelRect(context, x + 8, y, 8, 4);
        drawPixelRect(context, x + 4, y + 4, 16, 16);
        drawPixelRect(context, x + 8, y + 20, 8, 4);
        context.fillStyle = '#b87912';
        drawPixelRect(context, x + 10, y + 6, 4, 12);
      }
    }

    function drawEnemies() {
      for (const enemy of enemies) {
        if (enemy.defeated) {
          continue;
        }

        const x = enemy.x - cameraX;
        const y = enemy.y;
        const step = Math.floor(animationTick / 10 + enemy.x * 0.03) % 2;
        const leftFootY = y + 41 + step;
        const rightFootY = y + 41 + (step === 0 ? 1 : 0);

        context.fillStyle = 'rgba(34, 30, 24, 0.2)';
        drawPixelRect(context, x + 1, y + 45, 36, 4);

        context.fillStyle = '#24120e';
        drawPixelRect(context, x + 7, y + 3, 24, 5);
        drawPixelRect(context, x + 3, y + 8, 32, 8);
        drawPixelRect(context, x, y + 15, 38, 23);
        drawPixelRect(context, x + 1, leftFootY, 15, 5);
        drawPixelRect(context, x + 22, rightFootY, 15, 5);

        context.fillStyle = '#5f2d24';
        drawPixelRect(context, x + 8, y + 4, 22, 5);
        drawPixelRect(context, x + 4, y + 9, 30, 7);
        context.fillStyle = '#8d432e';
        drawPixelRect(context, x + 2, y + 16, 34, 7);
        drawPixelRect(context, x, y + 23, 38, 14);
        context.fillStyle = '#c96e43';
        drawPixelRect(context, x + 5, y + 16, 26, 5);
        drawPixelRect(context, x + 4, y + 25, 30, 6);
        context.fillStyle = '#e08a56';
        drawPixelRect(context, x + 9, y + 17, 10, 3);
        drawPixelRect(context, x + 7, y + 26, 14, 3);

        context.fillStyle = '#f7e2c3';
        drawPixelRect(context, x + 8, y + 19, 8, 8);
        drawPixelRect(context, x + 23, y + 19, 8, 8);
        context.fillStyle = '#161616';
        drawPixelRect(context, x + 11, y + 21, 3, 4);
        drawPixelRect(context, x + 24, y + 21, 3, 4);
        context.fillStyle = '#ffffff';
        drawPixelRect(context, x + 11, y + 21, 1, 1);
        drawPixelRect(context, x + 24, y + 21, 1, 1);
        context.fillStyle = '#3b1b16';
        drawPixelRect(context, x + 6, y + 15, 12, 3);
        drawPixelRect(context, x + 21, y + 15, 12, 3);
        context.fillStyle = '#2a120f';
        drawPixelRect(context, x + 8, y + 14, 8, 2);
        drawPixelRect(context, x + 23, y + 14, 8, 2);

        context.fillStyle = '#2d1712';
        drawPixelRect(context, x + 11, y + 30, 16, 4);
        context.fillStyle = '#f7e2c3';
        drawPixelRect(context, x + 13, y + 34, 4, 4);
        drawPixelRect(context, x + 21, y + 34, 4, 4);
        context.fillStyle = '#2d1712';
        drawPixelRect(context, x + 17, y + 35, 4, 2);

        context.fillStyle = '#6b3324';
        drawPixelRect(context, x - 2, y + 27, 5, 8);
        drawPixelRect(context, x + 35, y + 27, 5, 8);
        context.fillStyle = '#3a1a14';
        drawPixelRect(context, x - 3, y + 34, 6, 3);
        drawPixelRect(context, x + 35, y + 34, 6, 3);

        context.fillStyle = '#442019';
        drawPixelRect(context, x + 2, y + 36, 12, 6);
        drawPixelRect(context, x + 24, y + 36, 12, 6);
        context.fillStyle = '#21100d';
        drawPixelRect(context, x + 1, leftFootY, 14, 4);
        drawPixelRect(context, x + 23, rightFootY, 14, 4);
      }
    }

    function drawBoss() {
      if (!boss || boss.health <= 0) {
        return;
      }

      const currentBoss = boss;
      const x = currentBoss.x - cameraX;
      const y = currentBoss.y;
      const step = Math.floor(animationTick / 12) % 2;
      const isHurt = performance.now() < currentBoss.hurtUntil && Math.floor(animationTick / 4) % 2 === 0;
      const bossImage = bossImageRef.current;

      if (bossImage) {
        context.globalAlpha = isHurt ? 0.65 : 1;
        context.drawImage(bossImage, Math.round(x - 34), Math.round(y - 18), 176, 126);
        context.globalAlpha = 1;
        context.fillStyle = '#24130f';
        drawPixelRect(context, 318, 20, 324, 22);
        context.fillStyle = '#e84a3a';
        drawPixelRect(context, 322, 24, (316 * currentBoss.health) / currentBoss.maxHealth, 14);
        context.fillStyle = '#ffffff';
        context.font = '700 14px Inter, sans-serif';
        context.fillText('BOWSER', 444, 36);
        return;
      }

      context.fillStyle = 'rgba(34, 30, 24, 0.24)';
      drawPixelRect(context, x + 22, y + 88, 98, 6);

      const flashGreen = isHurt ? '#65d85a' : '#08a91a';
      const darkGreen = isHurt ? '#2f8f35' : '#047a16';
      const orange = isHurt ? '#ffc46e' : '#ffa33f';
      const cream = '#f8f8ef';
      const outline = '#111111';

      context.fillStyle = outline;
      drawPixelRect(context, x + 22, y + 4, 46, 12);
      drawPixelRect(context, x + 15, y + 15, 64, 24);
      drawPixelRect(context, x + 4, y + 31, 70, 28);
      drawPixelRect(context, x + 30, y + 54, 34, 36);
      drawPixelRect(context, x + 58, y + 24, 64, 58);
      drawPixelRect(context, x + 80, y + 48, 46, 42);
      drawPixelRect(context, x + 52, y + 72, 28, 18);
      drawPixelRect(context, x + 88, y + 86, 42, 12);

      context.fillStyle = flashGreen;
      drawPixelRect(context, x + 31, y + 5, 34, 16);
      drawPixelRect(context, x + 24, y + 18, 45, 24);
      drawPixelRect(context, x + 18, y + 34, 36, 20);
      drawPixelRect(context, x + 42, y + 56, 22, 30);
      drawPixelRect(context, x + 62, y + 30, 54, 48);
      drawPixelRect(context, x + 84, y + 54, 36, 32);
      drawPixelRect(context, x + 56, y + 76, 24, 14);

      context.fillStyle = cream;
      drawPixelRect(context, x + 44, y, 16, 8);
      drawPixelRect(context, x + 58, y - 6, 10, 10);
      drawPixelRect(context, x + 16, y + 18, 12, 22);
      drawPixelRect(context, x + 34, y + 42, 16, 11);
      drawPixelRect(context, x + 64, y + 72, 16, 11);
      drawPixelRect(context, x + 78, y + 38, 18, 14);
      drawPixelRect(context, x + 102, y + 46, 14, 14);
      drawPixelRect(context, x + 102, y + 70, 18, 12);

      context.fillStyle = orange;
      drawPixelRect(context, x + 7, y + 27, 21, 22);
      drawPixelRect(context, x + 24, y + 44, 24, 12);
      drawPixelRect(context, x + 34, y + 53, 18, 31);
      drawPixelRect(context, x + 50, y + 66, 22, 16);
      drawPixelRect(context, x + 82, y + 89, 42, 9);
      drawPixelRect(context, x + 94, y + 96, 18, 14);
      drawPixelRect(context, x + 114, y + 95, 19, 8);

      context.fillStyle = darkGreen;
      drawPixelRect(context, x + 35, y + 17, 13, 12);
      drawPixelRect(context, x + 57, y + 18, 14, 30);
      drawPixelRect(context, x + 44, y + 70, 12, 20);
      drawPixelRect(context, x + 70, y + 30, 18, 22);
      drawPixelRect(context, x + 98, y + 57, 18, 18);

      context.fillStyle = outline;
      drawPixelRect(context, x + 13, y + 20, 4, 13);
      drawPixelRect(context, x + 23, y + 18, 4, 7);
      drawPixelRect(context, x + 31, y + 53, 5, 22);
      drawPixelRect(context, x + 50, y + 66, 5, 18);
      drawPixelRect(context, x + 62, y + 64, 11, 5);
      drawPixelRect(context, x + 90, y + 88 + step, 15, 6);
      drawPixelRect(context, x + 115, y + 87 - step, 18, 6);

      context.fillStyle = cream;
      drawPixelRect(context, x + 88, y + 26, 10, 12);
      drawPixelRect(context, x + 106, y + 28, 10, 12);
      drawPixelRect(context, x + 120, y + 42, 8, 12);
      drawPixelRect(context, x + 120, y + 62, 8, 12);
      drawPixelRect(context, x + 112, y + 84, 8, 10);

      context.fillStyle = outline;
      drawPixelRect(context, x + 13, y + 25, 4, 7);
      context.fillStyle = '#ffffff';
      drawPixelRect(context, x + 14, y + 25, 1, 1);

      context.fillStyle = '#24130f';
      drawPixelRect(context, 318, 20, 324, 22);
      context.fillStyle = '#e84a3a';
      drawPixelRect(context, 322, 24, (316 * currentBoss.health) / currentBoss.maxHealth, 14);
      context.fillStyle = '#ffffff';
      context.font = '700 14px Inter, sans-serif';
      context.fillText('BOWSER', 444, 36);
      return;

      context.fillStyle = 'rgba(34, 30, 24, 0.28)';
      drawPixelRect(context, x + 4, y + currentBoss.height - 3, currentBoss.width - 8, 8);

      const fireX = x - 128 + Math.round(Math.sin(animationTick / 6) * 4);
      const fireY = y + 28;
      context.fillStyle = '#e33b2f';
      drawPixelRect(context, fireX, fireY + 18, 70, 12);
      drawPixelRect(context, fireX + 18, fireY + 6, 96, 28);
      drawPixelRect(context, fireX + 88, fireY + 12, 28, 18);
      drawPixelRect(context, fireX + 14, fireY + 32, 42, 14);
      context.fillStyle = '#ff7a2c';
      drawPixelRect(context, fireX + 30, fireY + 13, 60, 8);
      drawPixelRect(context, fireX + 48, fireY + 24, 44, 8);
      context.fillStyle = '#ffd35a';
      drawPixelRect(context, fireX + 48, fireY + 16, 28, 5);
      drawPixelRect(context, fireX + 70, fireY + 25, 20, 5);

      context.fillStyle = '#25120d';
      drawPixelRect(context, x - 18, y + 52, 24, 11);
      drawPixelRect(context, x - 28, y + 47, 13, 9);
      drawPixelRect(context, x + 1, y + 18, 38, 46);
      drawPixelRect(context, x + 8, y + 12, 76, 46);
      drawPixelRect(context, x + 16, y, 58, 20);
      drawPixelRect(context, x + 4, y + 50, 82, 20);
      drawPixelRect(context, x + 7, y + 68 + step, 24, 12);
      drawPixelRect(context, x + 58, y + 69 - step, 24, 11);

      context.fillStyle = '#102d21';
      drawPixelRect(context, x - 4, y + 18, 44, 48);
      context.fillStyle = '#f3e7b5';
      drawPixelRect(context, x - 3, y + 18, 8, 44);
      drawPixelRect(context, x + 31, y + 20, 8, 38);
      drawPixelRect(context, x + 6, y + 12, 7, 9);
      drawPixelRect(context, x + 18, y + 8, 8, 10);
      drawPixelRect(context, x + 31, y + 13, 7, 9);
      context.fillStyle = '#1f6f3c';
      drawPixelRect(context, x + 1, y + 22, 36, 38);
      context.fillStyle = '#2f9a4f';
      drawPixelRect(context, x + 7, y + 26, 25, 28);
      context.fillStyle = '#d99a32';
      drawPixelRect(context, x - 17, y + 53, 22, 9);
      drawPixelRect(context, x - 27, y + 48, 12, 8);
      context.fillStyle = '#f0d166';
      drawPixelRect(context, x - 31, y + 45, 7, 7);
      context.fillStyle = '#f2e2a4';
      drawPixelRect(context, x + 2, y + 18, 8, 10);
      drawPixelRect(context, x + 16, y + 13, 9, 12);
      drawPixelRect(context, x + 30, y + 19, 8, 10);

      context.fillStyle = isHurt ? '#f4c65e' : '#d99a32';
      drawPixelRect(context, x + 26, y + 12, 56, 42);
      drawPixelRect(context, x + 38, y + 2, 36, 22);
      drawPixelRect(context, x + 60, y + 30, 24, 18);
      context.fillStyle = '#f4bd50';
      drawPixelRect(context, x + 32, y + 18, 42, 16);
      drawPixelRect(context, x + 63, y + 33, 16, 9);
      context.fillStyle = isHurt ? '#f7e48b' : '#e0c756';
      drawPixelRect(context, x + 27, y + 34, 52, 24);
      drawPixelRect(context, x + 61, y + 42, 24, 13);
      context.fillStyle = '#c77b2c';
      drawPixelRect(context, x + 66, y + 35, 14, 4);
      drawPixelRect(context, x + 72, y + 40, 8, 4);
      context.fillStyle = '#2f6f32';
      drawPixelRect(context, x + 10, y + 32, 12, 24);
      drawPixelRect(context, x + 72, y + 32, 12, 24);

      context.fillStyle = '#1f5b2a';
      drawPixelRect(context, x + 8, y + 20, 18, 34);
      drawPixelRect(context, x + 68, y + 20, 18, 34);
      context.fillStyle = '#111111';
      drawPixelRect(context, x + 9, y + 35, 16, 8);
      drawPixelRect(context, x + 68, y + 35, 16, 8);
      context.fillStyle = '#f4e0a0';
      drawPixelRect(context, x + 11, y + 33, 7, 7);
      drawPixelRect(context, x + 20, y + 34, 7, 7);
      drawPixelRect(context, x + 67, y + 34, 7, 7);
      drawPixelRect(context, x + 76, y + 33, 7, 7);

      context.fillStyle = '#fff0c4';
      drawPixelRect(context, x + 42, y + 18, 13, 12);
      drawPixelRect(context, x + 61, y + 18, 13, 12);
      context.fillStyle = '#101010';
      drawPixelRect(context, x + 47, y + 22, 5, 7);
      drawPixelRect(context, x + 62, y + 22, 5, 7);
      context.fillStyle = '#ffffff';
      drawPixelRect(context, x + 48, y + 22, 1, 1);
      drawPixelRect(context, x + 63, y + 22, 1, 1);
      context.fillStyle = '#2a120e';
      drawPixelRect(context, x + 38, y + 15, 19, 4);
      drawPixelRect(context, x + 59, y + 15, 19, 4);
      context.fillStyle = '#5c2b18';
      drawPixelRect(context, x + 68, y + 34, 10, 4);
      context.fillStyle = '#20120d';
      drawPixelRect(context, x + 80, y + 33, 5, 4);
      drawPixelRect(context, x + 89, y + 34, 4, 3);

      context.fillStyle = '#2a120e';
      drawPixelRect(context, x + 42, y + 42, 32, 8);
      drawPixelRect(context, x + 69, y + 38, 12, 5);
      context.fillStyle = '#f35d2d';
      drawPixelRect(context, x + 50, y + 45, 16, 4);
      if (Math.floor(animationTick / 9) % 2 === 0) {
        context.fillStyle = '#ffcc36';
        drawPixelRect(context, x + 52, y + 50, 10, 8);
        context.fillStyle = '#ff6b2e';
        drawPixelRect(context, x + 58, y + 48, 12, 12);
        context.fillStyle = '#e33723';
        drawPixelRect(context, x + 68, y + 52, 9, 8);
      }
      context.fillStyle = '#f8e4bd';
      drawPixelRect(context, x + 42, y + 49, 6, 8);
      drawPixelRect(context, x + 56, y + 50, 5, 7);
      drawPixelRect(context, x + 67, y + 49, 6, 8);
      drawPixelRect(context, x + 76, y + 45, 6, 7);
      drawPixelRect(context, x + 85, y + 44, 5, 6);
      drawPixelRect(context, x + 70, y + 36, 5, 6);
      drawPixelRect(context, x + 79, y + 36, 5, 6);
      context.fillStyle = '#20120d';
      drawPixelRect(context, x + 69, y + 33, 4, 3);
      drawPixelRect(context, x + 79, y + 33, 4, 3);

      context.fillStyle = '#f0d166';
      drawPixelRect(context, x + 33, y - 9, 12, 14);
      drawPixelRect(context, x + 69, y - 9, 12, 14);
      context.fillStyle = '#fff0b7';
      drawPixelRect(context, x + 35, y - 13, 7, 7);
      drawPixelRect(context, x + 72, y - 13, 7, 7);
      context.fillStyle = '#e06b2e';
      drawPixelRect(context, x + 15, y + 22, 8, 10);
      drawPixelRect(context, x + 19, y + 33, 8, 10);
      drawPixelRect(context, x + 30, y - 2, 8, 11);
      drawPixelRect(context, x + 42, y - 5, 9, 13);
      drawPixelRect(context, x + 54, y - 7, 10, 14);
      drawPixelRect(context, x + 66, y - 5, 9, 13);
      drawPixelRect(context, x + 78, y + 4, 8, 10);
      drawPixelRect(context, x + 84, y + 12, 7, 10);
      drawPixelRect(context, x + 35, y + 3, 10, 10);
      drawPixelRect(context, x + 72, y + 3, 10, 10);
      context.fillStyle = '#b93422';
      drawPixelRect(context, x + 17, y + 25, 6, 7);
      drawPixelRect(context, x + 21, y + 36, 6, 7);
      drawPixelRect(context, x + 42, y - 1, 7, 8);
      drawPixelRect(context, x + 56, y - 2, 7, 8);
      drawPixelRect(context, x + 69, y, 7, 7);
      drawPixelRect(context, x + 84, y + 15, 5, 7);
      context.fillStyle = '#332015';
      drawPixelRect(context, x + 10, y + 57, 18, 13);
      drawPixelRect(context, x + 62, y + 57, 18, 13);
      context.fillStyle = '#101010';
      drawPixelRect(context, x + 8, y + 56, 22, 7);
      drawPixelRect(context, x + 61, y + 56, 22, 7);
      context.fillStyle = '#f0d166';
      drawPixelRect(context, x + 12, y + 58, 7, 7);
      drawPixelRect(context, x + 24, y + 59, 7, 7);
      drawPixelRect(context, x + 64, y + 59, 7, 7);
      drawPixelRect(context, x + 76, y + 58, 7, 7);

      context.fillStyle = '#f4e7ba';
      drawPixelRect(context, x - 2, y + 16, 46, 7);
      drawPixelRect(context, x - 2, y + 60, 46, 7);
      drawPixelRect(context, x - 5, y + 24, 7, 36);
      context.fillStyle = '#0d2d20';
      drawPixelRect(context, x + 2, y + 24, 36, 35);
      context.fillStyle = '#228344';
      drawPixelRect(context, x + 8, y + 28, 25, 25);
      context.fillStyle = '#f7efe0';
      drawPixelRect(context, x + 3, y + 12, 9, 11);
      drawPixelRect(context, x + 17, y + 7, 10, 12);
      drawPixelRect(context, x + 32, y + 13, 9, 11);

      context.fillStyle = '#d88b2d';
      drawPixelRect(context, x + 50, y + 8, 46, 32);
      drawPixelRect(context, x + 74, y + 32, 32, 18);
      context.fillStyle = '#f6bd4f';
      drawPixelRect(context, x + 56, y + 14, 28, 14);
      drawPixelRect(context, x + 78, y + 35, 20, 8);
      context.fillStyle = '#2a120e';
      drawPixelRect(context, x + 80, y + 43, 22, 8);
      context.fillStyle = '#f8e4bd';
      drawPixelRect(context, x + 84, y + 50, 6, 8);
      drawPixelRect(context, x + 96, y + 48, 6, 8);
      context.fillStyle = '#20120d';
      drawPixelRect(context, x + 88, y + 36, 4, 3);
      drawPixelRect(context, x + 98, y + 37, 4, 3);

      context.fillStyle = '#fff0c4';
      drawPixelRect(context, x + 56, y + 18, 12, 11);
      drawPixelRect(context, x + 74, y + 18, 12, 11);
      context.fillStyle = '#101010';
      drawPixelRect(context, x + 60, y + 21, 4, 7);
      drawPixelRect(context, x + 75, y + 21, 4, 7);
      context.fillStyle = '#c92b20';
      drawPixelRect(context, x + 51, y + 12, 18, 4);
      drawPixelRect(context, x + 72, y + 12, 18, 4);

      context.fillStyle = '#e06b2e';
      drawPixelRect(context, x + 38, y - 4, 9, 12);
      drawPixelRect(context, x + 51, y - 8, 10, 15);
      drawPixelRect(context, x + 65, y - 8, 10, 15);
      drawPixelRect(context, x + 79, y - 4, 9, 12);
      drawPixelRect(context, x + 89, y + 8, 8, 11);
      context.fillStyle = '#b93422';
      drawPixelRect(context, x + 53, y - 2, 7, 9);
      drawPixelRect(context, x + 67, y - 2, 7, 9);
      drawPixelRect(context, x + 81, y + 2, 6, 8);

      context.fillStyle = '#24130f';
      drawPixelRect(context, x + 7, y + 70 + step, 24, 8);
      drawPixelRect(context, x + 58, y + 70 - step, 24, 8);

      context.fillStyle = '#24130f';
      drawPixelRect(context, 318, 20, 324, 22);
      context.fillStyle = '#e84a3a';
      drawPixelRect(context, 322, 24, (316 * currentBoss.health) / currentBoss.maxHealth, 14);
      context.fillStyle = '#ffffff';
      context.font = '700 14px Inter, sans-serif';
      context.fillText('BOWSER', 444, 36);
    }

    function drawFlag() {
      const x = levelMap.flag.x - cameraX;
      context.fillStyle = '#3f5d4e';
      drawPixelRect(context, x + 10, levelMap.flag.y, 8, levelMap.flag.height);
      context.fillStyle = '#253a30';
      drawPixelRect(context, x + 4, levelMap.flag.y + levelMap.flag.height, 20, 8);
      context.fillStyle = '#f5524b';
      drawPixelRect(context, x + 18, levelMap.flag.y + 12 + Math.round(Math.sin(animationTick / 18) * 2), 72, 16);
      drawPixelRect(context, x + 18, levelMap.flag.y + 28, 56, 16);
      drawPixelRect(context, x + 18, levelMap.flag.y + 44, 32, 16);
    }

    function drawPlayer() {
      const x = player.x - cameraX;
      const y = player.y;
      const faceSide = player.facing === 1 ? 1 : -1;
      const faceX = player.facing === 1 ? x + 11 : x + 7;
      const eyeX = player.facing === 1 ? x + 24 : x + 10;
      const noseX = player.facing === 1 ? x + 26 : x + 5;
      const mustacheX = player.facing === 1 ? x + 18 : x + 10;
      const isRunning = Math.abs(player.velocityX) > 0.1 && player.onGround;
      const step = isRunning ? Math.floor(animationTick / 7) % 2 : 0;
      const leftFootY = player.y + 46 + step * 2;
      const rightFootY = player.y + 46 + (step === 0 ? 2 : 0);
      const leftArmY = player.y + 29 + (step === 0 ? 0 : 3);
      const rightArmY = player.y + 29 + (step === 0 ? 3 : 0);
      const isBlinking = performance.now() < invincibleUntil && Math.floor(performance.now() / 90) % 2 === 0;

      if (isBlinking) {
        return;
      }

      context.fillStyle = 'rgba(34, 30, 24, 0.22)';
      drawPixelRect(context, x - 3, y + 50, 42, 4);

      context.fillStyle = '#24130f';
      drawPixelRect(context, x + 3, y - 1, 27, 6);
      drawPixelRect(context, x, y + 4, 35, 10);
      drawPixelRect(context, x + 3, y + 10, 31, 20);
      drawPixelRect(context, x + 3, y + 27, 29, 19);
      drawPixelRect(context, x - 5, leftArmY - 1, 11, 19);
      drawPixelRect(context, x + 28, rightArmY - 1, 12, 19);
      drawPixelRect(context, x - 3, leftFootY, 19, 8);
      drawPixelRect(context, x + 18, rightFootY, 19, 8);

      context.fillStyle = '#6b2f1d';
      drawPixelRect(context, x + 4, y + 11, 27, 19);
      context.fillStyle = '#f0b982';
      drawPixelRect(context, faceX, y + 13, 20, 15);
      drawPixelRect(context, noseX, y + 18, 6, 6);
      context.fillStyle = '#ffd0a0';
      drawPixelRect(context, faceX + 2, y + 14, 12, 3);
      context.fillStyle = '#d39165';
      drawPixelRect(context, faceX + 5, y + 25, 15, 3);
      context.fillStyle = '#201715';
      drawPixelRect(context, eyeX, y + 17, 4, 4);
      context.fillStyle = '#ffffff';
      drawPixelRect(context, eyeX + (player.facing === 1 ? 1 : 0), y + 17, 1, 1);
      context.fillStyle = '#4d2a1d';
      drawPixelRect(context, mustacheX, y + 22, 12, 4);
      drawPixelRect(context, mustacheX + faceSide * 8, y + 23, 5, 3);
      context.fillStyle = '#f7c996';
      drawPixelRect(context, noseX + (player.facing === 1 ? 3 : 0), y + 18, 2, 2);

      context.fillStyle = '#b92525';
      drawPixelRect(context, x + 4, y, 25, 5);
      drawPixelRect(context, x + 1, y + 5, 32, 7);
      drawPixelRect(context, x + 23, y + 9, 12, 5);
      context.fillStyle = '#e23b32';
      drawPixelRect(context, x + 7, y + 1, 18, 4);
      drawPixelRect(context, x + 4, y + 6, 19, 4);
      context.fillStyle = '#fff1cf';
      drawPixelRect(context, x + 14, y + 6, 8, 5);
      context.fillStyle = '#d83a32';
      drawPixelRect(context, x + 16, y + 7, 4, 3);
      context.fillStyle = '#a51f20';
      drawPixelRect(context, x + 21, y + 10, 12, 2);

      context.fillStyle = '#e23b32';
      drawPixelRect(context, x - 4, leftArmY, 9, 11);
      drawPixelRect(context, x + 29, rightArmY, 9, 11);
      context.fillStyle = '#f0b982';
      drawPixelRect(context, x - 4, leftArmY + 9, 8, 5);
      drawPixelRect(context, x + 30, rightArmY + 9, 8, 5);
      context.fillStyle = '#ffffff';
      drawPixelRect(context, x - 5, leftArmY + 12, 10, 5);
      drawPixelRect(context, x + 29, rightArmY + 12, 10, 5);

      context.fillStyle = '#1d4f9a';
      drawPixelRect(context, x + 5, y + 28, 24, 8);
      drawPixelRect(context, x + 4, y + 36, 27, 8);
      drawPixelRect(context, x + 9, y + 25, 5, 14);
      drawPixelRect(context, x + 21, y + 25, 5, 14);
      context.fillStyle = '#2e74d0';
      drawPixelRect(context, x + 8, y + 29, 17, 5);
      drawPixelRect(context, x + 7, y + 37, 8, 8);
      drawPixelRect(context, x + 20, y + 37, 8, 8);
      context.fillStyle = '#123566';
      drawPixelRect(context, x + 15, y + 35, 5, 13);
      drawPixelRect(context, x + 5, y + 43, 9, 4);
      drawPixelRect(context, x + 21, y + 43, 9, 4);
      context.fillStyle = '#f5d458';
      drawPixelRect(context, x + 10, y + 34, 4, 4);
      drawPixelRect(context, x + 22, y + 34, 4, 4);

      context.fillStyle = '#5a2c1b';
      drawPixelRect(context, x - 1, leftFootY, 15, 5);
      drawPixelRect(context, x + 20, rightFootY, 15, 5);
      context.fillStyle = '#2a140e';
      drawPixelRect(context, x - 2, leftFootY + 4, 17, 3);
      drawPixelRect(context, x + 19, rightFootY + 4, 17, 3);
    }

    function drawJumpEffects() {
      for (const particle of jumpParticles) {
        const fade = particle.life / particle.maxLife;
        context.fillStyle = fade > 0.55 ? '#f4d7a5' : '#d9a974';
        drawPixelRect(
          context,
          particle.x - cameraX,
          particle.y,
          Math.max(2, particle.size * fade),
          Math.max(2, particle.size * fade),
        );
      }
    }

    function drawOverlay() {
      if (status === 'playing') {
        return;
      }

      context.fillStyle = 'rgba(18, 27, 43, 0.58)';
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      context.font = '800 42px Inter, sans-serif';
      context.fillText(status === 'won' ? 'Победа!' : 'Игра окончена', CANVAS_WIDTH / 2, 246);
      context.font = '600 20px Inter, sans-serif';
      context.fillText('Нажми кнопку рестарта, чтобы сыграть еще раз', CANVAS_WIDTH / 2, 286);
      context.textAlign = 'start';
    }

    function draw() {
      drawBackground();
      drawMapDecorations();
      drawFlag();
      drawPlatforms();
      drawCoins();
      drawEnemies();
      drawBoss();
      drawJumpEffects();
      drawPlayer();
      context.fillStyle = 'rgba(23, 32, 51, 0.72)';
      drawPixelRect(context, 18, 18, 176, 36);
      context.fillStyle = '#ffffff';
      context.font = '700 18px Inter, sans-serif';
      context.fillText(`Level ${level}/${TOTAL_LEVELS}`, 34, 42);
      drawOverlay();
    }

    function frame() {
      animationTick += 1;
      updatePlayer();
      updateWorld();
      updateJumpEffects();
      publishHud();
      draw();
      animationFrame = requestAnimationFrame(frame);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        keysRef.current.left = true;
      }

      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        keysRef.current.right = true;
      }

      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        keysRef.current.jump = true;
        event.preventDefault();
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        keysRef.current.left = false;
      }

      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        keysRef.current.right = false;
      }

      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        keysRef.current.jump = false;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    publishHud();
    frame();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysRef.current = { left: false, right: false, jump: false };
    };
  }, [runId, level]);

  function setControl(control: keyof typeof keysRef.current, active: boolean) {
    keysRef.current[control] = active;
  }

  function restart() {
    keysRef.current = { left: false, right: false, jump: false };
    setLevel(1);
    setRunId((current) => current + 1);
  }

  return (
    <main className="game-shell">
      <section className="game-topbar" aria-label="Статистика игры">
        <div>
          <p className="eyebrow">nFactorial Teens</p>
          <h1>Платформер</h1>
        </div>
        <div className="scoreboard">
          <span>Монеты: {hud.coins}/10</span>
          <span>Жизни: {hud.lives}</span>
          <button type="button" onClick={restart}>
            Рестарт
          </button>
        </div>
      </section>

      <section className="game-stage" aria-label="Игровое поле">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      </section>

      <section className="game-controls" aria-label="Управление">
        <button
          type="button"
          aria-label="Влево"
          onPointerDown={() => setControl('left', true)}
          onPointerUp={() => setControl('left', false)}
          onPointerCancel={() => setControl('left', false)}
          onPointerLeave={() => setControl('left', false)}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Вправо"
          onPointerDown={() => setControl('right', true)}
          onPointerUp={() => setControl('right', false)}
          onPointerCancel={() => setControl('right', false)}
          onPointerLeave={() => setControl('right', false)}
        >
          →
        </button>
        <button
          type="button"
          aria-label="Прыжок"
          onPointerDown={() => setControl('jump', true)}
          onPointerUp={() => setControl('jump', false)}
          onPointerCancel={() => setControl('jump', false)}
          onPointerLeave={() => setControl('jump', false)}
        >
          Прыжок
        </button>
      </section>
    </main>
  );
}
