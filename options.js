chrome.storage.local.get(null, function(options) {
	if (Object.entries(options).length === 0) { // if no options yet
		browser.storage.local.set({
			'bg': "follow_theme",
			'categories_toolbar': true,
			'show_search_tips': true
		});
		location.reload();
	}

	Inputs = document.getElementsByTagName('input');

	if (options['bg'] != null) {
		document.getElementById(options['bg']).checked = true;
	}

	for(var i = 0; i < Inputs.length; i++) {
		Inputs[i].addEventListener("change", function(e) {
			if(e.target.type === 'radio' && e.target.checked) { //radio button
				value = e.target.value
			} else {
				value = e.target.checked;
			}

			chrome.storage.local.set({
				[e.target.name]: value
			});
		});

		if (Inputs[i].type !== 'radio') {
			Inputs[i].checked = options[Inputs[i].name];
		}
	}
});