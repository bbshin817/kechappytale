$(function(){
	_.ui = {
		msgState : false,
		message : (message) => {
			_.ui.messageCancel();
			return new Promise(async (resolve) => {
				$("row-inner-textbox[type=\"talk\"]").empty();
				$("row-inner-textbox[type=\"branch\"]").empty();
				_.ui.msgState = true;
				for(let a=0; a<message.length; a++){
					if(!_.ui.msgState) break;
					let m = message[a].split("");
					$("row-inner-textbox[type=\"talk\"]").append("<talk-box><text class=\"talk-sign\">＊</text><text class=\"talk-message\"></text></talk-box>");
					for(let i=0; i<m.length; i++){
						if(!_.ui.msgState) break;
						await _.api.sleep(m[i] == "\n" ? 100 : 25);
						$("talk-box").eq(a).find("text.talk-message").append(m[i] == "\n" ? "<br>" : m[i]);
					}
					await _.api.sleep(100);
				}
				_.ui.msgState = false;
				resolve();
			})
		},
		messageCancel : () => {
			_.ui.msgState = false;
			$("row-inner-textbox[type=\"talk\"]").empty();
			$("row-inner-textbox[type=\"branch\"]").empty();
		},
		branch : (options, btnType) => {
			return new Promise((resolve) => {
				$("row-inner-textbox[type=\"talk\"]").empty();
				$("row-inner-textbox[type=\"branch\"]").empty();
				if(options[0].option && options[0].option == "battle"){
					$("row-inner-textbox[type=\"branch\"]").append("<row-options-wrap type=\"middle\"></row-options-wrap>");
				}else{
					$("row-inner-textbox[type=\"branch\"]").append("<row-options-wrap type=\"left\"></row-options-wrap><row-options-wrap type=\"right\"></row-options-wrap>");
				}
				let column = 1;
				for(let i=0; i<options.length; i++){
					let o = options[i];
					if(o.option && o.option == "battle"){
						$("row-options-wrap[type=\"middle\"]").append(`<btn btnType="${btnType}" class="branch-option" btnValue="${o.value}" row="1" column="${column}" style="align-items: center;"><text class="row-option-label"><span class="sign">＊</span><span class="body">${o.display}</span></text><hp-meter-inside><div style="width: ${_.game.hp.kechappy.now / _.game.hp.kechappy.max * 100}%"></div></hp-meter-inside></row-option>`);
					}else{
						// 奇数であれば
						if(0 == i % 2){
							$("row-options-wrap[type=\"left\"]").append(`<btn btnType="${btnType}" class="branch-option" btnValue="${o.value}" row="1" column="${column}"><text class="row-option-label"><span class="sign">＊</span><span class="body">${o.display}</span></text></row-option>`);
						}else{
							$("row-options-wrap[type=\"right\"]").append(`<btn btnType="${btnType}" class="branch-option" btnValue="${o.value}" row="2" column="${column}"><text class="row-option-label"><span class="sign">＊</span><span class="body">${o.display}</span></text></row-option>`);
							column++;
						}
					}
				}
				_.btn.btnTypes["branch-option"] = {
					row : 2,
					column : column
				};
				resolve();
			});
		},
		fukidashi : (message) => {
			return new Promise(async (resolve) => {
				let m = message.split("");
				$("row-character").find("origin").append("<fukidashi></fukidashi>");
				for(let i=0; i<m.length; i++){
					$("fukidashi").append(`<text class="fukidashi">${m[i]}</text>`);
					await _.api.sleep(50);
				}
				resolve();
			});
		},
		clearFukidashi : () => {
			$("fukidashi").remove();
		},
		displayState : (type) => {
			$("display").addClass("disable");
			$(`display[type="${type}"]`).removeClass("disable");
		},
		randomMessage : (msgs = null) => {
			let messages;
			if(!!msgs){
				messages = msgs;
			}else{
				messages = [
					"ケチャッピーは　なにもかんがえず\nせんとうに　むきあうつもりらしい"
				];
			}
			_.ui.message([
				messages[Math.floor(Math.random() * messages.length)]
			]);
		},
		randomFukidashi : (type) => {
			return new Promise(async (resolve) => {
				let fukidashis = {
					"battle-user" : [
						"これけっこういたいんだよね...",
						"たたかいがすきなんだね",
						"いたい...",
						"ケチャッピーだっていきてるんだぞ！",
						"こうげきするのやめてくれないかな",
						"タコライスたべたい...",
						"やめて...！"
					],
					"battle-miss" : [
						"やるきある？",
						"なにしてるん？",
						"へたくそかな？"
					],
					"mouthKusai" : [
						"だまれ",
						"みがいとるわ",
						"ちゃんとまいにちみがいてますよ！"
					],
					"intai" : [
						"は？",
						"なんやこいつ..."
					],
					"najiru" : [
						"...",
						"なんでそういうこというん？",
					],
					"tacorice" : [
						"タコライスおいしいよねー！",
						"いいなー！タコライス！",
						"ぼくもほしい！"
					],
					"nothing" : [
						"いまたべなくてよくない？",
						"たべるひつようあった？",
						"おなかすいてる？"
					]
				};
				await _.ui.fukidashi(fukidashis[type][Math.floor(Math.random() * fukidashis[type].length)]);
				resolve();
			});
		}
	};

	_.btn = {
		listen : true,
		nowFocus : {
			btnType : null,
			btnValue : null,
			row : null,
			column : null
		},
		btnTypes : {
			"fight-option" : {
				row : 4,
				column : 1
			},
			"branch-option" : {}
		},
		/*
		array = {btnType:, row:, column:}
		*/
		focus : (array) => {
			_.btn.nowFocus = array;
			$("btn").attr("focus", "false");
			switch(array.btnType){
				case "battle-option":
					$("btn[btnType=\"battle-option\"]").attr("state", "false");
					break;
			}
			let d = $(`btn[btnType="${array.btnType}"][row="${array.row}"][column="${array.column}"]`);
			d.attr("focus", "true");
			d.attr("state", "true");
		},
		common : () => {

		},
		x : (pn) => {
			if(_.btn.nowFocus.btnType == null) return false;
			let newRow = _.btn.nowFocus.row + pn;
			let nf = _.btn.nowFocus;
			let d = $(`btn[btnType="${_.btn.nowFocus.btnType}"][row="${newRow}"][column="${_.btn.nowFocus.column}"]`);
			if(0 < newRow && (0 < d.length)){
				nf.row = newRow;
				nf.btnValue = d.attr("btnValue");
				_.btn.focus(nf);
				_.sound.se.play("squeak");
			}
		},
		left : () => {
			_.btn.common("left");
			if(_.game.battleField.isBattle){
				_.game.battleField.heartMove.keyEvents.left = false;
			}else{
				_.btn.x(-1);
			}
		},
		right : () => {
			_.btn.common("right");
			if(_.game.battleField.isBattle){
				_.game.battleField.heartMove.keyEvents.right = false;
			}else{
				_.btn.x(1);
			}
		},
		y : (pn) => {
			if(_.btn.nowFocus.btnType == null) return false;
			let newColumn = _.btn.nowFocus.column + pn;
			let nf = _.btn.nowFocus;
			let d = $(`btn[btnType="${_.btn.nowFocus.btnType}"][row="${_.btn.nowFocus.row}"][column="${newColumn}"]`);
			if(0 < newColumn && 0 < d.length){
				nf.column = newColumn;
				nf.btnValue = d.attr("btnValue");
				_.btn.focus(nf);
				_.sound.se.play("squeak");
			}
		},
		up : () => {
			_.btn.common("up");
			if(_.game.battleField.isBattle){
				_.game.battleField.heartMove.keyEvents.top = false;
			}else{
				_.btn.y(-1);
			}
		},
		down : () => {
			_.btn.common("down");
			if(_.game.battleField.isBattle){
				_.game.battleField.heartMove.keyEvents.bottom = false;
			}else{
				_.btn.y(1);
			}
		},
		enter : () => {
			_.btn.common("enter");
			if(_.btn.nowFocus.btnType == null) return false;
			_.game.frame[_.btn.nowFocus.btnType].submit(_.btn.nowFocus.btnValue);
		},
		shift : () => {
			if(_.game.battleField.isBattle){
				_.game.battleField.heartMove.heartSpeed = _.game.battleField.heartMove.heartDefaultSpeed;
			}else{
				if(_.btn.nowFocus.btnType == null) return false;
				let i = _.game.frameHistory.length;
				if(0 < i){
					let obj = _.game.frameHistory[i - 1];
					_.game.loadFrame(obj.focused.btnType, "return");
					_.btn.focus(obj.focused);
				}
			}
		},
		ctrl : () => {

		}
	};

	_.sound = {
		load : {
			ctx : null,
			sounds : {},
			blobs : {},
			soundsLoad : () => {
				return new Promise(async (resolve) => {
					for(let mk in sounds){
						_.sound.load.sounds[mk] = {};
						let a, bf;
						for(let ik in sounds[mk]){
							a = await sounds[mk][ik].arrayBuffer();
							_.sound.load.sounds[mk][ik] = {};
							bf = await (new Promise((res, rej) => {
								_.sound.load.ctx.decodeAudioData(a, res, rej);
							}));
							_.sound.load.sounds[mk][ik].bf = bf;
							_.sound.load.sounds[mk][ik].body = _.sound.load.ctx.createBufferSource();
							_.sound.load.sounds[mk][ik].body.buffer = bf;
							_.sound.load.sounds[mk][ik].gain =  _.sound.load.ctx.createGain();
							_.sound.load.sounds[mk][ik].body.connect(_.sound.load.sounds[mk][ik].gain);
							_.sound.load.sounds[mk][ik].gain.connect(_.sound.load.ctx.destination);
						}
					}
					resolve();
				});
			},
			volumeValue : 1,
			volume : (int) => {
				_.sound.load.volumeValue = int;
			}
		},
		se : {
			play : async (type, loop = false) => {
				_.sound.load.sounds.se[type].gain.gain.value = _.sound.load.volumeValue;
				_.sound.load.sounds.se[type].body.loop = false;
				_.sound.load.sounds.se[type].body.start(0);
				_.sound.load.sounds.se[type].body = _.sound.load.ctx.createBufferSource();
				_.sound.load.sounds.se[type].body.buffer = _.sound.load.sounds.se[type].bf;
				_.sound.load.sounds.se[type].gain =  _.sound.load.ctx.createGain();
				_.sound.load.sounds.se[type].body.connect(_.sound.load.sounds.se[type].gain);
				_.sound.load.sounds.se[type].gain.connect(_.sound.load.ctx.destination);
			},
			stop : (type) => {
				_.sound.load.sounds.se[type].body.stop();
			}
		},
		bgm : {
			play : async (type, loop = false, duration = 0) => {
				_.sound.load.sounds.bgm[type].body = _.sound.load.ctx.createBufferSource();
				_.sound.load.sounds.bgm[type].body.buffer = _.sound.load.sounds.bgm[type].bf;
				_.sound.load.sounds.bgm[type].gain =  _.sound.load.ctx.createGain();
				_.sound.load.sounds.bgm[type].body.connect(_.sound.load.sounds.bgm[type].gain);
				_.sound.load.sounds.bgm[type].gain.connect(_.sound.load.ctx.destination);
				_.sound.load.sounds.bgm[type].gain.gain.value = _.sound.load.volumeValue;
				_.sound.load.sounds.bgm[type].body.loop = loop;
				_.sound.load.sounds.bgm[type].body.start(0, duration);
			},
			stop : (type) => {
				_.sound.load.sounds.bgm[type].body.stop();
			}
		}
	}

	$(document).on("keyup", (e) => {
		if(!_.btn.listen) return false;
		switch(e.code){
			case "ArrowUp":
				_.btn.up();
				break;
			case "ArrowDown":
				_.btn.down();
				break;
			case "ArrowLeft":
				_.btn.left();
				break;
			case "ArrowRight":
				_.btn.right();
				break;
			case "Enter":
				_.btn.enter();
				break;
			case "KeyZ":
				_.btn.enter();
				break;
			case "KeyX":
				_.btn.shift();
				break;
			case "ShiftLeft":
				_.btn.shift();
				break;
			case "ShiftRight":
				_.btn.shift();
				break;
			case "KeyC":
				_.btn.ctrl();
				break;
			case "ControlLeft":
				_.btn.ctrl();
				break;
			case "ControlRight":
				_.btn.ctrl();
				break;
		}
	});

	$(document).on("keydown", (e) => {
		if(!_.btn.listen) return false;
		switch(e.code){
			case "ArrowUp":
				if(_.game.battleField.isBattle){
					_.game.battleField.heartMove.keyEvents.top = true;
				}
				break;
			case "ArrowDown":
				if(_.game.battleField.isBattle){
					_.game.battleField.heartMove.keyEvents.bottom = true;
				}
				break;
			case "ArrowLeft":
				if(_.game.battleField.isBattle){
					_.game.battleField.heartMove.keyEvents.left = true;
				}
				break;
			case "ArrowRight":
				if(_.game.battleField.isBattle){
					_.game.battleField.heartMove.keyEvents.right = true;
				}
				break;
			case "ShiftLeft":
				if(_.game.battleField.isBattle){
					_.game.battleField.heartMove.heartSpeed /= 2;
				}
				break;
			case "ShiftRight":
				if(_.game.battleField.isBattle){
					_.game.battleField.heartMove.heartSpeed /= 2;
				}
				break;
		}
	});

	$("input.volume").on("change", function(){
		let i = (Number)($(this).val()) / 100;
		localStorage.setItem("volume", i);
		_.sound.load.volume(i);
	});
});