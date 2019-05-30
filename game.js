/*eslint complexity:0 , max-statements:0 ,no-loop-func:0 id-length:0 */
let game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-demo', {
  preload: preload,
  create: create,
  update: update,
  render: render,
});

let player;
let firstEnemy;
let secondEnemy;
let secondEnemyBullets;
let background;
let cursors;
let explosions;
let playerDeath;
let bullets;
let stars;
let fireButton;
let bulletTimer = 0;
let shields;
let score = 0;
let scoreText;
//first enemy
let firstEnemySpacing = 500;
// health power ups
let starSpacing = 1000;
// second enemy
let secondEnemyLaunched = false;
let secondEnemySpacing = 2500;
let boss;
//boss
let bossLaunched = false;
let bossSpacing = 20000;
let bossBulletTimer = 0;

const ACCELERATION = 700;
const DRAG = 300;
const MAXSPEED = 500;

function preload() {
  game.load.image('background', 'assets/galaxy.png');
  game.load.image('ship', '/assets/player.png');
  game.load.image('star', '/assets/star-1.png');
  game.load.image('bullet', '/assets/bullet.png');
  game.load.image('first-enemy', '/assets/firstEnemy.png');
  game.load.image('second-enemy', '/assets/secondEnemy.png');
  game.load.image('secondEnemyBullet', '/assets/enemy2-bullet.png');
  game.load.spritesheet('explosion', '/assets/explode.png', 128, 128);

  game.load.image('boss', '/assets/boss.png');
  game.load.image('deathRay', '/assets/death-ray.png');

  game.load.audio('music', 'assets/background.mp3');

  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;
}

function create() {
  //   scrolling background
  background = game.add.tileSprite(0, 0, 800, 600, 'background');

  // player bullets
  bullets = game.add.group();
  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(30, 'bullet');
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 1);
  bullets.setAll('outOfBoundsKill', true);
  bullets.setAll('checkWorldBounds', true);

  //  player
  player = game.add.sprite(400, 500, 'ship');
  player.health = 100;
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.maxVelocity.setTo(MAXSPEED, MAXSPEED);
  player.body.drag.setTo(DRAG, DRAG);
  player.weaponLevel = 1;
  player.events.onKilled.add(function() {});

  //stars
  stars = game.add.group();
  stars.enableBody = true;
  stars.physicsBodyType = Phaser.Physics.ARCADE;
  stars.createMultiple(2, 'star');
  stars.setAll('anchor.x', 0.5);
  stars.setAll('anchor.y', 0.5);
  stars.setAll('scale.x', 0.5);
  stars.setAll('scale.y', 0.5);
  stars.setAll('angle', 180);
  stars.forEach(function(star) {
    star.healAmount = 20;
  });
  game.time.events.add(2000, launchStars);

  //first enemy
  firstEnemy = game.add.group();
  firstEnemy.enableBody = true;
  firstEnemy.physicsBodyType = Phaser.Physics.ARCADE;
  firstEnemy.createMultiple(8, 'first-enemy');
  firstEnemy.setAll('anchor.x', 0.9);
  firstEnemy.setAll('anchor.y', 0.8);
  firstEnemy.setAll('scale.x', 0.6);
  firstEnemy.setAll('scale.y', 0.7);
  firstEnemy.setAll('angle', 120);
  firstEnemy.setAll('outOfBoundsKill', true);
  firstEnemy.setAll('checkWorldBounds', true);
  firstEnemy.forEach(function(enemy) {
    enemy.body.setSize((enemy.width * 4) / 4, (enemy.height * 2) / 4);
    enemy.damageAmount = 20;
  });

  game.time.events.add(1000, launchFirstEnemy);

  //   enemy's bullets
  secondEnemyBullets = game.add.group();
  secondEnemyBullets.enableBody = true;
  secondEnemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
  secondEnemyBullets.createMultiple(30, 'secondEnemyBullet');
  secondEnemyBullets.callAll('crop', null, {
    x: 90,
    y: 0,
    width: 90,
    height: 70,
  });
  secondEnemyBullets.setAll('alpha', 0.9);
  secondEnemyBullets.setAll('anchor.x', 0.5);
  secondEnemyBullets.setAll('anchor.y', 0.5);
  secondEnemyBullets.setAll('outOfBoundsKill', true);
  secondEnemyBullets.setAll('checkWorldBounds', true);
  secondEnemyBullets.forEach(function(enemy) {
    enemy.body.setSize(20, 20);
  });

  secondEnemy = game.add.group();
  secondEnemy.enableBody = true;
  secondEnemy.physicsBodyType = Phaser.Physics.ARCADE;
  secondEnemy.createMultiple(10, 'second-enemy');
  secondEnemy.setAll('anchor.x', 0.5);
  secondEnemy.setAll('anchor.y', 0.5);
  secondEnemy.setAll('scale.x', 0.5);
  secondEnemy.setAll('scale.y', 0.5);
  secondEnemy.setAll('angle', 180);
  secondEnemy.forEach(function(enemy) {
    enemy.damageAmount = 40;
  });

  //  The boss
  boss = game.add.sprite(0, 0, 'boss');
  boss.exists = false;
  boss.alive = false;
  boss.anchor.setTo(0.5, 0.5);
  boss.damageAmount = 50;
  boss.angle = 180;
  boss.scale.x = 0.6;
  boss.scale.y = 0.6;
  game.physics.enable(boss, Phaser.Physics.ARCADE);
  boss.body.maxVelocity.setTo(100, 80);
  boss.dying = false;
  boss.finishOff = function() {
    if (!boss.dying) {
      boss.dying = true;
      bossDeath.x = boss.x;
      bossDeath.y = boss.y;
      bossDeath.start(false, 1000, 50, 20);
      //  kill boss after explotions
      game.time.events.add(1000, function() {
        let explosion = explosions.getFirstExists(false);
        let beforeScaleX = explosions.scale.x;
        let beforeScaleY = explosions.scale.y;
        let beforeAlpha = explosions.alpha;
        explosion.reset(
          boss.body.x + boss.body.halfWidth,
          boss.body.y + boss.body.halfHeight,
        );
        explosion.alpha = 0.4;
        explosion.scale.x = 3;
        explosion.scale.y = 3;
        let animation = explosion.play('explosion', 30, false, true);
        animation.onComplete.addOnce(function() {
          explosion.scale.x = beforeScaleX;
          explosion.scale.y = beforeScaleY;
          explosion.alpha = beforeAlpha;
        });
        boss.kill();
        boss.dying = false;
        bossDeath.on = false;
        //  queue next boss
        bossLaunchTimer = game.time.events.add(
          game.rnd.integerInRange(bossSpacing, bossSpacing + 10000),
          launchBoss,
        );
      });

      //  reset pacing for other enemies
      secondEnemySpacing = 1500;
      firstEnemySpacing = 1000;

      //  give some bonus health
      player.health = Math.min(100, player.health + 40);
      shields.render();
    }
  };

  function bossRay(leftRight) {
    let ray = game.add.sprite(leftRight * boss.width * 0.75, 0, 'deathRay');
    ray.alive = false;
    ray.visible = false;
    boss.addChild(ray);
    ray.crop({ x: 0, y: 0, width: 40, height: 40 });
    ray.anchor.x = 0.5;
    ray.anchor.y = 0.5;
    ray.scale.x = 2.5;
    ray.damageAmount = boss.damageAmount;
    game.physics.enable(ray, Phaser.Physics.ARCADE);
    ray.body.setSize(ray.width / 5, ray.height / 4);
    ray.update = function() {
      this.alpha = game.rnd.realInRange(0.6, 1);
    };
    boss['ray' + (leftRight > 0 ? 'Right' : 'Left')] = ray;
  }
  bossRay(1);
  bossRay(-1);
  //  need to add the ship texture to the group so it renders over the rays
  let ship = game.add.sprite(0, 0, 'boss');
  ship.anchor = { x: 0.5, y: 0.5 };
  boss.addChild(ship);

  boss.fire = function() {
    if (game.time.now > bossBulletTimer) {
      let raySpacing = 2000;

      chargeAndShoot('Right');
      chargeAndShoot('Left');

      bossBulletTimer = game.time.now + raySpacing;
    }
  };

  function chargeAndShoot(side) {
    let chargeTime = 1500;
    let rayTime = 1500;
    ray = boss['ray' + side];
    ray.name = side;
    ray.revive();
    ray.y = 80;
    ray.alpha = 0;
    ray.scale.y = 13;
    game.add
      .tween(ray)
      .to({ alpha: 1 }, chargeTime, Phaser.Easing.Linear.In, true)
      .onComplete.add(function(ray) {
        ray.scale.y = 150;
        game.add
          .tween(ray)
          .to({ y: -1500 }, rayTime, Phaser.Easing.Linear.In, true)
          .onComplete.add(function(ray) {
            ray.kill();
          });
      });
  }

  boss.update = function() {
    if (!boss.alive) return;

    boss.rayLeft.update();
    boss.rayRight.update();

    if (boss.y > 140) boss.body.acceleration.y = -50;
    if (boss.y < 140) boss.body.acceleration.y = 50;

    if (boss.x > player.x + 50) {
      boss.body.acceleration.x = -50;
    } else if (boss.x < player.x - 50) {
      boss.body.acceleration.x = 50;
    } else {
      boss.body.acceleration.x = 0;
    }

    //  fire if player is in target
    let angleToPlayer =
      game.math.radToDeg(game.physics.arcade.angleBetween(boss, player)) - 90;
    let anglePointing = 180 - Math.abs(boss.angle);
    if (anglePointing - angleToPlayer < 18) boss.fire();
  };

  boss.bringToTop();

  //  Controls
  cursors = game.input.keyboard.createCursorKeys();
  fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  //  An explosion
  explosions = game.add.group();
  explosions.enableBody = true;
  explosions.physicsBodyType = Phaser.Physics.ARCADE;
  explosions.createMultiple(30, 'explosion');
  explosions.setAll('anchor.x', 0.5);
  explosions.setAll('anchor.y', 0.5);
  explosions.forEach(function(explosion) {
    explosion.animations.add('explosion');
  });

  // Player Death explosion
  playerDeath = game.add.emitter(player.x, player.y);
  playerDeath.width = 50;
  playerDeath.height = 50;
  playerDeath.makeParticles('explosion', [0, 1, 2, 3, 4, 5, 6, 7], 10);
  playerDeath.setAlpha(0.9, 0, 800);
  playerDeath.setScale(0.1, 0.6, 0.1, 0.6, 1000, Phaser.Easing.Quintic.Out);

  //  Boss explosion
  let bossDeath = game.add.emitter(boss.x, boss.y);
  bossDeath.width = boss.width / 2;
  bossDeath.height = boss.height / 2;
  bossDeath.makeParticles('explosion', [0, 1, 2, 3, 4, 5, 6, 7], 20);
  bossDeath.setAlpha(0.9, 0, 900);
  bossDeath.setScale(0.3, 1.0, 0.3, 1.0, 1000, Phaser.Easing.Quintic.Out);

  //  Shields stat
  shields = game.add.text(
    game.world.width - 150,
    10,
    'Health: ' + player.health + '%',
    { font: '20px Arial', fill: '#fff' },
  );
  shields.render = function() {
    shields.text = 'Health: ' + Math.max(player.health, 0) + '%';
  };

  //  Score
  scoreText = game.add.text(10, 10, '', { font: '20px Arial', fill: '#fff' });
  scoreText.render = function() {
    scoreText.text = 'Score: ' + score;
  };
  scoreText.render();
}

function update() {
  //  Scroll the background
  background.tilePosition.y += 2;

  //  Reset the player, then check for movement keys
  player.body.acceleration.x = 0;

  if (cursors.left.isDown) {
    player.body.acceleration.x = -ACCELERATION;
  } else if (cursors.right.isDown) {
    player.body.acceleration.x = ACCELERATION;
  }

  //  Stops player from leaving screen
  if (player.x > game.width - 50) {
    player.x = game.width - 50;
    player.body.acceleration.x = 0;
  }

  if (player.x < 50) {
    player.x = 50;
    player.body.acceleration.x = 0;
  }

  //  Shoot
  if (player.alive && (fireButton.isDown || game.input.activePointer.isDown)) {
    fireBullet();
  }

  // Player follows pointer
  if (
    game.input.x < game.width - 20 &&
    game.input.x > 20 &&
    game.input.y > 20 &&
    game.input.y < game.height - 20
  ) {
    let minDist = 200;
    let dist = game.input.x - player.x;
    player.body.velocity.x = MAXSPEED * game.math.clamp(dist / minDist, -1, 1);
  }

  //  Check collisions
  game.physics.arcade.overlap(player, firstEnemy, shipCollide, null, this);
  game.physics.arcade.overlap(firstEnemy, bullets, hitEnemy, null, this);
  game.physics.arcade.overlap(player, stars, hitStars, null, this);

  game.physics.arcade.overlap(player, secondEnemy, shipCollide, null, this);
  game.physics.arcade.overlap(secondEnemy, bullets, hitEnemy, null, this);

  game.physics.arcade.overlap(boss, bullets, hitEnemy, bossHit, this);
  game.physics.arcade.overlap(
    player,
    boss.rayLeft,
    enemyHitsPlayer,
    null,
    this,
  );
  game.physics.arcade.overlap(
    player,
    boss.rayRight,
    enemyHitsPlayer,
    null,
    this,
  );

  game.physics.arcade.overlap(
    secondEnemyBullets,
    player,
    enemyHitsPlayer,
    null,
    this,
  );
}

function render() {}

function fireBullet() {
  switch (player.weaponLevel) {
    case 2:
      if (game.time.now > bulletTimer) {
        let BULLET_SPEED = 500;
        let BULLET_SPACING = 550;

        for (let i = 0; i < 2; i++) {
          let bullet = bullets.getFirstExists(false);
          if (bullet) {
            //  Make bullet come out of tip of ship with right angle
            let bulletOffset = 20 * Math.sin(game.math.degToRad(player.angle));
            bullet.reset(player.x + bulletOffset, player.y);
            //  "Spread" angle of 1st and 3rd bullets
            let spreadAngle;
            if (i === 0) spreadAngle = -10;
            if (i === 1) spreadAngle = 10;
            //if (i === 2) spreadAngle = 20;
            bullet.angle = player.angle + spreadAngle;
            game.physics.arcade.velocityFromAngle(
              spreadAngle - 90,
              BULLET_SPEED,
              bullet.body.velocity,
            );
            bullet.body.velocity.x += player.body.velocity.x;
          }
          bulletTimer = game.time.now + BULLET_SPACING;
        }
      }
      break;
    case 3:
      if (game.time.now > bulletTimer) {
        let BULLET_SPEED = 500;
        let BULLET_SPACING = 550;

        for (let i = 0; i < 3; i++) {
          let bullet = bullets.getFirstExists(false);
          if (bullet) {
            //  Make bullet come out of tip of ship with right angle
            let bulletOffset = 20 * Math.sin(game.math.degToRad(player.angle));
            bullet.reset(player.x + bulletOffset, player.y);
            //  "Spread" angle of 1st and 3rd bullets
            let spreadAngle;
            if (i === 0) spreadAngle = -5;
            if (i === 1) spreadAngle = 0;
            if (i === 2) spreadAngle = 5;
            bullet.angle = player.angle + spreadAngle;
            game.physics.arcade.velocityFromAngle(
              spreadAngle - 90,
              BULLET_SPEED,
              bullet.body.velocity,
            );
            bullet.body.velocity.x += player.body.velocity.x;
          }
          bulletTimer = game.time.now + BULLET_SPACING;
        }
      }

      break;
    default:
      //  To avoid them being allowed to fire too fast we set a time limit
      if (game.time.now > bulletTimer) {
        let BULLET_SPEED = 500;
        let BULLET_SPACING = 250;
        //  Grab the first bullet we can from the pool
        let bullet = bullets.getFirstExists(false);

        if (bullet) {
          //  And fire it
          //  Make bullet come out of tip of ship with right angle
          let bulletOffset = 20 * Math.sin(game.math.degToRad(player.angle));
          bullet.reset(player.x + bulletOffset, player.y);
          bullet.angle = player.angle;
          game.physics.arcade.velocityFromAngle(
            bullet.angle - 90,
            BULLET_SPEED,
            bullet.body.velocity,
          );
          bullet.body.velocity.x += player.body.velocity.x;

          bulletTimer = game.time.now + BULLET_SPACING;
        }
      }
  }
}

function launchFirstEnemy() {
  let ENEMY_SPEED = 300;

  let enemy = firstEnemy.getFirstExists(false);
  if (enemy) {
    enemy.reset(game.rnd.integerInRange(0, game.width), -20);
    enemy.body.velocity.x = game.rnd.integerInRange(-300, 300);
    enemy.body.velocity.y = ENEMY_SPEED;
    enemy.body.drag.x = 100;

    //  Update function for each enemy ship to update rotation etc
    enemy.update = function() {
      enemy.angle =
        180 -
        game.math.radToDeg(
          Math.atan2(enemy.body.velocity.x, enemy.body.velocity.y),
        );

      //  Kill enemies once they go off screen
      if (enemy.y > game.height + 200) {
        enemy.kill();
        enemy.y = -20;
      }
    };
  }
  //  Send another enemy soon
  game.time.events.add(
    game.rnd.integerInRange(firstEnemySpacing, firstEnemySpacing + 1000),
    launchFirstEnemy,
  );
}

function launchStars() {
  let STARS_SPEED = 200;

  let star = stars.getFirstExists(false);
  if (star) {
    star.reset(game.rnd.integerInRange(0, game.width), -20);
    star.body.velocity.x = game.rnd.integerInRange(-200, 300);
    star.body.velocity.y = STARS_SPEED;
    star.body.drag.x = 100;

    star.update = function() {
      star.angle =
        80 -
        game.math.radToDeg(
          Math.atan2(star.body.velocity.x, star.body.velocity.y),
        );

      if (star.y > game.height + 200) {
        star.kill();
        star.y = -20;
      }
    };
  }

  //  Send another star soon
  game.time.events.add(
    game.rnd.integerInRange(starSpacing, starSpacing + 1000),
    launchStars,
  );
}

function launchSecondEnemy() {
  let startingX = game.rnd.integerInRange(100, game.width - 100);
  let verticalSpeed = 180;
  let spread = 60;
  let frequency = 70;
  let verticalSpacing = 70;
  let enemyWave = 8;

  //  Launch wave
  for (let i = 0; i < enemyWave; i++) {
    let enemy = secondEnemy.getFirstExists(false);
    if (enemy) {
      enemy.startingX = startingX;
      enemy.reset(game.width / 2, -verticalSpacing * i);
      enemy.body.velocity.y = verticalSpeed;

      //  Set up firing
      let bulletSpeed = 100;
      let firingDelay = 6000;
      enemy.bullets = 1;
      enemy.lastShot = 0;

      //  Update function for each enemy
      enemy.update = function() {
        //  Wave movement
        this.body.x = this.startingX + Math.sin(this.y / frequency) * spread;

        //  Fire
        let enemyBullet = secondEnemyBullets.getFirstExists(false);
        if (
          enemyBullet &&
          this.alive &&
          this.bullets &&
          this.y > game.width / 8 &&
          game.time.now > firingDelay + this.lastShot
        ) {
          this.lastShot = game.time.now;
          this.bullets--;
          enemyBullet.reset(this.x, this.y + this.height / 2);
          enemyBullet.damageAmount = this.damageAmount;
          let angle = game.physics.arcade.moveToObject(
            enemyBullet,
            player,
            bulletSpeed,
          );
          enemyBullet.angle = game.math.radToDeg(angle);
        }

        if (this.y > game.height + 200) {
          this.kill();
          this.y = -20;
        }
      };
    }
  }

  //  Send next wave
  game.time.events.add(
    game.rnd.integerInRange(secondEnemySpacing, secondEnemySpacing + 2000),
    launchSecondEnemy,
  );
}

function launchBoss() {
  boss.reset(game.width / 2, -boss.height);
  boss.health = 800;
  bossBulletTimer = game.time.now + 5000;
}

function shipCollide(player, enemy) {
  enemy.kill();

  player.damage(enemy.damageAmount);
  shields.render();

  if (player.alive) {
    let explosion = explosions.getFirstExists(false);
    explosion.reset(
      player.body.x + player.body.halfWidth,
      player.body.y + player.body.halfHeight,
    );
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
  } else {
    playerDeath.x = player.x;
    playerDeath.y = player.y;
    playerDeath.start(false, 1000, 10, 10);
  }
}

function hitStars(player, star) {
  star.kill();
  if (player.health < 100) player.health += 10;
  shields.render();
}

function hitEnemy(enemy, bullet) {
  let explosion = explosions.getFirstExists(false);
  explosion.reset(
    bullet.body.x + bullet.body.halfWidth,
    bullet.body.y + bullet.body.halfHeight,
  );
  explosion.body.velocity.y = enemy.body.velocity.y;
  explosion.alpha = 0.7;
  explosion.play('explosion', 30, false, true);
  if (enemy.finishOff && enemy.health < 5) {
    enemy.finishOff();
  } else {
    enemy.damage(enemy.damageAmount);
  }
  bullet.kill();

  // Increase score
  score += enemy.damageAmount * 10;
  scoreText.render();

  firstEnemySpacing *= 0.9;

  if (!secondEnemyLaunched && score > 800) {
    secondEnemyLaunched = true;
    launchSecondEnemy();
    firstEnemySpacing *= 2;
  }

  //  Launch boss
  if (!bossLaunched && score > 6000) {
    firstEnemySpacing = 5000;
    secondEnemySpacing = 15000;
    //  dramatic pause before boss
    game.time.events.add(2000, function() {
      bossLaunched = true;
      launchBoss();
    });
  }

  //weapon upgrade
  if (score > 3000 && player.weaponLevel < 2) player.weaponLevel = 2;

  if (score > 4000 && player.weaponLevel < 3) player.weaponLevel = 3;
}

function bossHit(boss, bullet) {
  if (
    (bullet.x > boss.x + boss.width / 5 && bullet.y > boss.y) ||
    (bullet.x < boss.x - boss.width / 5 && bullet.y > boss.y)
  ) {
    return false;
  } else {
    return true;
  }
}

function enemyHitsPlayer(player, bullet) {
  bullet.kill();

  player.damage(bullet.damageAmount);
  shields.render();

  if (player.alive) {
    let explosion = explosions.getFirstExists(false);
    explosion.reset(
      player.body.x + player.body.halfWidth,
      player.body.y + player.body.halfHeight,
    );
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
  } else {
    playerDeath.x = player.x;
    playerDeath.y = player.y;
    playerDeath.start(false, 1000, 10, 10);
  }
}
