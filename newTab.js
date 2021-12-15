chrome.storage.local.get(null, function(options) {
	for (let key in options.w) {
		let w = options.w[key];

		drawWindow(key, w.title, w.x, w.y, w.w, w.h, 1);
	}

	let moreCSS = options.custom_css ?? '';

	if (options.toolbar_as_folder) {
		registerFolder('toolbar_____');
	} else {
		moreCSS += 'body {max-width: 1280px}';
		document.getElementById('toolbar_____').outerHTML = null;
		chrome.bookmarks.getChildren('toolbar_____', function (bms) {
			for (let i = 0; i < bms.length; ++i) {
				if (bms[i].type === 'bookmark') {
					document.body.insertAdjacentHTML('beforeend', '<a class="desktopLink" id="' + bms[i].id + '" title="' + bms[i].title + '" href="' + bms[i].url + '"><img width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url=' + bms[i].url + '"/>' + bms[i].title + '</a>');
					dragonPrepare(bms[i].id);
				} else if (bms[i].type === 'folder') {
					document.body.insertAdjacentHTML('beforeend', '<div class="desktopFolder" id="' + bms[i].id + '" title="' + bms[i].title + '" draggable="true">' + bms[i].title + '</div>');
					registerFolder(bms[i].id);
					dragonPrepare(bms[i].id);
				}
			}
		});
	}

	if (options.background === 'image') {
		moreCSS += 'body {background: url(' + options.bg_url + ') repeat fixed center center / cover} body > .desktopLink, #tip_container data {color:#fff;text-shadow:0 0 3px #000}';
	} else if (options.background === 'color') {
		moreCSS += 'body {background: ' + options.bg_color + '}';
	}

	if (options.show_search_tips) {
		moreCSS += '#tip_container{visibility:visible}';
	}

	if (options.font && options.font !== "0.5") {
		moreCSS += '* {font-size-adjust:' + options.font + '}';
	}

	if (options.icon && options.icon !== "16") {
		moreCSS += 'img {height:' + options.icon + 'px; width: ' + options.icon + 'px} .window main .desktopLink {height: '+ (41 + parseInt(options.icon)) +'px}';
	}

	document.head.insertAdjacentHTML('beforeend', '<style>'+ moreCSS + '</style>');

	if (navigator.userAgent.indexOf('Mac OS X') !== -1) {
		document.body.classList.add("macOS");
	}

	if (Object.entries(options).length === 0) { // if no options yet
		chrome.runtime.setUninstallURL('http://zarch.info/UMiBO/uninstalled.html');
		chrome.storage.local.set({
			toolbar_as_folder: true,
			show_search_tips: true,
			background: "image",
			bg_url: "https://images.unsplash.com/photo-1600627225432-82de96999068?auto=format&fit=crop&w=2550&q=80",
			bg_color: "#ffffff",
			custom_css: null
		});
		location.reload();
	}
});

applyTheme();
browser.theme.onUpdated.addListener(applyTheme);

function applyTheme () {
	browser.theme.getCurrent().then(function (theme) {
		if (existingTheme = document.getElementById('theme')) {
			existingTheme.outerHTML = '';
		}

		if (
			theme.colors === null ||
			theme.colors.frame === undefined ||
			theme.colors.toolbar === undefined ||
			theme.colors.toolbar_text === undefined ||
			theme.colors.icons_attention === undefined
		) {
			return;
		}

		document.head.insertAdjacentHTML(
			'beforeend',
			'<style id="theme">:root{'
			+'--bg: '+theme.colors.frame+';'
			+'--field: '+theme.colors.toolbar+';'
			+'--color: '+theme.colors.toolbar_text+';'
			+'--faded-color: '+theme.colors.icons_attention+';'
			+'--hi: #0002;'
			+'--hi-click: #0003;'
			+'}'
			+'</style>'
		);
	});
}

function registerFolder(folder) {
	document.getElementById(folder).addEventListener('click', function(folder) {
		let folderId = folder.target.id;
		let existingWindow = document.getElementById('win_'+folderId);

		if (existingWindow === null) {
			let folderTitle = folder.target.innerHTML;
			let len = document.getElementsByClassName('window').length;

			let computedLeft = ((folder.clientX-200) * 100) / window.innerWidth;
			let computedTop = ((folder.clientY+50) * 100) / window.innerHeight;
			let computedWidth = 40000 / window.innerWidth;
			let computedHeight = 30000 / window.innerHeight;

			drawWindow(folderId, folderTitle, computedLeft, computedTop, computedWidth, computedHeight, len);
			if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
				document.getElementById('win_'+folderId).animate(
					[{ transform: 'scale(0.2)' }, { transform: 'scale(1.1)' }, {}],
					{ duration: 256 }
				);
			}

			// save in local storage
			chrome.storage.local.get('w', function(o) {
				let arr_windows = o.w ?? [];

				arr_windows[folderId] = {
					title: folderTitle,
					y: computedTop,
					x: computedLeft,
					h: computedHeight,
					w: computedWidth
				};
				chrome.storage.local.set({'w': arr_windows});
			});
		} else {
			existingWindow.dispatchEvent(new Event('mousedown'));
			existingWindow.animate(
				[{}, { transformOrigin: 'center', transform: 'scale(0.95)' }, { transform: 'scale(1.1)' }, {}],
				{ duration: 256 }
			);
		}
	});
}

let move_target, mouse_over, drop_target, resize_target, raise_target, delete_drop_target, offsetX, offsetY;
let closing = false;

function drawWindow(id, title, x, y, w, h, z) {
// check if window stuck
	if (y < 0) {
		y = 0;
	}

	if (x < -5) {
		x = 0;
	}

	//check if size/location are probably in pixels and we need to convert them to percentages.
	if (x > 100 || y > 100 || h > 100 || w > 100) {
		x = (x * 100) / window.innerWidth;
		y = (y * 100) / window.innerHeight;
		w = (w * 100) / window.innerWidth;
		h = (h * 100) / window.innerHeight;
	}

	// second pass to catch windows still stuck outside the frame
	if (x > 97) {
		x = 90;
	}
	if (y > 97) {
		y = 90;
	}

// draw
	document.body.insertAdjacentHTML(
		'beforeend',
		'<div id="win_'+id+'" index="'+id+'" style="top:'+y+'%; left:'+x+'%;z-index:'+z+'" class="window">'
		+'<div class="border" title="'+title+'">'
		+'<span class="create_button" title="Create">'
		+'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 2 16 16" width="12" height="12"><path d="M3 7H1.5l-.5.5V9l.5.5H3l.5-.5V7.5zM8.8 7H7.2l-.5.5V9l.5.5h1.5l.6-.5V7.5zM14.5 7H13l-.5.5V9l.5.5h1.5L15 9V7.5z"/></svg>'
		+'</span>'
		+title+'<span class="close_button" title="Close">'
		+'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 2 16 16" width="12" height="12"><path d="M9.1 7.78l4.72-4.71a.63.63 0 00-.89-.89l-4.69 4.7h-.48l-4.7-4.7a.63.63 0 10-.88.89l4.69 4.68v.5l-4.69 4.68a.63.63 0 00.89.89l4.68-4.69h.5l4.68 4.69a.63.63 0 00.89 0 .63.63 0 000-.89L9.1 8.23v-.45z"/></svg>'
		+'</span></div>'
		+'<main style="height:'+h+'vh;width:'+w+'vw"></main><div class="resize"></div>'
		+'<div class="dropzone" id="drop_'+id+'"></div></div>'
	);

	let win = document.getElementById('win_'+id);

// populate
	chrome.bookmarks.getChildren(id, function(e) {
		let elements = '';
		let foldersIds = [];
		let linksIds = [];

		for (let i = 0; i < e.length; ++i) {
			let el = e[i];
			if (el.type === 'bookmark') {
				if (el.title === '') {
					el.title = el.url;
				}

				elements += '<a class="desktopLink" id="'+el.id+'" title="'+el.title+'" href="'+el.url+'"><img loading="lazy" width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url='+el.url+'"/>'+el.title+'</a>';
				linksIds.push(el.id);
			} else if (el.type === 'folder') {
				elements += '<div class="desktopFolder" id="'+el.id+'" title="'+el.title+'" draggable="true">'+el.title+'</div>';
				foldersIds.push(el.id);
			}
		}

		win.childNodes[1].innerHTML = elements; // may be faster, or may not

		for (let i = 0; i < foldersIds.length; i++) {
			registerFolder(foldersIds[i]);
			dragonPrepare(foldersIds[i]);
		}

		for (let i = 0; i < linksIds.length; i++) {
			dragonPrepare(linksIds[i]);
		}
	});

// move
	win.childNodes[0].addEventListener('mousedown', function(e) {
		if (!e.target.classList.contains('border')) {
			return;
		}

		offsetX = e.pageX - win.offsetLeft;
		offsetY = e.pageY - win.offsetTop;
		move_target = win;
		document.body.insertAdjacentHTML('beforeend', '<div id="secureDrag" style="cursor: grabbing"></div>');
	});

// raise
	win.addEventListener('mousedown', function() {
		if (closing) {
			return;
		}

		let allWindows = document.getElementsByClassName('window');

		for (let i = 0; i < allWindows.length; ++i) { // cycle through windows, lower the ones higher than our target
			if (allWindows[i].style.zIndex > win.style.zIndex) {
				allWindows[i].style.zIndex--;
			}
		}
		win.style.zIndex = allWindows.length;
		raise_target = win;
	});

// close
	win.childNodes[0].childNodes[2].addEventListener('mousedown', function() {
		closing = true;
		win.remove();

		chrome.storage.local.get('w', function(o) {
			delete o.w[id]; // fingers crossed
			chrome.storage.local.set({'w': o.w }, function() {
				closing = false;
			});
		});
	});

// resize
	win.childNodes[2].addEventListener('mousedown', function(e) {
		pX = e.pageX;
		pY = e.pageY;
		wH = win.childNodes[1].offsetHeight; //current height
		wW = win.childNodes[1].offsetWidth; //current width
		resize_target = win;
		document.body.insertAdjacentHTML('beforeend', '<div id="secureDrag" style="cursor: nwse-resize"></div>');
	});

// create folder
	win.childNodes[0].childNodes[0].addEventListener('mousedown', function(e) {
		e.preventDefault();

		let existingPanel = win.querySelector('#createFolderForm');

		if (existingPanel) {
			existingPanel.remove();
			return;
		}

		existingPanel = document.getElementById('createFolderForm');

		if (existingPanel) {
			existingPanel.remove();
		}

		let label = browser.i18n.getMessage("newFolderLabel");
		let submit = browser.i18n.getMessage("newFolderSubmit");
		let placeholder = browser.i18n.getMessage("newFolderPlaceholder");

		let content = '<form id="createFolderForm">'
			+ '<label>'+label+'<input name="folderName" placeholder="'+placeholder+'" type="text" required></label>'
			+ '<input name="origin" type="hidden" value="'+id+'">'
			+ '<input type="submit" value="'+submit+'"></form>';
		win.insertAdjacentHTML('beforeend', content);

		document.getElementById('createFolderForm').childNodes[0].childNodes[1].focus();

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
for (let i = 0; i < ToTranslate.length; ++i) {
	ToTranslate[i].innerHTML = browser.i18n.getMessage(ToTranslate[i].value);
}

document.body.addEventListener('mousemove', function(e) {
	if (move_target) {
		move_target.style.left = e.pageX - offsetX+'px';
		move_target.style.top = e.pageY - offsetY+'px';
	} else if (resize_target) {
		resize_target.childNodes[1].style.height = wH + e.pageY - pY+'px';
		resize_target.childNodes[1].style.width = wW + e.pageX - pX+'px';
	}
});

document.body.addEventListener('mouseup', function() { // save the new window position and size, and put it on top of the pile
	let win = move_target ?? resize_target ?? raise_target ?? null;
	if (win) {
		// end of the drag-n-drop or resize, turn back the pixels into percentages.
		// this resolves `browser frame resizing` and `UI scale changes` which would push the windows outside the frame.
		// better do it here, and not during page load, since this function is called in the background.

		let computedLeft = (win.offsetLeft * 100) / window.innerWidth;
		let computedTop = (win.offsetTop * 100) / window.innerHeight;
		let computedWidth = (win.childNodes[1].offsetWidth * 100) / window.innerWidth;
		let computedHeight = (win.childNodes[1].offsetHeight * 100) / window.innerHeight;

		win.style.left = computedLeft + '%';
		win.style.top = computedTop + '%';
		win.childNodes[1].style.width = computedWidth + 'vw';
		win.childNodes[1].style.height = computedHeight + 'vh';

		chrome.storage.local.get('w', function(o) {
			let arr_windows = o.w ?? [];

			delete arr_windows[win.getAttribute('index')];
			arr_windows[win.getAttribute('index')] = {
				title:	win.childNodes[0].title,
				x:		computedLeft,
				y:		computedTop,
				w:		computedWidth, // 0 is <border>, 1 is <main>, 2 is <resize>
				h:		computedHeight
			};
			chrome.storage.local.set({'w': arr_windows });
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
	let target = document.getElementById(id);

	target.addEventListener('dragstart', function(e) {
		dragon_target = e.currentTarget.id;

		// place dropzones
		let Dropzones = document.getElementsByClassName('dropzone');
		for (let i = 0; i < Dropzones.length; ++i) {
			Dropzones[i].style.display = 'block';
			Dropzones[i].style.outline = '3px solid var(--click)';

			Dropzones[i].addEventListener('dragenter', function(e) {
				if (
					e.target.id &&
					(e.target.classList.contains('dropzone') || e.target.classList.contains('desktopFolder'))
				) {
					drop_target = e.target.id.replace('drop_', '');
				}
			});
		}

		// place delete zone
		document.getElementById('delete_vortex').style.visibility = 'visible';
	});

	target.addEventListener('mouseenter', function(e) {
		mouse_over = e.currentTarget;
	});

	target.addEventListener('mouseleave', function(e) {
		mouse_over = null;
	});
}
// drop
document.addEventListener('dragend', function() {
	if (
		(dragon_target && drop_target) &&
		(dragon_target !== drop_target) //had to check that
	) {
		chrome.bookmarks.get(dragon_target, function(e) { // check if we're already in the destination
			if (e[0].parentId !== drop_target) {
				chrome.bookmarks.move(dragon_target, {parentId: drop_target}).then(function() {
					location.reload();
				}); // moving between zones
			}
		});
	} else if (dragon_target && delete_drop_target) { // dropping in vortex
		browser.bookmarks.remove(dragon_target).then(function() {
			location.reload();
		});
	}

	location.reload();
});

registerFolder('menu________');
registerFolder('mobile______');
registerFolder('unfiled_____');

document.getElementById('options').addEventListener("mousedown", function() {
	chrome.runtime.openOptionsPage();
});

// watching for delete vortex
document.getElementById('delete_vortex').addEventListener('dragenter', function() {
	if (dragon_target != null) {
		delete_drop_target = true;
		drop_target = null;
	}
});

// rename (hover+Enter)
var editing = false;
document.addEventListener('keydown', function (e) {
	if (e.key === 'Enter' && mouse_over !== null && editing === false) {
		editing = true;

		mouse_over.outerHTML = '<form id="renameForm">'
			+ '<input value="'+mouse_over.title+'" name="folderName" type="text" required>'
			+ '<input name="origin" type="hidden" value="'+mouse_over.id+'">';

		mouse_over = null;

		document.getElementById('renameForm').addEventListener('submit', function(e) {
			e.preventDefault();
			let formData = new FormData(e.target);

			browser.bookmarks.update(
				formData.get('origin'),
				{
					title: formData.get('folderName')
				}
			).then(function() {
				location.reload();
			});
		});
	}

	if (e.key === 'Escape' && editing === true) {
		location.reload();
	}
});
