browser.storage.local.get().then(function(options) {
	if (Object.entries(options).length === 0) { // if no options yet
		browser.storage.local.set({
			categories_toolbar: true,
			show_search_tips: true,
			custom_css: null
		});
		location.reload();
	}
	
	Inputs = document.getElementsByTagName('input');
	
	if (options['bg'] != null) {
		document.getElementById(options['bg']).checked = true;
	}

	for(var i = 0; i < Inputs.length; i++) {
		Inputs[i].addEventListener("change", function(e) {
			if(e.target.type == 'radio' && e.target.checked) { //radio button
				value = e.target.value
			} else {
				value = e.target.checked;
			}
			
			browser.storage.local.set({
				[e.target.name]: value
			});
		});

		if (Inputs[i].type !== 'radio') {
			Inputs[i].checked = options[Inputs[i].name];
		}
	}

	document.getElementById('custom_css').value = options.custom_css;
	document.getElementById('custom_css').addEventListener("keyup", function(e) {
		browser.storage.local.set({
			custom_css: e.target.value
		});
	});
	
});