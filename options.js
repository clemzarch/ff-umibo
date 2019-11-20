browser.storage.local.get().then(function(options) {
	console.log(options);
	
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
});