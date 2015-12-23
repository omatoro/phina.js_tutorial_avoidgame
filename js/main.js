/**
 * ゲーム用定数作成
 */
var SCREEN_WIDTH  = 960;
var SCREEN_HEIGHT = 640;
var RESULT_PARAM = {
  score: 256,
  msg:      "【避けゲー制作チュートリアル】",
  hashtags: ["omatoro", "phina.js"],
  url:      "http://omatoro.github.io/phina.js_tutorial_avoidgame/",
  width:    SCREEN_WIDTH,
  height:   SCREEN_HEIGHT,
};

var PLAYER_WIDTH  = 20;
var PLAYER_HEIGHT = 16;
var PLAYER_GROUND_LIMIT_LEFT  = PLAYER_WIDTH/2;
var PLAYER_GROUND_LIMIT_RIGHT = SCREEN_WIDTH - PLAYER_WIDTH/2;
var ENEMY_WIDTH  = 38;
var ENEMY_HEIGHT = 30;

/**
 * リソースの読み込み
 */
var ASSETS = {
  image: {
    "player":   "./rsc/[Animal]Chicken.png",
    "enemy":    "./rsc/[Monster]Dragon_B_pochi.png",
    "backMap":  "./rsc/map.png",
  },
  spritesheet: {
    "playerSS": "./rsc/playerSS.ss",
  },
  sound: {
    "bgm": "./rsc/Comical01_Koya_short2.mp3",
  },
};


/**
 * ゲーム起動処理
 */
phina.globalize();
phina.main(function() {
  var app = GameApp({
    startLabel: 'title',
    assets: ASSETS,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  app.run();
});


/**
 * TitleScene
 */
phina.define("TitleScene", {
  superClass : "phina.game.TitleScene",
  init: function() {
    this.superInit({
      title :  "避けゲー制作チュートリアル",
      backgroundColor: 'rgb(20,20,20)',
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
  },
});


/**
 * MainScene
 */
phina.define("MainScene", {
  superClass : "CanvasScene",

  init : function() {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });

    // BGM再生
    this.bgm = phina.asset.AssetManager.get("sound", "bgm");
    this.bgm.setLoop(true).play();

    // Map
    this.map = phina.display.Sprite("backMap")
      .setOrigin(0, 0)
      .setScale(2)
      .addChildTo(this);

    // Player
    this.player = Player().addChildTo(this);
    this.player.position.set(150, 600);

    // enemy
    this.enemyGroup = phina.display.CanvasElement().addChildTo(this);

    // スコア用カウントアップ
    this.timer = 0;

    // ラベル表示
    this.timeLabel = phina.display.Label({
      text: " ",
      fill: "white",
      fontSize: 40,
    }).setPosition(200, 60).addChildTo(this);
  },

  update: function (app) {
    // カウントアップを行う
    ++this.timer;

    // 制限時間を表示する
    this.timeLabel.text = "生き残ってる時間 : " + ((this.timer / 30) |0);

    // 敵の生成(難易度をどんどん上げる)
    if (this.timer % 30 === 0) {
      for (var i = 0, n = (this.timer / 300); i < n; ++i) {
        var enemy = Enemy().addChildTo(this.enemyGroup);
        enemy.x = Math.randint(0, SCREEN_WIDTH);
        enemy.y = 0 - enemy.height;
      }
    }

    var self = this;
    var ec = this.enemyGroup.children;
    ec.each(function(enemy) {
      if (self.player.hitTestElement(enemy)) {
        self.bgm.stop();
        app.replaceScene(EndScene(self.timer))
      };
    });
  },
});


/**
 * EndScene
 */
phina.define("EndScene", {
  superClass : "phina.game.ResultScene",

  init : function(time) {
    // スコア計算
    RESULT_PARAM.score = (Math.floor(time*100/30)/100) + "秒生き残ることができました。";

    // スコア
    this.superInit(RESULT_PARAM);
  },

  // Backボタンを押したらTitleSceneに戻る
  onnextscene: function (e) {
    e.target.app.replaceScene(TitleScene());
  },
});


/*
 * player
 */
phina.define("Player", {
  superClass: "phina.display.Sprite",

  init: function () {
    this.superInit("player", PLAYER_WIDTH, PLAYER_HEIGHT);
    this.setScale(4);
    var ss = phina.accessory.FrameAnimation("playerSS");
    ss.attachTo(this);
    this.ss = ss;
    // 移動の方向を保持
    this.direct = "right";
    this.ss.gotoAndPlay(this.direct);
    // スマホだったら加速度を使うので、タッチ入力での移動を行わない
    this.update = this.updateNotMobile;
    
  },

  moveLimit: function () {
    // 画面からはみ出ないようにする
    if (this.x < PLAYER_GROUND_LIMIT_LEFT) {
      this.x = PLAYER_GROUND_LIMIT_LEFT;
    }
    if (this.x > PLAYER_GROUND_LIMIT_RIGHT) {
      this.x = PLAYER_GROUND_LIMIT_RIGHT;
    }
  },

  clickLeft: function () {
    this.x -= 4;
  },

  clickRight: function () {
    this.x += 4;
  },

  updateNotMobile: function (app) {
    // タッチしたら動く方向を逆にする
    if (app.pointer.getPointingStart()) {
      this.direct = (this.direct === "left") ? "right" : "left";
      this.ss.gotoAndPlay(this.direct);
    }
    // 移動処理
    switch (this.direct) {
      case "left":
        this.clickLeft();
        break;
      case "right":
        this.clickRight();
        break;
    }
    // 移動の限界
    this.moveLimit();
  },
});

/*
 * enemy
 */
phina.define("Enemy", {
  superClass: "phina.display.Sprite",

  init: function() {
    this.superInit("enemy");
    this.width = ENEMY_WIDTH*4;
    this.height = ENEMY_HEIGHT*4;
    this.speed = Math.randint(6, 12);
  },

  update: function() {
    this.y += this.speed;

    // 画面から見えなくなったら消す
    if (this.y > SCREEN_HEIGHT + this.height) {
      this.remove();
    }
  }
});
