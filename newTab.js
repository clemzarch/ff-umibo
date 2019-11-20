browser.storage.local.get().then(function(options) {
	if(options.bg === 'fetch_unsplash') {
		// document.documentElement.style.background = 'url(https://source.unsplash.com/collection/540518/3840x2160)  repeat scroll 100% 0% / cover';
		// document.documentElement.style.background = 'url(https://source.unsplash.com/collection/573009/1920x1080)  center / cover';
		document.documentElement.style.background = 'url(https://source.unsplash.com/collection/789734/3840x2160)  center / cover';
	}

	if(!options.separate_categories) {
		if(options.categories_toolbar) {
			browser.bookmarks.getChildren('toolbar_____').then(function(root) {
				root.forEach(function(sub){
					fetchFolder(sub);
				});
			});
		}
		if(options.categories_menu) {
			browser.bookmarks.getChildren('menu________').then(function(root) {
				root.forEach(function(sub){
					fetchFolder(sub);
				});
			});
		}
		if(options.categories_mobile) {
			browser.bookmarks.getChildren('mobile______').then(function(root) {
				root.forEach(function(sub){
					fetchFolder(sub);
				});
			});
		}
		if(options.categories_other) {
			browser.bookmarks.getChildren('unfiled_____').then(function(root) {
				root.forEach(function(sub){
					fetchFolder(sub);
				});
			});
		}
	} else {
		if(options.categories_toolbar) {
			browser.bookmarks.get('toolbar_____').then(function(sub) {
				fetchFolder(sub[0]);
			});
		}
		if(options.categories_menu) {
			browser.bookmarks.get('menu________').then(function(sub) {
				fetchFolder(sub[0]);
			});
		}
		if(options.categories_mobile) {
			browser.bookmarks.get('mobile______').then(function(sub) {
				fetchFolder(sub[0]);
			});
		}
		if(options.categories_other) {
			browser.bookmarks.get('unfiled_____').then(function(sub) {
				fetchFolder(sub[0]);
			});
		}
	}
	
	if(options.windows) {
		keys = Object.keys(options.windows);
		
		for (let key of keys) {
			w = options.windows[key];
			
			// check if window stuck
			if (w.y < 10) {
				w.y = 10;
			} else if (w.y > window.innerHeight - 20) {
				w.y = window.innerHeight - 200;
			}
			if (w.x < -200) {
				w.x = 10;
			} else if (w.x > window.innerWidth - 50) {
				w.x = window.innerWidth - 200;
			}

			document.body.insertAdjacentHTML('beforeend', '<div window_id="'+w.id+'" style="left:'+w.x+'px;top:'+w.y+'px" class="window"><div class="border" id="'+w.id+'" title="'+w.title+'">'+w.title+'<span id="close_button" title="Close"></span></div><main></main><div class="resize"></div></div>');
			
			registerWindow(w.id);
			populateWindow(w.id);
		}
	}

	if(options.show_search_tips) {
		document.getElementById('tip_container').style.display = 'block';
	}
});

var cible,closing;
var offsetX,offsetY;

function registerFolder(folder) {
	document.getElementById('folder_'+folder.id).addEventListener('click', function(folder) {
		folderId = folder.target.getAttribute('href');
		folderTitle = folder.target.innerHTML;

		if (document.getElementById(folderId) == null) {
			len = document.getElementsByClassName('window').length;
			
			document.body.insertAdjacentHTML('beforeend', '<div window_id="'+folderId+'" style="z-index:'+len+'; top: '+(folder.clientY+50)+'px; left:'+(folder.clientX-200)+'px" class="window"><div class="border" id="'+folderId+'" title="'+folderTitle+'">'+folderTitle+'<span id="close_button" title="Close"></span></div><main></main><div class="resize"></div></div>');
			
			// save in local storage
			browser.storage.local.get().then(function(o) {
				if(o.windows) {
					arr_windows = o.windows;			
				} else {
					arr_windows = [];
				}
				arr_windows[folderId] = {
					id: folderId,
					title: folderTitle,
					y: folder.clientY+50,
					x: folder.clientX-200
				};
				browser.storage.local.set({'windows': arr_windows});
			});
			
			registerWindow(folderId);
			populateWindow(folderId);
		}
	});
}
	
function registerWindow(id) {
// move
	document.getElementById(id).addEventListener('mousedown', function(e) {
		offsetX = e.pageX - e.currentTarget.parentNode.offsetLeft;
		offsetY = e.pageY - e.currentTarget.parentNode.offsetTop;
		cible = e.currentTarget.parentNode;
		document.body.insertAdjacentHTML('beforeend','<div id="secureDrag" style="z-index:10;position:absolute;top:0;bottom:0;left:0;right:0;background:#f000;"></div>');
	});

// raise
	document.getElementById(id).parentNode.addEventListener('mousedown', function(e) {
		allWindows = document.getElementsByClassName('window');
		for(var i = 0; i < allWindows.length; i++) {
			if(allWindows[i].style.zIndex > 0 && e.currentTarget.style.zIndex != allWindows.length){
				allWindows[i].style.zIndex--;
				allWindows[i].classList.remove('firstWindow');
			}
		}
		e.currentTarget.style.zIndex = allWindows.length;
		e.currentTarget.classList.add('firstWindow');
	});

// close
	document.getElementById(id).childNodes[1].addEventListener('mousedown', function(e) {
		e.target.parentNode.parentNode.remove();
		id = e.target.parentNode.id;

		browser.storage.local.get().then(function(o) {
			arr_windows = o.windows;
			delete arr_windows[id]; // si tout explose c'est de sa faute
			browser.storage.local.set({'windows': arr_windows });
		});
		closing = true;			
	});
}

function populateWindow(id) {
	browser.bookmarks.getChildren(id).then(function(e) {
		WindowMain = document.getElementById(id).parentNode.getElementsByTagName("main")[0];
		WindowElementsLength = e.length;
		
		for (var i = 0; i < WindowElementsLength; ++i) {
			var el = e[i];
			
			if (el.type == 'bookmark') {
				if (el.title == '') {
					el.title = el.url;
				}
				
				// OPTIMISER FETCH ICONS, TROP LENT QUAND OUVERTURE DE FENETRE
				WindowMain.insertAdjacentHTML('beforeend', '<a title="'+el.url+'" href="'+el.url+'"><img width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url='+el.url+'"/>'+el.title.substring(0, 60)+'</a>');			
				// WindowMain.insertAdjacentHTML('beforeend', '<a title="'+el.url+'" href="'+el.url+'">'+el.title.substring(0, 60)+'</a>');			
				
			} else if (el.type == 'folder') {
				WindowMain.insertAdjacentHTML('beforeend', '<article id="folder_'+el.id+'" href="'+el.id+'">'+el.title.substring(0, 150)+'</article>');
				registerFolder(el);
			} else {
				WindowMain.insertAdjacentHTML('beforeend', '<div></div>');
			}		
		}
	});
}

document.body.addEventListener('mousemove',function(e) {
	if(cible) {
		cible.style.left = e.pageX - offsetX+'px';
		cible.style.top = e.pageY - offsetY+'px';
	}
});
document.body.addEventListener('mouseup',function(e) {
	if (cible && closing == null) {
		browser.storage.local.get().then(function(o) {
			if(o.windows) {
				arr_windows = o.windows;			
			} else {
				arr_windows = [];
			}
			
			arr_windows[cible.getAttribute('window_id')] = {
				id: cible.getAttribute('window_id'),
				title: cible.childNodes[0].title,
				x: cible.offsetLeft,
				y: cible.offsetTop
			};
			
			browser.storage.local.set({'windows': arr_windows });
			cible = null;
		});
	}
	closing = null;
	if(document.getElementById('secureDrag') !== null) {
		document.getElementById('secureDrag').outerHTML = '';
	}
});

function fetchFolder(sub) {
	if (sub.type === 'bookmark') {
		document.body.insertAdjacentHTML('beforeend', '<a title="'+sub.url+'" class="desktopFolder" href="'+sub.url+'"><img width="16px" height="16px" src="https://s2.googleusercontent.com/s2/favicons?domain_url='+sub.url+'"/>'+sub.title.substring(0, 20)+'</a>');
		// document.body.insertAdjacentHTML('beforeend', '<a title="'+sub.url+'" class="desktopFolder" href="'+sub.url+'">'+sub.title+'</a>');
	} else if (sub.type === 'folder') {
		document.body.insertAdjacentHTML('beforeend', '<div class="desktopFolder" id="folder_'+sub.id+'" href="'+sub.id+'">'+sub.title.substring(0, 20)+'</div>');
		registerFolder(sub);		
	} else {
		document.body.insertAdjacentHTML('beforeend', '<hr>');
	}
}