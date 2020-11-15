browser.storage.local.get().then(function(options) {
	if (Object.entries(options).length === 0) { // if no options yet
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

	// checkboxes
	Inputs = document.getElementsByTagName('input');
	for (var i = 0; i < Inputs.length; i++) {
		Inputs[i].addEventListener("change", function(e) {
			browser.storage.local.set({
				[e.target.name]: e.target.checked
			});
		});

		Inputs[i].checked = options[Inputs[i].name];
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
