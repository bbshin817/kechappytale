$(function(){
	_.game = {
		hp : {
			kechappy : {
				now : 500,
				max : 500
			},
			me : {
				now : 20,
				max : 20
			}
		},
		frameHistory : [],
		loadFrame : (btnType, type = "go", callMethod = null) => {
			return new Promise(async (resolve) => {
				switch(type){
					case "go":
						if(_.btn.nowFocus.btnType != null){
							_.game.frameHistory.push({
								frameId : _.game.frameHistory.length,
								focused : _.btn.nowFocus
							});
						}
						break;
					case "return":
						_.sound.se.play("select");
						let i = _.game.frameHistory.length - 1;
						_.game.frameHistory = _.game.frameHistory.filter(n => _.game.frameHistory[i].frameId != n.frameId);
						break;
				}
				if(_.game.frame[btnType]){
					await _.game.frame[btnType].call(callMethod);
				}
				resolve();
			});
		},
		exitUserSelect : () => {
			_.game.frameHistory = [];
			_.btn.nowFocus = {
				btnType : null,
				btnValue : null,
				row : null,
				column : null
			};
			let d = $("btn[btnType=\"battle-option\"]");
			d.attr("state", "false");
			d.attr("focus", "false");
		},
		hpRender : () => {
			let hp = null;
			setInterval(() => {
				if(hp != _.game.hp.me.now){
					let p = $("row-ui").find("text.hp");
					p.find("span.now").text(_.game.hp.me.now);
					p.find("span.max").text(_.game.hp.me.max);
					$("hp-meter").find("div").css("width", `${Math.trunc(_.game.hp.me.now / _.game.hp.me.max * 100)}%`);
				}
			});
		}
	};

	_.game.parts = {
		fight : (pointType) => {
			return new Promise(async (resolve) => {
				_.btn.focus({
					btnType : null,
					btnValue : null,
					row : null,
					column : null
				});
				_.game.fightTarget.fightTargetInterval(false);
				_.api.sleep(2000).then(async () => {
					await _.ui.randomFukidashi(`battle-${pointType}`);
					await _.api.sleep(1000);
					_.ui.clearFukidashi();
				});
				await _.api.sleep(250);
				await _.game.battleField.setField({
					state : true,
					type : "default"
				});
				await _.game.battleField.enemy.enemyPart();
				await _.game.battleField.setField({
					state : false
				});
				_.ui.randomMessage();
				_.btn.focus({
					btnType : "battle-option",
					btnValue : "fight",
					row : 1,
					column : 1
				});
				resolve();
			})
		},
		act : (actType) => {
			return new Promise(async (resolve) => {
				_.btn.focus({
					btnType : null,
					btnValue : null,
					row : null,
					column : null
				});
				_.game.fightTarget.fightTargetInterval(false);
				_.api.sleep(1500).then(async () => {
					await _.ui.randomFukidashi(actType);
					await _.api.sleep(1000);
					_.ui.clearFukidashi();
				});
				await _.api.sleep(250);
				await _.game.battleField.setField({
					state : true,
					type : "default"
				});
				await _.game.battleField.enemy.enemyPart();
				await _.game.battleField.setField({
					state : false
				});
				_.ui.randomMessage();
				_.btn.focus({
					btnType : "battle-option",
					btnValue : "act",
					row : 2,
					column : 1
				});
				resolve();
			});
		},
		item : (type) => {
			return new Promise(async (resolve) => {
			_.btn.focus({
				btnType : null,
				btnValue : null,
				row : null,
				column : null
			});
			_.game.fightTarget.fightTargetInterval(false);
			_.api.sleep(1500).then(async () => {
				await _.ui.randomFukidashi(type);
				await _.api.sleep(1000);
				_.ui.clearFukidashi();
			});
			await _.api.sleep(250);
			await _.game.battleField.setField({
				state : true,
				type : "default"
			});
			await _.game.battleField.enemy.enemyPart();
			await _.game.battleField.setField({
				state : false
			});
			_.ui.randomMessage();
			_.btn.focus({
				btnType : "battle-option",
				btnValue : "item",
				row : 3,
				column : 1
			});
			resolve();
		});
		}
	}

	_.game.fightTarget = {
		ready : () => {
			$("row-inner-textbox[type=\"talk\"]").empty();
			$("row-inner-textbox[type=\"branch\"]").empty();
		},
		state : (bool) => {
			$("fight-target").attr("state", bool ? "true" : "false");
		},
		fightTargetIv : null,
		stopPoint : null,
		targetPoint : null,
		fightTargetInterval : (bool) => {
			if(bool){
				_.game.fightTarget.state(true);
				_.game.fightTarget.stopPoint = null;
				$("div.fight-target-line").removeClass("attack");
				let i = 0;
				let flag = 1;
				_.game.fightTarget.fightTargetIv = setInterval(() => {
					if(0 == i){
						flag = 1;
					}else if(100 == i){
						_.game.fightTarget.stopPoint = -1;
						clearTimeout(_.game.fightTarget.fightTargetIv);
						return false;
					}
					i += flag;
					_.game.fightTarget.targetPoint = i;
					$("div.fight-target-line").css("left", `calc((100% - 0.9rem) * ${i / 100})`);
				}, 10);
			}else{
				$("div.fight-target-line").addClass("attack");
				_.game.fightTarget.stopPoint = _.game.fightTarget.targetPoint;
				clearTimeout(_.game.fightTarget.fightTargetIv);
			}
		},
		listenFightTarget : () => {
			return new Promise((resolve) => {
				let i = setInterval(() => {
					let p = _.game.fightTarget.stopPoint;
					if(!!p){
						clearInterval(i);
						if(0 < p){
							let p = _.game.fightTarget.targetPoint;
							resolve({
								type : "user",
								point : p
							});
						}else{
							resolve({
								type : "miss",
								point : 0
							});
						}
					}
				});
			});
		}
	};

	_.game.battleField = {
		isBattle : false,
		fieldTypes : {
			default : {
				width : 30,
				aspectRatio : [1, 1]
			}
		},
		ivObj : [],
		state : (type, bool) => {
			$("row-textbox").attr(type, bool ? "true" : "false");
		},
		clearAllIv : () => {
			return new Promise((resolve) => {
				_.game.battleField.ivObj.forEach(ivObj => {
					clearInterval(ivObj);
				});
				resolve();
			})
		},
		iv : (fnc, interval) => {
			_.game.battleField.ivObj.push(setInterval(fnc, interval));
		},
		/*
		obj : {
			state : [boolean],
			type : ""
		};
		*/
		setFieldSizes : {
			width : null,
			height : null
		},
		setField : (obj) => {
			return new Promise(async (resolve) => {
				let d = $("row-inner-textbox[type=\"battle\"]");
				if(obj.state){
					await _.api.sleep(2000);
					_.game.fightTarget.state(false);
					_.game.battleField.state("battle", true);
					await _.api.sleep(10);
					let {width, aspectRatio} = _.game.battleField.fieldTypes[obj.type];
					_.game.battleField.setFieldSizes.width = width;
					let w = h = 100;
					_.ui.messageCancel();
					await new Promise((resolve) => {
						_.game.battleField.iv(() => {
							if(w == width){
								_.game.battleField.clearAllIv();
								resolve();
							}else{
								d.css("width", `${w}%`);
								$("div.fight-target-body").css("transform", `scaleX(${w / 100})`);
								w -= 1;
							}
						}, 7.5);
					});
					let height = Math.trunc((d.width() / aspectRatio[0]) * aspectRatio[1] / d.height() * 100);
					_.game.battleField.setFieldSizes.height = height;
					let hFlag = h < height ? 1 : -1;
					await new Promise((resolve) => {
						_.game.battleField.iv(() => {
							if(h == height){
								_.game.battleField.clearAllIv();
								resolve();
							}else{
								d.css("height", `${h}%`);
								h += hFlag;
							}
						}, 7.5);
					});
					$("div.fight-target-body").css("transform", "");
					_.game.battleField.state("battleAlpha", true);
					_.game.battleField.isBattle = true;
					_.btn.listen = true;
					_.game.battleField.heartMove.startMoveHandler();
				}else{
					_.game.battleField.heartMove.exitMoveHandler();
					_.game.battleField.state("battleAlpha", false);
					_.game.battleField.isBattle = false;
					_.game.battleField.enemy.clear();
					let {width, height} = _.game.battleField.setFieldSizes;
					await new Promise((resolve) => {
						_.game.battleField.iv(() => {
							if(width == 100){
								_.game.battleField.clearAllIv();
								d.css("width", "");
								resolve();
							}else{
								d.css("width", `${width}%`);
								width += 1;
							}
						}, 7.5);
					});
					let hFlag = 100 < height ? -1 : 1;
					await new Promise((resolve) => {
						_.game.battleField.iv(() => {
							if(height == 100){
								_.game.battleField.clearAllIv();
								d.css("height", "");
								resolve();
							}else{
								d.css("height", `${height}%`);
								height += hFlag;
							}
						}, 7.5);
					});
					_.game.battleField.state("battle", false);
				};
				resolve();
			});
		},
		heartMove : {
			heartDefaultSpeed : 1,
			heartSpeed : 1,
			keyEvents : {
				top : false,
				bottom : false,
				left : false,
				right : false
			},
			startMoveHandler : () => {
				let d = $("heart");
				$("heart").removeClass("vanish");
				d.css({
					top : "",
					left : ""
				});
				_.game.battleField.iv(() => {
					let limits = {
						x : {
							min : 0,
							max : (d.parent().width() - 20)
						},
						y : {
							min : 0,
							max : (d.parent().height() - 20)
						}
					};
					let k = _.game.battleField.heartMove.keyEvents;
					let pos = _.game.battleField.heartMove.pos();
					let newPos;
					if(k.top){
						newPos = pos.y + _.game.battleField.heartMove.heartSpeed * -1;
						if(limits.y.min <= newPos && newPos <= limits.y.max){
							d.css("top", `${newPos}px`);
						}
					}
					if(k.bottom){
						newPos = pos.y + _.game.battleField.heartMove.heartSpeed;
						if(limits.y.min <= newPos && newPos <= limits.y.max){
							d.css("top", `${newPos}px`);
						}
					}
					if(k.left){
						newPos = pos.x + _.game.battleField.heartMove.heartSpeed * -1;
						if(limits.x.min <= newPos && newPos <= limits.x.max){
							d.css("left", `${newPos}px`);
						}
					}
					if(k.right){
						newPos = pos.x + _.game.battleField.heartMove.heartSpeed;
						if(limits.x.min <= newPos && newPos <= limits.x.max){
							d.css("left", `${newPos}px`);
						}
					}
				}, 0);
			},
			exitMoveHandler : () => {
				_.game.battleField.clearAllIv();
				_.game.battleField.heartMove.keyEvents.top = _.game.battleField.heartMove.keyEvents.bottom = _.game.battleField.heartMove.keyEvents.left = _.game.battleField.heartMove.keyEvents.right = false;
				$("heart").addClass("vanish");
			},
			pos : () => {
				return {
					x : $("heart").position().left,
					y : $("heart").position().top
				};
			},
			resetHeart : () => {
				$("heart").css({
					top : "",
					left : ""
				});
			}
		},
		attack : {
			damageThs : [0, 10],
			getDamage : (point) => {
				return new Promise((resolve) => {
					let ratio = point;
					if(50 < ratio){
						ratio = 100 - ratio;
					}
					ratio *= 2;
					let damageArray = [];
					for(let i=0; i<101; i++){
						damageArray.push(Math.trunc(Math.random() * (_.game.battleField.attack.damageThs[1] - _.game.battleField.attack.damageThs[0]) + _.game.battleField.attack.damageThs[0]));
					}
					damageArray.sort((a, b) => {
						return a - b;
					});
					resolve(damageArray[Math.trunc(ratio)] ** 2);
				})
			},
			attackMotion : () => {
				return new Promise(async (resolve) => {
					$("row-character").find("origin").append("<attack></attack>");
					_.sound.se.play("laz", true);
					await _.api.sleep(900);
					$("row-character").find("attack").remove();
					resolve();
				});
			},
			damageMotion : () => {
				return new Promise(async (resolve) => {
					$("kechappy").addClass("damaged");
					await _.api.sleep(1100);
					$("kechappy").removeClass("damaged");
					resolve();
				});
			},
			/*
			obj : {
				type : "user"/"miss",
				point : 0
			}
			*/
			damage : (obj) => {
				return new Promise(async (resolve) => {
					let d = $("row-character").find("origin");
					switch(obj.type){
						case "user":
							let nowKechaHp = Math.trunc(_.game.hp.kechappy.now / _.game.hp.kechappy.max * 100);
							let html = "";
							let damage = await _.game.battleField.attack.getDamage(obj.point);
							_.game.hp.kechappy.now -= damage;
							if(_.game.hp.kechappy.now < 0) _.game.hp.kechappy.now = 0;
							let damageArray = (String)(damage).split("");
							for(let i=0; i<damageArray.length; i++){
								html += `<dt-body type="number" num="${damageArray[i]}"></dt-body>`;
							}
							await _.api.sleep(200);
							await _.game.battleField.attack.attackMotion();
							await _.api.sleep(100);
							_.game.battleField.attack.damageMotion();
							$("display[type=\"battle\"]").addClass("bv");
							_.sound.se.play("damage", true);
							d.append(`<damageText class="damageText">${html}</damageText><damageBar><div style="width: ${nowKechaHp}%;"></div></damageBar>`);
							await _.api.sleep(10);
							d.find("damageBar").find("div").css("width", `${_.game.hp.kechappy.now / _.game.hp.kechappy.max * 100}%`);
							if(0 == _.game.hp.kechappy.now){
								_.ui.displayState("winner");
								_.sound.bgm.stop("hope");
								_.sound.bgm.play("win");
							}
							break;
						case "miss":
							d.append("<damageText><dt-body type=\"miss\"></dt-body></damageText>");
							_.game.fightTarget.state(false);
							break;
					}
					resolve();
					await _.api.sleep(1000);
					$("display[type=\"battle\"]").removeClass("bv");
					_.game.battleField.attack.clearDamage();
				});
			},
			clearDamage : () => {
				$("damageText").remove();
				$("damageBar").remove();
			}
		},
		colDtc : {
			getPos : (DOM) => {
				return {
					top : DOM.position().top,
					height : DOM.height(),
					left : DOM.position().left,
					width : DOM.width(),
					bottom : DOM.position().top + DOM.height(),
					right : DOM.position().left + DOM.width()
				};
			},
			isCol : () => {
				return new Promise((resolve) => {
					let r = false;
					let h = _.game.battleField.colDtc.getPos($("heart"));
					let enemies = [];
					$("enemy").each(function(){
						enemies.push(_.game.battleField.colDtc.getPos($(this)));
					});
					for(let i=0; i<enemies.length; i++){
						let e = enemies[i];
						if(
							(Math.abs((e.top + e.height/2) - (h.top + h.height/2)) < e.height/2 + h.height/2)
							&& (Math.abs((e.left + e.width/2) - (h.left + h.width/2)) < e.width/2 + h.width/2)
						){
							r = true;
							break;
						}
					}
					resolve(r);
				});
			},
			clear : () => {
				let d = $("row-inner-textbox[type=\"battle\"]").find("origin");
				let b = {
					right : d.width(),
					bottom : d.height()
				};
				$("enemy").each(function(){
					let p = _.game.battleField.colDtc.getPos($(this));
					if(
						p.right < -100
						|| b.bottom + 100 < p.top
					){
						$(this).remove();
					}
				});
			},
			damaged : false,
			damage : () => {
				if(_.game.battleField.colDtc.damaged) return false;
				_.game.battleField.colDtc.damaged = true;
				_.sound.se.play("hurt");
				$("heart").addClass("damaged");
				_.game.battleField.enemy.damage(2);
				_.api.sleep(1000).then((r) => {
					_.game.battleField.colDtc.damaged = false;
					$("heart").removeClass("damaged");
				});
			},
			interval : async () => {
				if(await _.game.battleField.colDtc.isCol()){
					_.game.battleField.colDtc.damage();
				}
				_.game.battleField.colDtc.clear();
			}
		},
		enemy : {
			damage : async (point) => {
				_.game.hp.me.now -= point;
				if(0 == _.game.hp.me.now){
					_.ui.displayState("gameover");
					_.sound.bgm.stop("hope");
					_.sound.bgm.play("deter");
					_.game.battleField.enemy.clear();
				}else{
					$("display[type=\"battle\"]").addClass("bv");
					await _.api.sleep(500);
					$("display[type=\"battle\"]").removeClass("bv");
				}
			},
			clear : () => {
				clearInterval(_.game.battleField.enemy.appear.interval);
				clearInterval(_.game.battleField.enemy.move.interval);
				$("enemy").remove();
			},
			appear : {
				interval : null,
				start : null,
				/*
				pos = {
					top : 0,
					left : 0
				}
				*/
				/*
				obj = {
					speed : {
						max : 5,
						min : 1
					},
					sec : 1000
				}
				*/
				default : (obj) => {
					let f = async () => {
						let d = $("row-inner-textbox[type=\"battle\"]").find("origin");
						let top = Math.trunc(Math.random() * (d.height() - 32));
						let speed = 250 + obj.speed.max - Math.random() * (obj.speed.max - obj.speed.min) + obj.speed.min;
						let left = Math.trunc(d.width() + 100);
						let id = _.api.identifier();
						d.append(`<enemy id="${id}" type="m" style="transform: translateY(${top}px) translateX(${left}px);"></enemy>`);
						document.getElementById(id).animate([
							{
								transform : `translate(${left}px, ${top}px)`
							},
							{
								transform : `translate(-50px, ${top}px)`
							}
						], {duration : speed, iterations : 1});
					}
					f();
					_.game.battleField.enemy.appear.interval = setInterval(f, obj.sec);
				}
			},
			move : {
				interval : null,
				default : () => {
					let i = 0;
					_.game.battleField.enemy.move.interval = setInterval(() => {
						let d = $("row-inner-textbox[type=\"battle\"]").find("enemy[type=\"m\"]");
						if(i < d.length){
							let dom = d.eq(i);
							let a = {
								top : Number(dom.css("top").replace("px", "")),
								left : Number(dom.css("left").replace("px", "")),
								speed : Number(dom.attr("speed"))
							}
							dom.css({
								top : a.top + "px",
								left : a.left - a.speed + "px"
							});
							i++;
						}else{
							i = 0;
						}
					});
				}
			},
			enemyPart : () => {
				return new Promise(async (resolve) => {
					let types = [
						"default"
					];
					let type = types[Math.floor(Math.random() * types.length)];
					let enemyHp = _.game.hp.kechappy.now / _.game.hp.kechappy.max;
					_.game.battleField.enemy.appear[type]({
						speed : {
							max : 2.5 + ((1 - enemyHp) * 2.5) ** 2,
							min : 250 + 1000 * (1 - enemyHp)
						},
						sec : 100 + 900 * enemyHp
					});
					// _.game.battleField.enemy.move[type]();
					await _.api.sleep(3000 + 7000 * (1 - enemyHp));
					_.game.battleField.enemy.clear();
					resolve();
				});
			}
		}
	};

	_.game.frame = {
		"splash" : {
			call : () => {

			},
			submit : async (btnValue) => {
				switch(btnValue){
					case "start-game":
						break;
				}
			}
		},
		"battle-option" : {
			call : () => {
				_.btn.focus({
					btnType : "battle-option",
					btnValue : "fight",
					row : 1,
					column : 1
				});
			},
			submit : async (btnValue) => {
				_.sound.se.play("select");
				switch(btnValue){
					case "fight":
						await _.game.loadFrame("fight");
						break;
					case "act":
						await _.game.loadFrame("act");
						break;
					case "item":
						await _.game.loadFrame("item");
						break;
					case "mercy":
						await _.game.loadFrame("mercy");
						break;
				}
			}
		},
		"fight" : {
			call : async () => {
				_.ui.branch([
					{
						display : "ケチャッピー",
						value : "kechappy",
						option : "battle"
					}
				], "fight");
				_.btn.focus({
					btnType : "fight",
					btnValue : "kechappy",
					row : 1,
					column : 1
				});
			},
			submit : (btnValue) => {
				_.sound.se.play("select");
				switch(btnValue){
					case "kechappy":
						_.game.loadFrame("fight-target");
						break;
				}
			}
		},
		"act" : {
			call : () => {
				_.ui.branch([
					{
						display : "ケチャッピー",
						value : "kechappy"
					}
				], "act");
				_.btn.focus({
					btnType : "act",
					btnValue : "kechappy",
					row : 1,
					column : 1
				});
			},
			submit : (btnValue) => {
				_.sound.se.play("select");
				switch(btnValue){
					case "kechappy":
						_.game.loadFrame("act_2");
						break;
				}
			}
		},
		"act_2" : {
			call : () => {
				_.ui.branch([
					{
						display : "口臭を指摘する",
						value : "mouthKusai"
					},
					{
						display : "引退する",
						value : "intai"
					},
					{
						display : "なじる",
						value : "najiru"
					}
				], "act_2");
				_.btn.focus({
					btnType : "act_2",
					btnValue : "mouthKusai",
					row : 1,
					column : 1
				});
			},
			submit : (btnValue) => {
				_.sound.se.play("select");
				_.game.loadFrame("act_3", "go", btnValue);
			}
		},
		"item" : {
			call : () => {
				_.ui.branch([
					{
						display : "タコライス",
						value : "tacorice"
					}
				], "item");
				_.btn.focus({
					btnType : "item",
					btnValue : "tacorice",
					row : 1,
					column : 1
				});
			},
			submit : (btnValue) => {
				_.sound.se.play("select");
				switch(btnValue){
					case "tacorice":
						_.game.exitUserSelect();
						if(_.game.hp.me.now == _.game.hp.me.max){
							_.ui.message([
								"しかし　なにもおこらなかった！"
							]);
							_.game.parts.item("nothing");
						}else{
							let kaifuku = Math.floor(Math.random() * 3) + 3;
							_.game.hp.me.now += kaifuku;
							if(_.game.hp.me.now < _.game.hp.me.max){
								_.ui.message([
									"タコライスを　たべた。",
									`HPが　${kaifuku}かいふくした！`
								]);
							}else{
								_.game.hp.me.now = _.game.hp.me.max;
								_.ui.message([
									"タコライスを　たべた。",
									"HPが　まんたんになった！"
								]);
							}
							_.sound.se.play("power");
							_.game.parts.item("tacorice");
						}
						break;
				}
			}
		},
		"mercy" : {
			call : () => {
				_.ui.branch([
					{
						display : "にがす",
						value : "help"
					},
					{
						display : "にげる",
						value : "escape"
					}
				], "mercy");
				_.btn.focus({
					btnType : "mercy",
					btnValue : "help",
					row : 1,
					column : 1
				});
			},
			submit : (btnValue) => {
				switch(btnValue){
					case "help":
						break;
					case "escape":
						break;
				}
			}
		},
		"act_3" : {
			call : (btnValue) => {
				_.game.exitUserSelect();
				switch(btnValue){
					case "mouthKusai":
						_.ui.randomMessage([
							"ケチャッピーに　こうつたえた\n「なんで　歯\n磨かんの？」",
							"ケチャッピーにむかって　おもむろに\nくさそうなかおをしてみた"
						]);
						break;
					case "intai":
						_.ui.message([
							"いつ引退するの？"
						]);
						break;
					case "najiru":
						_.ui.randomMessage([
							"ケチャッピーに　こうつたえた\n「ほんとに　影\n薄いんやな」",
							"ケチャッピーに　こうつたえた\n「いつＹｏｕＴｕｂｅやめるん？」"
						]);
						break;
				}
				_.game.parts.act(btnValue);
			},
			submit : (btnValue) => {
			}
		},
		"fight-target" : {
			call : () => {
				_.game.exitUserSelect();
				_.game.fightTarget.ready();
				_.game.fightTarget.fightTargetInterval(true);
				_.game.fightTarget.listenFightTarget().then(async (fightTarget) => {
					_.game.battleField.attack.damage(fightTarget);
					if(fightTarget.type == "miss"){
						_.game.parts.fight("miss");
					}
				});
				_.btn.focus({
					btnType : "fight-target",
					btnValue : "attack",
					row : 1,
					column : 1
				});
			},
			submit : async (btnValue) => {
				switch(btnValue){
					case "attack":
						_.game.parts.fight("user");
						break;
				}
			}
		},
		"" : {
			call : () => {

			},
			submit : (btnValue) => {
				switch(btnValue){

				}
			}
		}
	};

	$("text.start-game").on("click", async function(){
		let select = sounds.se.select;
		a = await select.arrayBuffer();
		_.sound.load.ctx = new AudioContext();
		$("ui-box[type=\"start\"]").html("<text class=\"load-game\">ゲームを開始しています...</text>");
		await _.sound.load.soundsLoad();
		bf = await (new Promise((res, rej) => {
			_.sound.load.ctx.decodeAudioData(a, res, rej);
		}));
		select.bf = bf;
		select.body = _.sound.load.ctx.createBufferSource();
		select.body.buffer = bf;
		select.gain =  _.sound.load.ctx.createGain();
		select.body.connect(select.gain);
		select.gain.connect(_.sound.load.ctx.destination);
		select.body.start(0);
		_.btn.focus({
			btnType : null,
			btnValue : null,
			row : null,
			column : null
		});
		_.ui.message([
			"ケチャッピーは\nふわふわ　している\nみたいだ"
		]);
		_.game.loadFrame("battle-option");
		_.ui.displayState("battle");
		_.sound.bgm.play("hope", true);
	})
});