chrome.storage.local.get(null, function(options) {
	if (!options.separate_categories) {
		if (options.categories_toolbar) {
			browser.bookmarks.getChildren('toolbar_____').then(function(bms) {
				let l = bms.length;
				for (let i = 0; i < l; ++i) {
					fetchFolder(bms[i]);
				}
			});
		}
		if (options.categories_menu) {
			browser.bookmarks.getChildren('menu________').then(function(bms) {
				let l = bms.length;
				for (let i = 0; i < l; ++i) {
					fetchFolder(bms[i]);
				}
			});
		}
		if (options.categories_mobile) {
			browser.bookmarks.getChildren('mobile______').then(function(bms) {
				let l = bms.length;
				for (let i = 0; i < l; ++i) {
					fetchFolder(bms[i]);
				}
			});
		}
		if (options.categories_other) {
			browser.bookmarks.getChildren('unfiled_____').then(function(bms) {
				let l = bms.length;
				for (let i = 0; i < l; ++i) {
					fetchFolder(bms[i]);
				}
			});
		}
	} else {
		if (options.categories_toolbar) {
			browser.bookmarks.get('toolbar_____').then(function(sub) {
				fetchFolder(sub[0]);
			});
		}
		if (options.categories_menu) {
			browser.bookmarks.get('menu________').then(function(sub) {
				fetchFolder(sub[0]);
			});
		}
		if (options.categories_mobile) {
			browser.bookmarks.get('mobile______').then(function(sub) {
				fetchFolder(sub[0]);
			});
		}
		if (options.categories_other) {
			browser.bookmarks.get('unfiled_____').then(function(sub) {
				fetchFolder(sub[0]);
			});
		}
	}
	if (options.windows) { // restore windows
		let keys = Object.keys(options.windows);
		let i = 1;
		for (let key of keys) {
			let w = options.windows[key];
			drawWindow(w.id, w.title, w.x, w.y, w.w, w.h, w.z);
			registerWindow('win_' + w.id);
			populateWindow(w.id);
		}
	}
	if (options.show_search_tips) {
		document.getElementById('tip_container').style.display = 'block';
	}
	if (Object.entries(options).length === 0) { // if no options yet
		chrome.runtime.setUninstallURL('http://zarch.info/UMiBO/uninstalled.html');
		chrome.storage.local.set({
			'bg': "follow_theme",
			'categories_toolbar': true,
			'show_search_tips': true
		});
		location.reload();
	}
});
let move_target, resize_target, drop_target;
let closing = false;

function registerFolder(folder) {
	document.getElementById(folder).addEventListener('click', function(folder) {
		folderId = folder.target.id;
		if (document.getElementById('win_' + folderId) == null) {
			folderTitle = folder.target.innerHTML;
			len = document.getElementsByClassName('window').length;
			drawWindow(folderId, folderTitle, folder.clientX - 200, folder.clientY + 50, 400, 300, len);
			registerWindow('win_' + folderId);
			populateWindow(folderId);
			// save in local storage
			chrome.storage.local.get(null, function(o) {
				o.windows ? arr_windows = o.windows : arr_windows = {};
				arr_windows[folderId] = {
					'id': folderId,
					'title': folderTitle,
					'y': folder.clientY + 50,
					'x': folder.clientX - 200,
					'h': 300,
					'w': 400,
					'z': len,
				};
				chrome.storage.local.set({
					'windows': arr_windows
				});
			});
		}
	});
}

function registerWindow(id) {
	let window = document.getElementById(id);
// move
	window.childNodes[0].addEventListener('mousedown', function(e) {
		offsetX = e.pageX - e.currentTarget.parentNode.offsetLeft;
		offsetY = e.pageY - e.currentTarget.parentNode.offsetTop;
		move_target = e.currentTarget.parentNode;
		document.body.insertAdjacentHTML('beforeend', '<div id="secureDrag"></div>');
	});
// raise
	window.addEventListener('mousedown', function(e) {
		let allWindows = document.getElementsByClassName('window');
		for (let i = 0; i < allWindows.length; i++) {
			if (allWindows[i].style.zIndex > 0 && e.currentTarget.style.zIndex !== allWindows.length) {
				allWindows[i].style.zIndex--;
			}
		}
		e.currentTarget.style.zIndex = allWindows.length;
	});
// close
	window.childNodes[0].childNodes[1].addEventListener('mousedown', function(e) {
		e.target.parentNode.parentNode.remove();
		id = e.target.parentNode.parentNode.getAttribute('index');
		chrome.storage.local.get(null, function(o) {
			let arr_windows = o.windows;
			delete arr_windows[id]; // si tout explose c'est de sa faute
			chrome.storage.local.set({
				'windows': arr_windows
			});
		});
		closing = true;
	});
// resize
	window.childNodes[2].addEventListener('mousedown', function(e) {
		pX = e.pageX;
		pY = e.pageY;
		wH = e.currentTarget.parentNode.childNodes[1].offsetHeight; //current height
		wW = e.currentTarget.parentNode.childNodes[1].offsetWidth; //current width
		resize_target = e.currentTarget.parentNode;
		document.body.insertAdjacentHTML('beforeend', '<div id="secureDrag"></div>');
	});
}

function populateWindow(id) {
	chrome.bookmarks.getChildren(id, function(e) {
		let WindowMain = document.getElementById('win_' + id).childNodes[1];
		let BookmarksLength = e.length;
		for (let i = 0; i < BookmarksLength; ++i) {
			let el = e[i];
			if (el.url) {
				if (el.title === '') {
					el.title = el.url.substring(0, 50);
				}
				// OPTIMISER FETCH ICONS, TROP LENT QUAND OUVERTURE DE FENETRE
				WindowMain.insertAdjacentHTML('beforeend', '<a tabindex="0" id="' + el.id + '" title="' + el.title + '" href="' + el.url + '"><img loading="lazy" width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url=' + el.url + '"/>' + el.title + '</a>');
				dragonPrepare(el.id);
			} else {
				WindowMain.insertAdjacentHTML('beforeend', '<article id="' + el.id + '" title="' + el.title + '" href="' + el.id + '" draggable="true">' + el.title + '</article>');
				registerFolder(el.id);
				dragonPrepare(el.id);
			}
		}
	});
}

function fetchFolder(sub) { // desktop icons
	if (sub.url) {
		document.body.insertAdjacentHTML('beforeend', '<a id="' + sub.id + '" title="' + sub.title + '" class="desktopFolder" href="' + sub.url + '"><img width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url=' + sub.url + '"/>' + sub.title + '</a>');
		dragonPrepare(sub.id);
	} else {
		document.body.insertAdjacentHTML('beforeend', '<div class="desktopFolder" id="' + sub.id + '" title="' + sub.title + '" href="' + sub.id + '" draggable="true">' + sub.title + '</div>');
		registerFolder(sub.id);
		dragonPrepare(sub.id);
	}
}

function dragonPrepare(id) {
	document.getElementById(id).addEventListener('dragstart', function(e) {
		dragon_target = e.currentTarget.id;

		// move
		Dropzones = document.getElementsByClassName('dropzone');
		for (let i = 0; i < Dropzones.length; ++i) {
			Dropzones[i].style.display = 'block';

			Dropzones[i].addEventListener('dragover', function(e) {
				e.preventDefault();
			});
			Dropzones[i].addEventListener('drop', function(e) {
				e.preventDefault();

				drop_target = e.target.getAttribute('id').replace('drop_', '');

				chrome.bookmarks.move(dragon_target, {
					parentId: drop_target
				}); // TODO catch errors

				let lien = document.getElementById(dragon_target);
				document.getElementById('win_' + drop_target).childNodes[1].insertAdjacentHTML('beforeend', lien.outerHTML);
				lien.remove();
				dragonPrepare(dragon_target);
				if (lien.tagName === "ARTICLE") {
					registerFolder(dragon_target);
				}
			});
		}

		// delete zone
		document.getElementById('delete_vortex').style.display = 'block';
		document.getElementById('delete_vortex').addEventListener('dragover', function(e) { // TODO target all dropzones
			e.preventDefault();
		});
		document.getElementById('delete_vortex').addEventListener('drop', function(e) {
			e.preventDefault();
			chrome.bookmarks.remove(dragon_target, function () {
				let lien = document.getElementById(dragon_target);
				lien.remove();
			});
		});
	});

	document.getElementById(id).addEventListener('dragend', function() {
		for (let i = 0; i < Dropzones.length; ++i) {
			Dropzones[i].style.display = 'none';
		}
		drop_target = null;
		document.getElementById('delete_vortex').style.display = 'none';
	});
}

document.body.addEventListener('mousemove', function(e) {
	if (move_target) {
		move_target.style.left = e.pageX - offsetX + 'px';
		move_target.style.top = e.pageY - offsetY + 'px';
	} else if (resize_target) {
		resize_target.childNodes[1].style.height = wH + e.pageY - pY + 'px';
		resize_target.childNodes[1].style.width = wW + e.pageX - pX + 'px';
	}
});

document.body.addEventListener('mouseup', function() {
	if (move_target || resize_target) {
		let win = resize_target ? resize_target : move_target;
		if (closing === false) {
			chrome.storage.local.get(null, function(o) {
				o.windows ? arr_windows = o.windows : arr_windows = {};

				arr_windows[win.getAttribute('index')] = {
					'id': win.getAttribute('index'),
					'title': win.childNodes[0].title,
					'x': win.offsetLeft,
					'y': win.offsetTop,
					'w': win.childNodes[1].offsetWidth, // 0 is <border>, 1 is <main>, 2 is <resize>
					'h': win.childNodes[1].offsetHeight,
					'z': win.style.zIndex
				};
				chrome.storage.local.set({
					'windows': arr_windows
				});
			});
		}
		move_target = null;
		resize_target = null;
	}
	closing = false;
	if (document.getElementById('secureDrag') !== null) {
		document.getElementById('secureDrag').outerHTML = '';
	}
});

function drawWindow(id, title, x, y, w, h, z) {
	// check if window stuck
	if (y < 0) {
		y = 0;
	}
	if (y + h / 2 > window.innerHeight) {
		y = window.innerHeight - h;
	}
	if (x < 0) {
		x = 0;
	}
	if (x + w / 2 > window.innerWidth) {
		x = window.innerWidth - w;
	}
	document.body.insertAdjacentHTML('beforeend', '<div id="win_' + id + '" index="' + id + '" style="top:' + y + 'px; left:' + x + 'px;z-index:' + z + '" class="window"><div class="border" title="' + title + '">' + title + '<span id="close_button" title="Close"></span></div><main style="height:' + h + 'px;width:' + w + 'px"></main><div class="resize"></div><div class="dropzone" id="drop_' + id + '"></div></div>');
}