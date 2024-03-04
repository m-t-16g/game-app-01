'use strict';
// ゲーム実行部分のウィンドウ取得
const gamewindow = document.getElementById('gamewindow');
// ウィンドウサイズからボーダーを減算し画面領域とする
const wwidth = gamewindow.offsetWidth - 8;
const wheight = gamewindow.offsetHeight - 8;
// スコア表示取得
const scoreboard = document.querySelector('.scoreboard');
// ライフ領域取得
const lifearea = document.querySelector('.life');
//得点
let score = 0;
let wave = 0;
let targetscore = 100;
// メッセージ領域取得
const msgarea = document.querySelector('.message');
const msgtitle = document.querySelector('.msgtitle');
const msgtxt = document.querySelectorAll('.msgtxt');
// 自機を取得
const mychara = document.querySelector('.mychara');
// サイズのパラメータを定数として設定
const sizes = { my: [40, 40], shot: [10, 10], target: [40, 40] };
////ver1.1 位置や情報のパラメータを一つにまとめたいため、オブジェクト化
// size,x,yとchara,shotはスピード(1イベントの移動量)、targetはv(加速度)を管理,otherにて
// ここら辺のスタータスいじることで拡張性を持たせる
let parameter = {
  chara: [
    {
      size: [40, 40],
      xpos: wwidth / 2 - sizes.my[0] / 2,
      ypos: wheight / 10,
      speed: 10,
    },
  ],
  shot: [],
  target: [],
  other: {
    shotsize: [10, 10],
    shotspeed: 10,
    shotingame: 5,
    targetsize: [40, 40],
    life: 3,
    damagecount: 0,
  },
};
// ゲーム状態フラグ
//ゲームステート:リセット=0、進行中=1、ステージクリア=2
//ゲームクリア=3、ゲームオーバー=4
let gamestate = 0;
// タイマー
function spawntimer() {
  if (gamestate === 1) {
    setTimeout(createtarget, 1500);
  }
}
function movingtimer() {
  if (gamestate === 1) {
    shotmove();
    targetmove();
    setTimeout(refresh, 100);
  }
}
function refresh() {
  if (gamestate === 1) {
    movingtimer();
  }
}
// 乱数精製用の関数(0~99)
function random() {
  return Math.floor(Math.random() * 100);
}
// 体力バー生成
function life() {
  for (let i = 0; i < parameter.other.life; i++) {
    const lifeguage = document.createElement('div');
    lifeguage.className = 'fill';
    lifearea.appendChild(lifeguage);
  }
}
// 体力ゲージを減らす処理
function damage() {
  if (parameter.other.damagecount < parameter.other.life) {
    const heart = document.querySelectorAll('.fill');
    heart[0].className = 'damaged';
    parameter.other.damagecount++;
    damageeffect();
  } else {
    gameover();
  }
}
// ダメージエフェクト
function damageeffect() {
  console.log(gamewindow);
  gamewindow.style.backgroundColor = '#FF2222';
  setTimeout(() => {
    gamewindow.style.backgroundColor = '#000000';
  }, 75);
}
// 弾を生成する関数
function createshot() {
  const shot = document.createElement('div');
  shot.className = 'shot';
  parameter.shot.push({
    xpos: parameter.chara[0].xpos + parameter.chara[0].size[0] / 2 - parameter.other.shotsize[0] / 2,
    ypos: parameter.chara[0].ypos + (parameter.chara[0].size[1] * 2) / 3,
  });
  // プレイヤーの少し上に弾を生成
  shot.style.left = parameter.shot.slice(-1)[0].xpos + 'px';
  shot.style.bottom = parameter.shot.slice(-1)[0].ypos + 'px';
  gamewindow.appendChild(shot);
}
// 弾を動かす関数
function shotmove() {
  for (let i in parameter.shot) {
    // 1タイマー(1/100秒ごとに10px移動)
    parameter.shot[i].ypos += 10;
    document.querySelectorAll('.shot')[i].style.bottom = parameter.shot[i].ypos + 'px';
    // 衝突判定へ回す
    conflict(parameter.shot[i].xpos, parameter.shot[i].ypos, i);
    // 画面外に弾が出た判定
    if (parameter.shot[i].ypos + parameter.other.shotsize[1] > wheight) {
      // 位置情報パラメータを消去
      console.log('delete' + i);
      parameter.shot.splice(i, 1);
      // 実体divを消去
      gamewindow.removeChild(document.querySelectorAll('.shot')[i]);
    }
  }
}
// 降ってくるオブジェクトを自動生成する関数
function createtarget() {
  if (gamestate === 1) {
    const target = document.createElement('div');
    target.className = 'target';
    parameter.target.push({
      // 横位置はランダム生成
      xpos: ((wwidth - sizes.target[0]) * random()) / 100,
      // 縦位置を画面上部1/4からランダム生成する様に
      ypos: ((wheight / 4) * random()) / 100 + (wheight * 3) / 4 - parameter.other.targetsize[1],
      // 加速度情報を-12.5~12.5pxの範囲で生成
      velocity: random() - 50 / 4,
    });
    target.style.left = parameter.target.slice(-1)[0].xpos + 'px';
    target.style.bottom = parameter.target.slice(-1)[0].ypos + 'px';
    gamewindow.appendChild(target);
    spawntimer();
  }
}
// 降ってくるオブジェクトの移動
function targetmove() {
  const moval = parameter.target;
  for (let i in moval) {
    // 1タイマー(1/100)ごとに下方向移動、移動量は5までの乱数+ウェーブに応じた定数
    moval[i].ypos -= (random() % 5) + wave / 2;
    document.querySelectorAll('.target')[i].style.bottom = moval[i].ypos + 'px';
    // 加速度情報を基に移動
    moval[i].xpos += moval[i].velocity;
    // 加速度を-12.5~12.5の範囲でランダムに変化
    moval[i].velocity += (random() - 50) / 4;
    // 加速度の最大値はウェーブ数に応じる
    if (moval[i].velocity > wave * 3 + 30) {
      moval[i].velocity = wave * 3 + 30;
    }
    if (moval[i].velocity < -(wave * 3 + 30)) {
      moval[i].velocity = -(wave * 3 + 30);
    }
    // 左右画面外に出ないように自動修正
    if (moval[i].xpos <= 0) {
      moval[i].xpos = 0;
      // 加速度を反転させる
      moval[i].velocity = Math.abs(moval[i].velocity);
    }
    if (moval[i].xpos > wwidth - sizes.target[0]) {
      moval[i].xpos = wwidth - sizes.target[0];
      moval[i].velocity = -moval[i].velocity;
    }
    document.querySelectorAll('.target')[i].style.left = moval[i].xpos + 'px';
    // 画面外(下)に出た判定
    if (moval[i].ypos <= -parameter.other.targetsize[1] / 2) {
      // 位置情報を消去
      moval.splice(i, 1);
      // 実体divを消去
      gamewindow.removeChild(document.querySelectorAll('.target')[i]);
      damage();
    }
  }
}
// 弾とターゲットがぶつかったときの処理をする関数（引数は弾の位置情報及び格納位置)
function conflict(x, y, z) {
  // 引数x,y,zはそれぞれ弾の座標と生成物id
  // 全てのターゲットに対して弾の位置情報から衝突を判定
  const tgt = parameter.target;
  for (let i in tgt) {
    // x軸の位置判定(ターゲットのx座標<弾の位置<ターゲットのx座標+サイズ(x軸方向))
    if (x + parameter.other.shotsize[0] >= tgt[i].xpos && x < tgt[i].xpos + parameter.other.targetsize[0]) {
      // y軸判定(ターゲットのy座標<弾の位置+弾のyサイズ<ターゲットのy座標+yサイズ)
      if (
        y + parameter.other.shotsize[1] >= tgt[i].ypos + parameter.other.targetsize[1] / 2 &&
        y < tgt[i].ypos + parameter.other.targetsize[1]
      ) {
        // それぞれ位置情報と実体divを消去
        parameter.shot.splice(z, 1);
        gamewindow.removeChild(document.querySelectorAll('.shot')[z]);
        tgt.splice(i, 1);
        gamewindow.removeChild(document.querySelectorAll('.target')[i]);
        // 得点を増やす
        getscore();
      }
    }
  }
}
// 得点関数
function getscore() {
  score += 10;
  // スコアボードの書き換え
  scoreboard.textContent = `Score : ${score}/${targetscore}点`;
  // スコアが目標以上ならウェーブクリアへ
  if (score >= targetscore) {
    waveclear();
  }
}
// 自記の表示位置を変更する関数
function mycharamove(x, y) {
  // 画面領域外に行くことを防ぐためif文で切って処理
  if (x < 0) {
    parameter.chara[0].xpos += x;
    if (parameter.chara[0].xpos < 0) {
      parameter.chara[0].xpos = 0;
    }
  } else {
    parameter.chara[0].xpos += x;
    if (parameter.chara[0].xpos > wwidth - parameter.chara[0].size[0]) {
      parameter.chara[0].xpos = wwidth - parameter.chara[0].size[0];
    }
  }
  if (y < 0) {
    parameter.chara[0].ypos += y;
    if (parameter.chara[0].ypos < 0) {
      parameter.chara[0].ypos = 0;
    }
  } else {
    parameter.chara[0].ypos += y;
    if (parameter.chara[0].ypos > wheight - parameter.chara[0].size[1]) {
      parameter.chara[0].ypos = wheight - parameter.chara[0].size[1];
    }
  }
  mychara.style.left = parameter.chara[0].xpos + 'px';
  mychara.style.bottom = parameter.chara[0].ypos + 'px';
}
// キーが押されている間の処理(十字キー及びスペースキー)
window.addEventListener('keydown', keydownEvent);
function keydownEvent(e) {
  switch (e.key) {
    case 'ArrowUp':
      mycharamove(0, 10);
      break;
    case 'ArrowDown':
      mycharamove(0, -10);
      break;
    case 'ArrowLeft':
      mycharamove(-10, 0);
      break;
    case 'ArrowRight':
      mycharamove(10, 0);
      break;
    case ' ':
      // スペースキーが押された時はゲームの状態によって分岐
      //
      switch (gamestate) {
        case 0:
          setTimeout(newgame, 500);
          break;
        case 1:
          createshot();
          break;
        case 2:
          setTimeout(restart, 500);
          break;
        case 3:
          reset();
          break;
        case 4:
          reset();
          break;
      }
      break;
    // デバッグ用(qでリセット)、(wで強制クリア)、(eでゲームオーバー)、(rでウェーブクリア)、dでダメージ
    case 'q':
      reset();
      break;
    case 'w':
      gameend();
      break;
    case 'e':
      gameover();
      break;
    case 'r':
      waveclear();
      break;
    case 'd':
      damage();
      break;
  }
}
// リセット用関数
function reset() {
  gamestate = 0;
  score = 0;
  targetscore = 100;
  wave = 0;
  parameter.other.damagecount = 0;
  posreset();
  wstylemessage();
  msgtitle.textContent = 'ゲームの説明';
  msgtxt[0].innerHTML = `弾を打って的を壊し目標点を獲得してウェーブクリアを目指してください<br>
  的が画面下に到達するとライフが減少します<br>ライフを0以下にせずに10ウェーブクリアでゲームクリアです`;
  msgtxt[1].innerHTML = '操作方法<br>矢印キーで移動、spaceキーで弾を打てます';
  msgtxt[2].textContent = 'spaceキーを押してゲームを開始できます';
  // 念のためすべての動的divを消去
  cleardivs();
}
//ゲームオーバー時の処理
function gameover() {
  gamestate = 4;
  posreset();
  cleardivs();
  wstylemessage();
  msgtitle.textContent = 'GAME OVER';
  msgtxt[0].innerHTML = '';
  msgtxt[1].innerHTML = '';
  msgtxt[2].innerHTML = 'spaceキーを押すとタイトル画面に戻ります';
}
// ゲーム終了時の処理
function gameend() {
  gamestate = 3;
  wstylemessage();
  msgtitle.textContent = 'GAME CLEAR';
  msgtxt[0].innerHTML = wave + 'ウェーブ終了!ゲームクリアおめでとうございます!';
  msgtxt[1].innerHTML = '';
  msgtxt[2].innerHTML = 'spaceキーを押すとタイトル画面に戻ります';
  // 念のためすべての動的divを消去
  cleardivs();
}
// 初期化関数の切り分け
// 可変するものを消去
function cleardivs() {
  for (let i of document.querySelectorAll('.target')) {
    gamewindow.removeChild(i);
  }
  for (let i of document.querySelectorAll('.shot')) {
    gamewindow.removeChild(i);
  }
  parameter.shot = [];
  parameter.target = [];
}
// ライフリセット
function clearlife() {
  for (let i of document.querySelectorAll('.fill')) {
    lifearea.removeChild(i);
  }
  for (let i of document.querySelectorAll('.damaged')) {
    lifearea.removeChild(i);
  }
  life();
}
//ポジションリセット
function posreset() {
  parameter.chara[0].xpos = wwidth / 2 - parameter.chara[0].size[0] / 2;
  parameter.chara[0].ypos = wheight / 10;
}
//表示系の切り替え
function wstylemessage() {
  msgarea.style.display = 'block';
  mychara.style.visibility = 'hidden';
  scoreboard.style.display = 'none';
  lifearea.style.display = 'none';
}
function wstylegame() {
  msgarea.style.display = 'none';
  scoreboard.style.display = 'block';
  lifearea.style.display = 'flex';
  mychara.style.visibility = 'visible';
  scoreboard.textContent = `Score : ${score}/${targetscore}`;
  mychara.style.left = parameter.chara[0].xpos + 'px';
  mychara.style.bottom = parameter.chara[0].ypos + 'px';
}
//新規ゲーム
function newgame() {
  gamestate = 1;
  posreset();
  clearlife();
  wstylegame();
  score = 0;
  scoreboard.textContent = `Score : ${score}/${targetscore}`;
  createtarget();
  movingtimer();
}
//ステージクリア時の処理
function waveclear() {
  // ウェーブ10クリアでゲームクリア
  if (wave >= 10) {
    gameend();
  } else {
    gamestate = 2;
    wave++;
    targetscore += 10 * (wave + 10);
    posreset();
    wstylemessage();
    cleardivs();
    msgtitle.textContent = `ウェーブ${wave}クリア`;
    msgtxt[0].textContent = '次のウェーブの目標点数';
    msgtxt[1].textContent = `${score}/${targetscore}`;
    msgtxt[2].textContent = 'spaceキーを押して次のウェーブへ';
  }
}
//ステージクリア時及びポーズ解除時
function restart() {
  gamestate = 1;
  wstylegame();
  createtarget();
  movingtimer();
}
// 全部読み込んだらいったんリセット
reset();
