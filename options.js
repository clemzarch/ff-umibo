browser.storage.local.get().then(function(options) {
	if (Object.entries(options).length === 0) { // if no options yet
		browser.storage.local.set({
			toolbar_as_folder: true,
            show_search_tips: true,
            background: "image",
            bg_url: "https://images.unsplash.com/photo-1600627225432-82de96999068?auto=format&fit=crop&w=2550&q=80",
            bg_color: "#ffffff",
            custom_css: null
		});
		location.reload();
	}

	showAndHide(options.background);
	document.getElementById(options.background).checked = true;

	let Inputs = document.getElementsByTagName('input');
	for (let i = 0; i < Inputs.length; i++) {
		Inputs[i].addEventListener("input", function(e) {
			if (e.target.type === 'radio' && e.target.checked) { //radio button
				value = e.target.value;
				showAndHide(value);
			} else if (
				e.target.type === 'text' ||
				e.target.type === 'color' ||
				e.target.type === 'range'
			) {
				value = e.target.value;
			} else {
				value = e.target.checked;
			}

			browser.storage.local.set({
				[e.target.name]: value
			});
		});

		if (Inputs[i].type === 'checkbox') {
			Inputs[i].checked = options[Inputs[i].name];
		} else if (
			Inputs[i].type === 'text' ||
			Inputs[i].type === 'range' ||
			Inputs[i].type === 'color'
		) {
			Inputs[i].value = options[Inputs[i].name];
		}
	}

	// custom css textarea
	document.getElementById('custom_css').value = options.custom_css;
	document.getElementById('custom_css').addEventListener("keyup", function(e) {
		browser.storage.local.set({
			custom_css: e.target.value
		});
	});
});

// translations
ToTranslate = document.getElementsByTagName('data');
for (let i = 0; i < ToTranslate.length; ++i) {
	ToTranslate[i].innerHTML = browser.i18n.getMessage(ToTranslate[i].value);
}

function showAndHide(value) {
	if (value === 'image') {
		document.getElementById('bg_color').style.display = 'none';
		document.getElementById('bg_url').style.display = 'block';
	} else if (value === 'color') {
		document.getElementById('bg_url').style.display = 'none';
		document.getElementById('bg_color').style.display = 'block';
	} else {
		document.getElementById('bg_url').style.display = 'none';
		document.getElementById('bg_color').style.display = 'none';
	}
}

// RED https://images.unsplash.com/photo-1513624954087-ca7109c0f710?auto=format&fit=crop&w=2550&q=80
// GREEN https://images.unsplash.com/photo-1581084324492-c8076f130f86?auto=format&fit=crop&w=2550&q=80
// BANDS https://images.unsplash.com/photo-1581084104193-bec602b556a0?auto=format&fit=crop&w=2550&q=80
// BLUE&PINK https://images.unsplash.com/photo-1578598491752-1df4a1c57439?auto=format&fit=crop&w=2550&q=80
// SPACE https://images.unsplash.com/photo-1570475820318-2dcd997f2c4b?auto=format&fit=crop&w=2550&q=80
// NIGHTLY https://images.unsplash.com/photo-1600627225432-82de96999068?auto=format&fit=crop&w=2550&q=80
// RED&BLUE https://images.unsplash.com/photo-1606162446244-0e3fd9cf11c2?auto=format&fit=crop&w=2550&q=80
