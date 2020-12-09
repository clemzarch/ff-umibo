console.log('------start------');
browser.storage.local.get().then(function(options) {
	console.log('settings loaded');

	if (options.windows) { // restore windows
		let keys = Object.keys(options.windows);
		let i = 1;
		for (const key of keys) {
			let w = options.windows[key];

			drawWindow(w.id, w.title, w.x, w.y, w.w, w.h, i++);
		}
	}

	console.log('background?');
	if (options.background === 'image') {
		document.body.style.background = 'url('+options.bg_url+') repeat fixed center center / cover';
	} else if (options.background === 'color') {
		document.body.style.background = options.bg_color;
	}

	console.log('custom css?');
	if (options.custom_css) {
		document.head.insertAdjacentHTML('beforeend', '<style>'+options.custom_css+'</style>')
	}

	console.log('toolbar?');
	if (options.toolbar_as_folder) {
		let title = browser.i18n.getMessage("BookmarksToolbar");
		document.body.insertAdjacentHTML('beforeend', '<div class="desktopFolder" id="toolbar_____">' + title + '</div>');
		registerFolder('toolbar_____');
	} else {
		browser.bookmarks.getChildren('toolbar_____').then(function (bms) {
			for (let i = 0; i < bms.length; ++i) {
				if (bms[i].type === 'bookmark') {
					document.body.insertAdjacentHTML('beforeend', '<a class="desktopLink" id="' + bms[i].id + '" title="' + bms[i].title + '" href="' + bms[i].url + '"><img width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url=' + bms[i].url + '"/>' + bms[i].title + '</a>');
					dragonPrepare(bms[i].id);
				}
				if (bms[i].type === 'folder') {
					document.body.insertAdjacentHTML('beforeend', '<div class="desktopFolder" id="' + bms[i].id + '" draggable="true">' + bms[i].title + '</div>');
					registerFolder(bms[i].id);
					dragonPrepare(bms[i].id);
				}
			}
		});
	}

	console.log('search tip?');
	if (options.show_search_tips) {
		document.getElementById('tip_container').style.visibility = 'visible';
	}

	console.log('------all settings applied------');

	if (Object.entries(options).length === 0) { // if no options yet
		browser.runtime.setUninstallURL('http://zarch.info/UMiBO/uninstalled.html');
		browser.storage.local.set({
			toolbar_as_folder: true,
			show_search_tips: true,
			background: 'default',
			bg_url: 'https://images.unsplash.com/photo-1518627845667-0362e869f233?auto=format&fit=crop&w=3578&q=80',
			bg_color: '#ffffff',
			custom_css: null
		});
		location.reload();
	}
});

function registerFolder(folder) {
	document.getElementById(folder).addEventListener('click', function(folder) {
		let folderId = folder.target.id;
		let existingWindow = document.getElementById('win_'+folderId);

		if (existingWindow === null) {
			let folderTitle = folder.target.innerHTML;
			let len = document.getElementsByClassName('window').length;

			drawWindow(folderId, folderTitle, folder.clientX-200, folder.clientY+50, 400, 300, len);
			document.getElementById('win_'+folderId).animate(
				[{ transform: 'scale(0.2)' }, { transform: 'scale(1)' }],
				{ duration: 150 }
			);

			// save in local storage
			browser.storage.local.get().then(function(o) {
				let arr_windows = o.windows ?? [];

				arr_windows[folderId] = {
					id: folderId,
					title: folderTitle,
					y: folder.clientY+50,
					x: folder.clientX-200,
					h: 300,
					w: 400
				};
				browser.storage.local.set({'windows': arr_windows});
			});
		} else {
			existingWindow.animate(
				[{ boxShadow: '0 0 0 5px var(--tab-line)' }, { boxShadow: 'none' }],
				{ duration: 500 }
			);
		}
	});
}

let move_target, drop_target, resize_target, raise_target, delete_drop_target, offsetX, offsetY;
let closing = false;

function drawWindow(id, title, x, y, w, h, z) {
// check if window stuck
	if (y < 0) {
		y = 0;
	}

	if (x < 0) {
		x = 0;
	}

// draw
	let data = '<div id="win_'+id+'" index="'+id+'" style="top:'+y+'px; left:'+x+'px;z-index:'+z+'" class="window">'
	+'<div class="border" title="'+title+'">'
	+'<span class="create_button" title="Create"></span>'+title+'<span class="close_button" title="Close"></span></div>'
	+'<main style="height:'+h+'px;width:'+w+'px"></main><div class="resize"></div>'
	+'<div class="dropzone" id="drop_'+id+'"></div></div>';
	document.body.insertAdjacentHTML('beforeend', data);

	console.log('drawing finished');

	let window = document.getElementById('win_'+id);

// populate
	browser.bookmarks.getChildren(id).then(function(e) {
		let BookmarksLength = e.length;

		for (let i = 0; i < BookmarksLength; ++i) {
			let el = e[i];
			if (el.type === 'bookmark') {
				if (el.title === '') {
					el.title = el.url;
				}
				// OPTIMISER FETCH ICONS, TROP LENT QUAND OUVERTURE DE FENETRE
				window.childNodes[1].insertAdjacentHTML('beforeend', '<a class="desktopLink" id="'+el.id+'" title="'+el.title+'" href="'+el.url+'"><img loading="lazy" width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url='+el.url+'"/>'+el.title+'</a>');
				dragonPrepare(el.id);
			} else if (el.type === 'folder') {
				window.childNodes[1].insertAdjacentHTML('beforeend', '<div class="desktopFolder" id="'+el.id+'" title="'+el.title+'" draggable="true">'+el.title+'</div>');
				registerFolder(el.id);
				dragonPrepare(el.id);
			}
		}
	});
	console.log('------Populating finished------');

// move
	window.childNodes[0].addEventListener('mousedown', function(e) {
		if (!e.target.classList.contains('border')) {
			return;
		}

		offsetX = e.pageX - window.offsetLeft;
		offsetY = e.pageY - window.offsetTop;
		move_target = window;
		document.body.insertAdjacentHTML('beforeend','<div id="secureDrag"></div>');
	});

// raise
	window.addEventListener('mousedown', function() {
		if (closing) {
			return;
		}

		let allWindows = document.getElementsByClassName('window');
		for (let i = 0; i < allWindows.length; i++) {
			if (allWindows[i].style.zIndex > 0 && window.style.zIndex !== allWindows.length) {
				allWindows[i].style.zIndex--;
			}
		}
		window.style.zIndex = allWindows.length.toString();
		raise_target = window;
	});

// close
	window.childNodes[0].childNodes[2].addEventListener('mousedown', function() {
		closing = true;
		window.remove();

		browser.storage.local.get().then(function(o) {
			let arr_windows = o.windows;
			delete arr_windows[id]; // si tout explose c'est de sa faute
			browser.storage.local.set({'windows': arr_windows });
			closing = false;
		});
	});

// resize
	window.childNodes[2].addEventListener('mousedown', function(e) {
		pX = e.pageX;
		pY = e.pageY;
		wH = window.childNodes[1].offsetHeight; //current height
		wW = window.childNodes[1].offsetWidth; //current width
		resize_target = window;
		document.body.insertAdjacentHTML('beforeend','<div id="secureDrag"></div>');
	});

// create folder
	window.childNodes[0].childNodes[0].addEventListener('mousedown', function() {
		if (document.getElementById('createFolderForm')) {
			document.getElementById('createFolderForm').remove();
			return;
		}

		let label = browser.i18n.getMessage("newFolderLabel");
		let submit = browser.i18n.getMessage("newFolderSubmit");
		let placeholder = browser.i18n.getMessage("newFolderPlaceholder");

		let content = '<form id="createFolderForm">'
			+ '<label>'+label+'<input name="folderName" placeholder="'+placeholder+'" type="text" required></label>'
			+ '<input name="origin" type="hidden" value="'+id+'">'
			+ '<input type="submit" value="'+submit+'"></form>';
		window.insertAdjacentHTML('beforeend', content);

		document.getElementById('createFolderForm').addEventListener('submit', function(e) {
			e.preventDefault();
			let formData = new FormData(e.target);

			browser.bookmarks.create({
				parentId: formData.get('origin'),
				title: formData.get('folderName')
			}).then(function() {
				location.reload();
			});
		});
	});
}

// translations
ToTranslate = document.getElementsByTagName('data');
for (let i of ToTranslate) {
	i.innerHTML = browser.i18n.getMessage(i.value);
}

document.body.addEventListener('mousemove',function(e) {
	if (move_target) {
		move_target.style.left = e.pageX - offsetX+'px';
		move_target.style.top = e.pageY - offsetY+'px';
	} else if (resize_target) {
		resize_target.childNodes[1].style.height = wH + e.pageY - pY+'px';
		resize_target.childNodes[1].style.width = wW + e.pageX - pX+'px';
	}
});

document.body.addEventListener('mouseup', function() {
	let win = move_target ?? resize_target ?? raise_target ?? null;
	if (win) {
		browser.storage.local.get().then(function(o) {
			let arr_windows = o.windows ?? [];

			delete arr_windows[win.getAttribute('index')];
			arr_windows[win.getAttribute('index')] = {
				id:		win.getAttribute('index'),
				title:	win.childNodes[0].title,
				x:		win.offsetLeft,
				y:		win.offsetTop,
				w:		win.childNodes[1].offsetWidth, // 0 is <border>, 1 is <main>, 2 is <resize>
				h:		win.childNodes[1].offsetHeight,
			};
			browser.storage.local.set({'windows': arr_windows });
		});
		move_target = null;
		resize_target = null;
		raise_target = null;

		if (document.getElementById('secureDrag')) {
			document.getElementById('secureDrag').outerHTML = '';
		}
	}
});

function dragonPrepare(id) {
	document.getElementById(id).addEventListener('dragstart',function(e) {
		dragon_target = e.currentTarget.id;

		// place dropzones
		let Dropzones = document.getElementsByClassName('dropzone');
		for (let i = 0; i < Dropzones.length; ++i) {
			Dropzones[i].style.display = 'block';
			Dropzones[i].style.background = 'var(--faded-line)';
			Dropzones[i].style.outline = '1px solid var(--tab-line)';

			Dropzones[i].addEventListener('dragenter', function(e) {
				if (
					e.target.id &&
					(e.target.classList.contains('dropzone') || e.target.classList.contains('desktopFolder'))
				) {
					drop_target = e.target.id.replace('drop_','');
				}
			});
		}

		// place delete zone
		document.getElementById('delete_vortex').style.visibility = 'visible';
	});
}
// drop
document.addEventListener('dragend', function() {
	if (
		(dragon_target && drop_target) &&
		(dragon_target !== drop_target) //had to check that
	) {
		browser.bookmarks.move(dragon_target, {parentId: drop_target}).then(function() {
			location.reload();
		}); // moving between zones
	} else if (dragon_target && delete_drop_target) { // dropping in vortex
		browser.bookmarks.remove(dragon_target).then(function() {
			location.reload();
		});
	} else {
		location.reload();
	}
});

registerFolder('menu________');
registerFolder('mobile______');
registerFolder('unfiled_____');

document.getElementById('options').addEventListener("click", function() {
	browser.runtime.openOptionsPage();
});

// watching for delete vortex
document.getElementById('delete_vortex').addEventListener('dragenter', function() {
	if (dragon_target != null) {
		delete_drop_target = true;
		drop_target = null;
	}
});
