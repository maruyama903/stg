{
  //=============== 起動時の処理 ================
  function setup() {
    canvasSize(1200, 720);
    loadImg(40, "image/bg_tree.png"); //背景
    loadImg(41, "image/bg_mdlGrass.png"); //背景
    loadImg(42, "image/bg_road.png"); //背景
    loadImg(43, "image/bg_frtGrass.png"); //背景
    // loadImg(31, "image/bg_f.png"); //背景
    loadImg(1, "image/chikawa.png"); //自機
    loadImg(2, "image/sasmata.png"); //弾
    loadImg(3, "image/explode.png"); //エフェクト
    for (var i = 0; i <= 5; i++) loadImg(4 + i, "image/enemy" + i + ".png"); //敵の弾、敵機

    loadImg(20, "image/item_heart.png");//アイテム　ハート
    loadImg(21, "image/item_hachi.png");//アイテム　ハチ
    loadImg(22, "image/item_usa.png");//アイテム　うさ
    loadImg(25, "image/hachi.png");//アイテム効果　ハチワレ
    loadImg(12, "image/sasmata_shine.png"); //貫通弾
    loadImg(30, "image/title.png"); //タイトル用
    initSShip(); // 自機の座標を初期化
    initMissile(); //弾を管理する配列を初期化
    initObject(); //敵機を管理する配列の初期化;
    initEffect(); //エフェクトを管理する配列を初期化
    loadSound(0, "sound/bgm.m4a");
  }

  //===============  メインループ  -===============
  //---ゲームの進行を管理する変数 ---
  var idx = 0;
  var tmr = 0;
  var score = 0; //スコア
  var hisco = 10000; //ハイスコア
  var stage = 0; //ステージ数

  function mainloop() {
    fRect(0, 0, 1200, 720, "rgba(0, 0, 0, 0)"); //前の描写を削除
    tmr++; //タイマーをカウント
    setBG(); //背景のスクロール
    fText("報酬 " + score + "円", 600, 50, 40, "#5e5e5e");
    fText("最高報酬 " + hisco + "円", 200, 50, 32, "#e1a3a9");
    switch (idx) {
      // ---- タイトル画面 ----
      case 0:
        drawImg(30, 200, 200);
        if (tmr % 50 < 40) {
          fText(
            "クリックかスペースキーを押して討伐開始",
            600,
            600,
            40,
            "#5e5e5e"
          );
          fText(
            "キー操作：スペースで攻撃 矢印キーで移動",
            600,
            600,
            40,
            "#5e5e5e"
          );
          fText(
            "タッチ操作：タッチで移動",
            600,
            1000,
            30,
            "#5e5e5e"
          );
        }

        // スペースキーorタップでゲーム開始
        if (key[32] > 0 || tapC > 0) {
          initSShip();
          initObject();
          score = 0;
          stage = 1;
          idx = 1;
          tmr = 0;
          // playBgm(0); //BGMの出力
        }
        break;

      // ゲーム中
      case 1:
        //エネルギー0でゲームオーバーへ
        if (energy == 0) {
          idx = 2;
          tmr = 0;
          stopBgm();
        }
        setEnemy(); //出現させる敵の種類を制御
        setItem(); //出現させるアイテムを制御
        moveSShip(); // 自機の移動
        moveMissile(); /// 弾を動かす
        moveObject(); // 敵機を動かす;
        drawEffect(); //エフェクトを表示する;
        // エネルギー描画
        for (let i = 0; i < energy; i++) {
          drawImg(20, 20 + i * 70, 640);
        }
        // for (let i = 0; i < 10; i++) fRect(20 + i * 30, 660, 20, 40, "#c00000"); //赤い四角を10個描く
        // for (let i = 0; i < energy; i++)
        //   fRect(
        //     20 + i * 30,
        //     660,
        //     20,
        //     40,
        //     colorRGB(160 - 16 * i, 240 - 12 * i, 24 * i)
        //   ); //赤四角の上にエネルギー残量を描画
        //プレー前
        if (tmr < 30 * 4) fText("STAGE " + stage, 600, 300, 50, "#e1a3a9");
        //クリア表示
        if (30 * 130 < tmr && tmr < 30 * 135)
          fText("STAGE CLEAR", 600, 300, 50, "#e1a3a9");
        //次のステージへ
        if (tmr == 30 * 135) {
          stage++;
          tmr = 0;
        }
        break;

      //----- ゲームオーバー -----
      case 2:
        if (tmr < 30 * 2 && tmr % 5 == 1) {
          setEffect(ssX + rnd(120) - 60, ssY + rnd(80) - 40, 9);
        }
        moveMissile();
        moveObject();
        drawEffect();
        fText("GAME OVER", 600, 300, 50, "red");
        if (tmr > 30 * 5) idx = 0; //5秒経過で
        break;
    }


  }

  //================ 背景のスクロール ================
    var bgStdX = 0;
  function setBG() {
    drawBG(40, 0.5);
    drawBG(42, 1);
    drawBG(41, 1);
    drawBG(43, 1);

  }
  function drawBG(imgN, spd) {
    bgStdX = bgStdX + 1;
    bgX = int(bgStdX * spd) % 1200;
    // 画像を２枚横並べして、左に移動させる
        drawImg(imgN, -bgX, 0);
        drawImg(imgN, 1200 - bgX , 0);


  }

  //================  自機の管理 ================
  //--------- 自機の管理 -----------
  var ssX = 0;
  var ssY = 0;
  var automa = 0; //弾が自動発射か
  var energy = 0; //エネルギー
  var muteki = 0; //無敵効果時間
  var weapon = 0; //同時発射数
  var laser = 0; //貫通弾の使用回数
  // ----------- 自機の初期化 -----------
  function initSShip() {
    ssX = 400;
    ssY = 360;
    energy = 10; //ゲーム開始時にエネルギー量
    muteki = 0;
    weapon = 0;
    laser = 0;
  }
  // ----------- 押したキーにより自機を操作-----------
  function moveSShip() {
    // ---- キー操作で自機の座標を変更 --------
    if (key[37] > 0 && ssX > 60) ssX -= 20; //右にいく
    if (key[39] > 0 && ssX < 1000) ssX += 20; //左にいく
    if (key[38] > 0 && ssY > 40) ssY -= 20; //下にいく
    if (key[40] > 0 && ssY < 680) ssY += 20; //上にいく
    if (key[65] == 1) {
      // Aキーが押されたら
      key[65]++;
      automa = 1 - automa; //自動発射のon/offを切り替える
    }
    // ----- 弾の発射(自動＋手動) -------
    //自動発射OFF、スペースキーで弾を発射。
    if (automa == 0 && key[32] == 1) {
      key[32]++; //キー長押しでは弾は出なくする
      setWeapon(); //複数の弾を同時にセット
    }
    //自動発射ON
    if (automa == 1 && tmr % 8 == 0) setWeapon(); //定期を選び、うつ

    // 画面に自動発射の表示をする
    var col = "black";
    if (automa == 1) col = "white";
    fRect(900, 20, 280, 60, "blue");
    fText("[A]uto Missile", 1040, 50, 36, col);

    // -------- タップ操作 ----------
    if (tapC > 0) {
      if (900 < tapX && tapX < 1180 && 20 < tapY && tapY < 80) {
        // [A]uto Missileボタンの位置なら自動発射ON / OFFを切り替える
        tapC = 0;
        automa = 1 - automa;
      } else {
        //自機の座標をタップ位置に近づける
        ssX = ssX + int((tapX - ssX) / 6);
        ssY = ssY + int((tapY - ssY) / 6);
      }
    }
    // ----- 自機を描画 ------
    if (weapon > 0 && muteki % 2 == 0) {//weaponを所持するならハチワレを描画
      drawImgC(25, ssX - 50, ssY - 50);
    }
    if (muteki % 2 == 0) drawImgC(1, ssX, ssY); //無敵状態時に自機を点滅、2フレームに1回描画
    if (muteki > 0) muteki--; //無敵時間を減らす
  }

  //================= 弾の発射 ===================
  //---------- 弾を管理する配列 ---------
  var MSL_MAX = 100;
  var mslX = new Array(MSL_MAX); //弾のX座標
  var mslY = new Array(MSL_MAX); //弾のY座標
  var mslXp = new Array(MSL_MAX); //弾のX軸方向座標の変化量
  var mslYp = new Array(MSL_MAX); //弾のY軸方向座標の変化量
  var mslF = new Array(MSL_MAX); //弾が打ち出された状態か
  var mslImg = new Array(MSL_MAX); //弾の画像番号
  var mslNum = 0; //画面上にある弾の数

  //-------------- 弾を管理する配列を初期化する ------
  function initMissile() {
    //弾が打ち出された状態か管理する配列を初期化
    for (var i = 0; i < MSL_MAX; i++) mslF[i] = false;
    mslNum = 0;
  }
  //---------- 複数の弾を同時にセット --------------
  function setWeapon() {
    var n = 0;
    // weaponがあれば弾を２発同時に打つ
    if (weapon > 0) {
      weapon--;

      n = 1
    }

    for (var i = 0; i <= n; i++)
      setMissile(ssX + 40, ssY - n * 12 + i * 40, 40, int((i - n / 2) * 4)); //弾が飛んでいくと上下に開いていく
  }
  // ------------- 弾を打ち出す ---------------
  function setMissile(x, y, xp, yp) {
    mslX[mslNum] = x;
    mslY[mslNum] = y;
    mslXp[mslNum] = xp;
    mslYp[mslNum] = yp;
    mslF[mslNum] = true;

    mslImg[mslNum] = 2; //普通弾の画像番号を配列に代入
    //貫通弾の残りがあれば、貫通弾をセット
    if (laser > 0) {
      laser--;
      mslImg[mslNum] = 12; //貫通弾の画像番号を配列に代入
    }
    mslNum = (mslNum + 1) % MSL_MAX; //画面上にある弾の数を増やす(次に代入する位置を計算)
  }

  //------------ 弾を動かす------------
  function moveMissile() {
    for (var i = 0; i < MSL_MAX; i++) {
      if (mslF[i] == true) {
        //弾が打ち出されていれば
        mslX[i] = mslX[i] + mslXp[i]; //座標を変化
        mslY[i] = mslY[i] + mslYp[i];
        drawImgC(mslImg[i], mslX[i], mslY[i]);
        if (mslX[i] > 1200) mslF[i] = false; //画面から出たら打ち出されていない状態にする
      }
    }
  }

  //================ 敵機を動かす =====================
  //----- 物体(敵機+敵機の弾)管理する配列 -------
  var OBJ_MAX = 100; // 敵機の最大個数
  var objType = new Array(OBJ_MAX); //物体の種類を管理。0=敵の弾、1= 敵機
  var objImg = new Array(OBJ_MAX); //物体の画像番号を管理
  var objX = new Array(OBJ_MAX); //敵機のX座標
  var objY = new Array(OBJ_MAX); //Y座標
  var objXp = new Array(OBJ_MAX); //X軸方向の変化量
  var objYp = new Array(OBJ_MAX); //Y軸方向の変化量
  var objLife = new Array(OBJ_MAX); //敵のライフ
  var objF = new Array(OBJ_MAX); //敵機が出現しているか
  var objNum = 0;
  //--------- 配列の初期化 --------
  function initObject() {
    for (var i = 0; i < OBJ_MAX; i++) objF[i] = false;
    objNum = 0;
  }
  // ----------出現させる敵の種類を制御 -------------
  // それぞれの敵をを違うタイミングで出現させる;
  function setEnemy() {
    var sec = int(tmr / 30); //経過秒数
    // 物体の種類(1は敵),画像番号,出現x座標,y座標,x移動距離,y移動,ライフ
    if (4 <= sec && sec < 10) {
      if (tmr % 20 == 0)
        setObject(1, 4, 1300, 60 + rnd(600), -12, 12, 2 * stage); //敵虫(上下動き)
    }
    if (14 <= sec && sec < 20) {
      if (tmr % 10 == 0)
        setObject(1, 5, 1300, 60 + rnd(600), -10, 0, 1 * stage); //敵ゴブリン(多い)

    }
    if (24 <= sec && sec < 30) {
      if (tmr % 30 == 0)
        setObject(1, 6, 1300, 360 + rnd(300), -10, 0, 10 * stage); //敵甲王(強い)
    }
    if (34 <= sec && sec < 50) {
      if (tmr % 60 == 0) setObject(1, 7, 1300, rnd(500), -40, 6, 5 * stage); //敵悪夢
    }
    if (54 <= sec && sec < 70) {
      if (tmr % 20 == 0) {
        setObject(1, 5, 1300, 60 + rnd(300), -16, 4, 1 * stage); //敵ゴブリン(多い)
        setObject(1, 5, 1300, 360 + rnd(300), -16, -4, 1 * stage); //敵ゴブリン(多い)
      }
    }
    if (74 <= sec && sec < 90) {
      if (tmr % 20 == 0)
        setObject(1, 4, 1300, 60 + rnd(600), -40, 8, 3 * stage); //敵虫(上下動き)
      if (tmr % 45 == 0) setObject(1, 6, 1300, rnd(720 - 192), -30, 0, 0); //敵甲王(強い)
    }
    if (94 <= sec && sec < 110) {
      if (tmr % 10 == 0)
      setObject(1, 5, 1300, 360, -24, rnd(11) - 5, 1 * stage); //敵ゴブリン(多い)
      if (tmr % 30 == 0)
        setObject(1, 7, 1300, rnd(300), -50, 10 + rnd(20), 5 * stage); //敵悪夢
    }
        if (115 <= sec && sec < 130) {
          if (tmr % 30 == 0) {
            setObject(1, 9, 1300, 360, -12, rnd(11) - 5, 50* stage); //敵あの子
          }

        }
  }
  //----------- 敵機をセットする-----------
  function setObject(typ, png, x, y, xp, yp, lif) {
    objType[objNum] = typ; //配列に物体の種類を代入。0:敵弾1:敵、2:アイテム
    objImg[objNum] = png; //配列に物体の画像番号を代入
    objX[objNum] = x;
    objY[objNum] = y;
    objXp[objNum] = xp;
    objYp[objNum] = yp;
    objLife[objNum] = lif; //何発当てると壊せるか
    objF[objNum] = true;
    objNum = (objNum + 1) % OBJ_MAX;
  }
  // ---------敵機を動かす-----------
  function moveObject() {
    for (var i = 0; i < OBJ_MAX; i++) {
      if (objF[i] == true) {
        //-------------- 敵機を動かし描画 ---------------
        objX[i] = objX[i] + objXp[i];
        objY[i] = objY[i] + objYp[i];
        //敵虫の特殊動き。画面上下を跳ね返る
        if (objImg[i] == 4) {
          if (objY[i] < 60) objYp[i] = 8;
          if (objY[i] > 660) objYp[i] = -8;
        }
        //敵悪夢の特殊な動き。左へ移動しているなら減速、速度が0になれば弾を打ち右へ移動
        if (objImg[i] == 7) {
          if (objXp[i] < 0) {
            objXp[i] = int(objXp[i] * 0.95);
            if (objXp[i] == 0) {
              setObject(0, 8, objX[i], objY[i], -20, 0, 0); //弾を撃つ
              objXp[i] = 20;
            }
          }
        }
        drawImgC(objImg[i], objX[i], objY[i]);
        //--------- 自機弾と敵機ヒットチェック -----------
        if (objType[i] == 1) {
          //敵機なら調べる
          var r = 12 + (img[objImg[i]].width + img[objImg[i]].height) / 4; //ヒットチェックの径(距離)。自機弾を半径12の円、敵機をimg[o~/4半径の円に見立てる。接触時２つの物体の中心点の距離を求める。
          for (let j = 0; j < MSL_MAX; j++) {
            //自機弾全部との距離を調べる
            if (mslF[j] == true) {
              if (getDis(objX[i], objY[i], mslX[j], mslY[j]) < r) {
                if (mslImg[j] == 2) {
                  mslF[j] = false; //敵機に当たった自機通常弾を消す
                }
                objLife[i]--; //敵のライフを減らす
                if (objLife[i] == 0) {
                  objF[i] = false;
                   score = score + 100;
                   if (score > hisco) hisco = score;
                  setEffect(objX[i], objY[i], 9); //敵が壊れた時のエフェクトをセット
                } else {
                  setEffect(objX[i], objY[i], 3); //弾が敵に当たった時（敵が壊れない）エフェクトをセット
                }
              }
            }
          }
        }
        //----- 自機と物体(敵機,敵弾,アイテム)のヒットチェック ------
        if (idx == 1) {
          //ゲーム中のみ
          var r = 30 + (img[objImg[i]].width + img[objImg[i]].height) / 4; //ヒットチェックの径(距離)
          if (getDis(objX[i], objY[i], ssX, ssY) < r) {
            //******* 自機と敵機＋敵弾が当たる*******
            if (objType[i] <= 1 && muteki == 0) {
              //敵弾・敵機かつ無敵でない
              objF[i] = false;
              setEffect(objX[i], objY[i], 9);
              energy--;
              muteki = 30;
            }
            //***** 自機とアイテムとのヒットチェック****
            if (objType[i] == 2) {
              objF[i] = false;
              if (objImg[i] == 20 && energy < 10) energy++; //エネルギー回復
              if (objImg[i] == 21) weapon = weapon + 25; //弾の数を２倍。25回打てる。
              // if (objImg[i] == 21) weapon++; //弾の数を増やす
              if (objImg[i] == 22) laser = laser + 25; //貫通弾を撃つ。合計50発打てる
            }
          }
        }
        // ------ 画面から出たら、出現していない状態にする ------

        if (objX[i] < -100 || objX[i] > 1300 || objY[i] < -100 || objY[i] > 820)
          objF[i] = false;
      }
    }
  }

  //============ エフェクト（爆発演出）の管理 =============
  var EFCT_MAX = 100; //エフェクトの最大数
  var efctX = new Array(EFCT_MAX);
  var efctY = new Array(EFCT_MAX);
  var efctN = new Array(EFCT_MAX);
  var efctNum = 0; //現在のエフェクト数

  // ----- エフェクトを管理する配列を初期化 -----
  function initEffect() {
    for (var i = 0; i < EFCT_MAX; i++) efctN[i] = 0;
    efctNum = 0;
  }

  //--------- エフェクトをセットする ---------
  function setEffect(x, y, n) {
    efctX[efctNum] = x; //座標を挿入
    efctY[efctNum] = y;
    efctN[efctNum] = n; //エフェクト表示開始の絵番号
    efctNum = (efctNum + 1) % EFCT_MAX;
  }

  //--------- エフェクトを表示する --------
  function drawEffect() {
    for (var i = 0; i < EFCT_MAX; i++) {
      if (efctN[i] > 0) {
        //番号がセットされていたら
        drawImgTS(
          3,
          (9 - efctN[i]) * 128,
          0,
          128,
          128,
          efctX[i] - 64,
          efctY[i] - 64,
          128,
          128
        ); //エフェクトを描画。一列に絵が並んだ画像の切り取る部分を変えていく。
        efctN[i]--; //絵番号を次の値にする
      }
    }
  }

  //============ アイテムをセットする ===============
  function setItem() {
    if (tmr % 90 == 0 && rnd(2) == 0)
      setObject(2, 20, 1300, 60 + rnd(600), -10, 0, 0); // 回復アイテム
    if (tmr % 90 == 30 && rnd(2) == 0)
      setObject(2, 21, 1300, 60 + rnd(600), -10, 0, 0); // 球数増アイテム
    if (tmr % 90 == 60 && rnd(2) == 0)
      setObject(2, 22, 1300, 60 + rnd(600), -10, 0, 0); // 貫通弾アイテム
  }
}
