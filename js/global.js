$(function(){
	_ = {
		api : {
			sleep : (sec) => {
				return new Promise((resolve) => {
					setTimeout(resolve, sec);
				});
			},
			get : (url) => {
				return new Promise(async (resolve) => {
					resolve(await fetch(url));
				})
			},
			identifier : () => {
				let S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
				let N = 16;
				return Array.from(crypto.getRandomValues(new Uint8Array(N))).map((n)=>S[n%S.length]).join("");
			},
		},
		responsive : {
			getRotation: () => {
				return $(window).height() > $(window).width() ? "x" : "y";
			},
			root : () => {
				$("html").attr("rotationType", _.responsive.getRotation());
			}
		}
	};

	_.splash = {
		enableTab : (tabName) => {
			$("ui-box").removeClass("active");
			$(`ui-box[type="${tabName}"]`).addClass("active");
		}
	}

	_.asset = {
		cssDatas : {},
		assetsSize : 0,
		load : {
			loaded : 0,
			ready : () => {
				$("ui-box[type=\"loading\"]").find("text.loading-bar-label").html(`アセットをロードしています... <span class="load-now">${_.asset.load.loaded}</span>/<span class="load-max">${_.asset.assetsSize}</span>`);
			},
			load : () => {
				_.asset.load.loaded += 1;
				if(_.asset.assetsSize < _.asset.load.loaded) return false;
				$("span.load-now").text(_.asset.load.loaded);
				$("loading-bar").find("div").css("width", `${_.asset.load.loaded / _.asset.assetsSize * 100}%`);
			}
		},
		getAllAssetsSize : () => {
			return new Promise(async (resolve) => {
				for(let key in assets){
					switch(key){
						case "js":
							_.asset.assetsSize += assets[key].length;
							break;
						case "css":
								for(let i=0; i<assets[key].length; i++){
									let cssPath = assets[key][i];
									let cssData = await (await _.api.get(`/css/${cssPath}`)).text();
									let urls = cssData.match(/(url\(\/[0-9A-Za-z|/|.|_|-]+\))/g);
									_.asset.cssDatas[cssPath] = {
										text : cssData,
										urls : urls
									};
									_.asset.assetsSize += urls.length;
								}
							break;
						default:
							for(let a in assets[key]){
								_.asset.assetsSize += 1;
							}
							break;
					}
				}
				resolve();
			});
		},
		loadAsset : (path, type, filename = null) => {
			return new Promise(async (resolve) => {
				let blob;
				switch(type){
					case "js":
						blob = await (await _.api.get(path)).blob();
						_.asset.load.load();
						$("body").append(`<script src="${URL.createObjectURL(blob)}"></script>`);
						break;
					case "css":
						for(let i=0; i<_.asset.cssDatas[path].urls.length; i++){
							let url = _.asset.cssDatas[path].urls[i];
							let dataPath = url.replace(/url|\(|\)| /g, "");
							let blob = await(await _.api.get(dataPath)).blob();
							_.asset.load.load();
							_.asset.cssDatas[path].text = _.asset.cssDatas[path].text.replace(url, `url(${URL.createObjectURL(blob)})`);
						}
						let cssBlob = new Blob([_.asset.cssDatas[path].text], {type : "text/css"});
						$("body").append(`<link rel="stylesheet" href="${URL.createObjectURL(cssBlob)}"></link>`);
						break;
					default:
						blob = await (await _.api.get(path)).blob();
						_.asset.load.load();
						sounds[type][filename] = blob;
						break;
				}
				resolve();
			});
		},
		waitLoad : () => {
			return new Promise(async (resolve) => {
				let i = setInterval(() => {
					if(_.asset.assetsSize == _.asset.load.loaded){
						clearInterval(i);
						resolve();
					}
				});
			});
		},
		loadAllAssets : () => {
			for(let key in assets){
				switch(key){
					case "js":
						for(let i=0; i<assets[key].length; i++){
							_.asset.loadAsset(`/js/${assets[key][i]}`, "js");
						}
						break;
					case "css":
						for(let cssPath in _.asset.cssDatas){
							_.asset.loadAsset(cssPath, "css");
						}
						break;
					default:
						sounds[key] = {};
						for(let key2 in assets[key]){
							_.asset.loadAsset(`/${key}/${assets[key][key2]}`, key, assets[key][key2].split(".")[0]);
						}
						break;
				}
			}
		}
	};

	_.responsive.root();
	$(window).resize(_.responsive.root);

	(async() => {
		_.splash.enableTab("loading");
		await _.asset.getAllAssetsSize();
		_.asset.load.ready();
		_.asset.loadAllAssets();
		await _.asset.waitLoad();
		await new Promise((resolve) => {
			let i = setInterval(() => {
				if(
					_.btn
					&& _.game
				){
					clearInterval(i);
					resolve();
				}
			});
		});
		_.game.hpRender();
		_.splash.enableTab("start");
		$(window).resize(_.game.battleField.heartMove.resetHeart);
		setInterval(_.game.battleField.colDtc.interval, 100);
		_.btn.focus({
			btnType : "splash",
			btnValue : "start-game",
			row : 1,
			column : 1
		});
	})();
});