browser.storage.local.get().then(function(options) {
	if (!options.separate_categories) {
		if (options.categories_toolbar) {
			browser.bookmarks.getChildren('toolbar_____').then(function(bms) {
				let l = bms.length;
				document.body.insertAdjacentHTML('beforeend', '<div id="drop_toolbar_____" class="desktop dropzone"></div>');
				let zone = document.getElementById('drop_toolbar_____');
				for (let i = 0 ; i < l ; ++i) {
					fetchFolder(bms[i], zone);
				}
			});
		}
		if (options.categories_menu) {
			browser.bookmarks.getChildren('menu________').then(function(bms) {
				let l = bms.length;
                document.body.insertAdjacentHTML('beforeend', '<div id="drop_menu________" class="desktop dropzone"></div>');
                let zone = document.getElementById('drop_menu________');
				for (let i = 0 ; i < l ; ++i) {
					fetchFolder(bms[i], zone);
				}
			});
		}
		if (options.categories_mobile) {
			browser.bookmarks.getChildren('mobile______').then(function(bms) {
				let l = bms.length;
                document.body.insertAdjacentHTML('beforeend', '<div id="drop_mobile______" class="desktop dropzone"></div>');
                let zone = document.getElementById('drop_mobile______');
				for (let i = 0 ; i < l ; ++i) {
					fetchFolder(bms[i], zone);
				}
			});
		}
		if (options.categories_other) {
			browser.bookmarks.getChildren('unfiled_____').then(function(bms) {
				let l = bms.length;
                document.body.insertAdjacentHTML('beforeend', '<div id="drop_unfiled_____" class="desktop dropzone"></div>');
                let zone = document.getElementById('drop_unfiled_____');
				for (let i = 0 ; i < l ; ++i) {
					fetchFolder(bms[i], zone);
				}
			});
		}
	} else {
		if (options.categories_toolbar) {
			browser.bookmarks.get('toolbar_____').then(function(sub) {
				fetchFolder(sub[0], document.body);
			});
		}
		if (options.categories_menu) {
			browser.bookmarks.get('menu________').then(function(sub) {
				fetchFolder(sub[0], document.body);
			});
		}
		if (options.categories_mobile) {
			browser.bookmarks.get('mobile______').then(function(sub) {
				fetchFolder(sub[0], document.body);
			});
		}
		if (options.categories_other) {
			browser.bookmarks.get('unfiled_____').then(function(sub) {
				fetchFolder(sub[0], document.body);
			});
		}
	}

	if (options.windows) { // restore windows
		let keys = Object.keys(options.windows);
		let i = 1;
		for (let key of keys) {
			let w = options.windows[key];

			drawWindow(w.id, w.title, w.x, w.y, w.w, w.h, i++);
			registerWindow('win_'+w.id);
			populateWindow(w.id);
		}
	}

	if (options.custom_css) {
		document.head.insertAdjacentHTML('beforeend', '<style>'+options.custom_css+'</style>')
	}

	if (options.show_search_tips) {
		document.getElementById('tip_container').style.visibility = 'visible';
	}

	if (Object.entries(options).length === 0) { // if no options yet
		browser.runtime.setUninstallURL('http://zarch.info/UMiBO/uninstalled.html');
		browser.storage.local.set({
			separate_categories: true,
			categories_toolbar: true,
			categories_menu: true,
			categories_mobile: true,
			categories_other: true,
			show_search_tips: true,
			custom_css: null
		});
		location.reload();
	}
});

let move_target, drop_target, resize_target, delete_drop_target, offsetX, offsetY;
let closing = false;

function registerFolder(folder) {
	document.getElementById(folder).addEventListener('click', function(folder) {
		let folderId = folder.target.id;
		let existingWindow = document.getElementById('win_'+folderId);

		if (existingWindow === null) {
			let folderTitle = folder.target.innerHTML;
			let len = document.getElementsByClassName('window').length;

			drawWindow(folderId, folderTitle, folder.clientX-200, folder.clientY+50, 400, 300, len);
			document.getElementById('win_'+folderId).animate(
				[{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
				{ duration: 200 }
			);
			registerWindow('win_'+folderId);
			populateWindow(folderId);

			// save in local storage
			browser.storage.local.get().then(function(o) {
				let arr_windows = o.windows ? o.windows : [];

				arr_windows[folderId] = {
					id: folderId,
					title: folderTitle,
					y: folder.clientY+50,
					x: folder.clientX-200,
					h: 300,
					w: 400,
					z: len,
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

function registerWindow(id) {
	let window = document.getElementById(id);
	let realIndex = window.getAttribute('index');
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
		let allWindows = document.getElementsByClassName('window');
		for (let i = 0; i < allWindows.length; i++) {

			if (allWindows[i].style.zIndex > 0 && window.style.zIndex !== allWindows.length) {
				allWindows[i].style.zIndex--;
				allWindows[i].classList.remove('firstWindow');
			}
		}
		window.style.zIndex = allWindows.length.toString();
		window.classList.add('firstWindow');
	});

// close
	window.childNodes[0].childNodes[2].addEventListener('mousedown', function() {
		window.remove();

		browser.storage.local.get().then(function(o) {
			let arr_windows = o.windows;
			delete arr_windows[realIndex]; // si tout explose c'est de sa faute
			browser.storage.local.set({'windows': arr_windows });
		});
		closing = true;
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
        + '<input name="origin" type="hidden" value="'+realIndex+'">'
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

function populateWindow(id) {
	browser.bookmarks.getChildren(id).then(function(e) {
		let WindowMain = document.getElementById('win_'+id).childNodes[1];
		let BookmarksLength = e.length;

		for (let i = 0; i < BookmarksLength; ++i) {
			let el = e[i];
			if (el.type === 'bookmark') {
				if (el.title === '') {
					el.title = el.url;
				}
				// OPTIMISER FETCH ICONS, TROP LENT QUAND OUVERTURE DE FENETRE
				WindowMain.insertAdjacentHTML('beforeend', '<a class="desktopLink" id="'+el.id+'" title="'+el.title+'" href="'+el.url+'"><img loading="lazy" width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url='+el.url+'"/>'+el.title+'</a>');
				dragonPrepare(el.id);
			} else if (el.type === 'folder') {
				WindowMain.insertAdjacentHTML('beforeend', '<div class="desktopFolder" id="'+el.id+'" title="'+el.title+'" href="'+el.id+'" draggable="true">'+el.title+'</div>');
				registerFolder(el.id);
				dragonPrepare(el.id);
			}
		}
	});
}

function fetchFolder(sub, zone) { // desktop icons
	if (sub.type === 'bookmark') {
		zone.insertAdjacentHTML('beforeend', '<a class="desktopLink" id="'+sub.id+'" title="'+sub.title+'" href="'+sub.url+'"><img width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url='+sub.url+'"/>'+sub.title+'</a>');
		dragonPrepare(sub.id);
	} else if (sub.type === 'folder') {
		zone.insertAdjacentHTML('beforeend', '<div class="desktopFolder" id="'+sub.id+'" title="'+sub.title+'" href="'+sub.id+'" draggable="true">'+sub.title+'</div>');
		registerFolder(sub.id);
		dragonPrepare(sub.id);
	}
}

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
	if (move_target || resize_target) {
		let win = resize_target ? resize_target : move_target;

		if (closing === false) {
			browser.storage.local.get().then(function(o) {
				let arr_windows = o.windows ? o.windows : [];

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
		}
		move_target = null;
		resize_target = null;
	}

	closing = false;
	if (document.getElementById('secureDrag')) {
		document.getElementById('secureDrag').outerHTML = '';
	}
});

// watching for delete vortex
document.getElementById('delete_vortex').addEventListener('dragenter', function() {
	if (dragon_target != null) {
		delete_drop_target = true;
		drop_target = null;
	}
});

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

function drawWindow(id, title, x, y, w, h, z) {
	// check if window stuck
	if (y < 0) {
		y = 0;
	}

	if (x < 0) {
		x = 0;
	}

	let data = '<div id="win_'+id+'" index="'+id+'" style="top:'+y+'px; left:'+x+'px;z-index:'+z+'" class="window">'
	+'<div class="border" title="'+title+'">'
	+'<span class="create_button" title="Create"></span>'+title+'<span id="close_button" title="Close"></span></div>'
	+'<main style="height:'+h+'px;width:'+w+'px"></main><div class="resize"></div>'
	+'<div class="dropzone" id="drop_'+id+'"></div></div>';
	document.body.insertAdjacentHTML('beforeend', data);
}

document.getElementById('options').addEventListener("click", function() {
	browser.runtime.openOptionsPage();
});

// translations
ToTranslate = document.getElementsByTagName('data');
for (let i = 0; i < ToTranslate.length; ++i) {
	ToTranslate[i].innerHTML = browser.i18n.getMessage(ToTranslate[i].value);
}
document.title = browser.i18n.getMessage('pageTitle');
