;(function() {

	const queue = [];
	const toastrsSpacing = 10;
	const iconMap = {
		success: "check-circle",
		error: "times-circle",
		info: "info-circle"
	};

	function toastr(opts) {
		const toast = {};
		toast.title = opts.title;
		toast.message = opts.message || "";
		toast.type = opts.type;
		toast.position = opts.position || "top right";
		toast.duration = opts.duration || 1000;
		toast.addOnTop = !!opts.addOnTop;
		toast.end = opts.end;
		toast.progress = opts.progress;

		// Containers
		const parentElement = $("<div class='toastr'></div>");
		parentElement.addClass(`toastr-${toast.type}`);
		parentElement.append(`<div class='toastr-icon'><i class='fa fa-2x fa-${ iconMap[toast.type] }'></i></div>`);
		const body = parentElement.append("<div class='toastr-body'></div>").find(".toastr-body");

		// Close button
		let buttonHtml = "";
		if (opts.closeButton) {
			buttonHtml = "<span><i class='fa fa-close'></i></span>";
		}

		toast.buttonHtml = buttonHtml;

		if (toast.title != null) {
			body.append(`<h4 class='toastr-title'><span>${toast.title}</span>${buttonHtml}</h4>`);
			toast.titleElement = body.find(".toastr-title");
		} else if (buttonHtml != "") {
			body.append(`<h4 class='toastr-title'><span></span>${buttonHtml}</h4>`);
			toast.titleElement = body.find(".toastr-title");
		}

		if (buttonHtml != "") {
			body.find(".fa-close")
				.css("cursor", "pointer")
				.click(function() {
					removeToast(toast);
				});
		}

		if (toast.message != null) {
			body.append(`<p class='toastr-message'>${toast.message}</p>`);
			toast.messageElement = body.find(".toastr-message");
		}

		if (opts.progressBar) {	
			toast.progressBar = body.append("<div class='toastr-progress'><div></div></div>")
								.find(".toastr-progress div");
		}

		// CSS position
		const yAxis = toast.position.split(" ")[0];
		const xAxis = toast.position.split(" ")[1];
		const lastAdded = queue[0] && queue[0].el;
		let marginX = 5;
		let marginY = 5;

		if (xAxis === "left") {
			parentElement.css("left", `${marginX}px`);
		} else {
			parentElement.css("right", `${marginX}px`);
		}

		if (lastAdded) {
			if (yAxis === "bottom") {
				toastr.addOnTop = true;
			} else {
				marginY = parseInt( lastAdded.css("top"), 10 ) + parseInt( lastAdded.css("height"), 10 ) + toastrsSpacing;
			}
		}

		if (yAxis === "top") {
			parentElement.css("top", `${marginY}px`);
		} else {
			parentElement.css("bottom", `${marginY}px`);
		}

		if (toastr.addOnTop && lastAdded) {
			var y = parseInt( lastAdded.css("top"), 10 ) - toastrsSpacing;
			parentElement.css("bottom",  y + "px");
		}

		toast.el = parentElement;

		var now;
		toast.watchr = setInterval(() => {
			now = Date.now();

			if (!toast.startTime) {
				toast.startTime = now;
			}

			if (now - toast.startTime > toast.duration) {
				removeToast(toast);
				clearInterval(toast.watchr);
			} else {
				if (toast.progressBar) {
					let perc = (now - toast.startTime) / toast.duration;
					perc = Math.min(1 - perc, 1);
					perc = Math.round(perc * 100);
					toast.progressBar.css("width", perc + "%");
				}

				if (toast.progress) {
					let dirty = toast.progress.call(toast, now - toast.startTime, toast.duration, toast);
					if (dirty) {
						toast.messageElement.text(toast.message);
						if (toast.title) {
							if (!toast.titleElement) {
								body.append(`<h4 class='toastr-title'><span>${toast.title}</span>${buttonHtml}</h4>`);
								toast.titleElement = body.find(".toastr-title");
								return;
							}
							toast.titleElement.html(`<h4 class='toastr-title'><span>${toast.title}</span>${toast.buttonHtml}</h4>`);
						}
					}
				}
			}
		}, 1000/60);

		queue.unshift(toast);
		$("body").append(parentElement);

		parentElement.fadeIn(240);
	}

	function removeToast(toast) {
		queue.splice( queue.indexOf(toast), 1 );
		toast.el.remove();
		if (toast.end) {
			toast.end();
		}
	}

	jQuery.each("success,error,info".split(","), function(i, type) {
		toastr[type] = function(opts) {
			return toastr.call(null, Object.assign({ type: type }, opts));
		}
	});

	jQuery.toast = toastr;

})();