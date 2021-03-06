(function () {
	// Schedule Template - by CodyHouse.co
	function ScheduleTemplate(element) {
		this.element = element;
		this.timelineItems = this.element.getElementsByClassName('cd-schedule__timeline')[0].getElementsByTagName('li');
		this.timelineStart = getScheduleTimestamp(this.timelineItems[0].textContent);
		this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems[1].textContent) - getScheduleTimestamp(this.timelineItems[0].textContent);

		this.topInfoElement = this.element.getElementsByClassName('cd-schedule__top-info')[0];
		this.singleEvents = this.element.getElementsByClassName('cd-schedule__event');

		this.modal = this.element.getElementsByClassName('cd-schedule-modal')[0];
		this.modalHeader = this.element.getElementsByClassName('cd-schedule-modal__header')[0];
		this.modalHeaderBg = this.element.getElementsByClassName('cd-schedule-modal__header-bg')[0];
		this.modalBody = this.element.getElementsByClassName('cd-schedule-modal__body')[0];
		this.modalBodyBg = this.element.getElementsByClassName('cd-schedule-modal__body-bg')[0];
		this.modalClose = this.modal.getElementsByClassName('cd-schedule-modal__close')[0];
		this.modalDate = this.modal.getElementsByClassName('cd-schedule-modal__date')[0];
		this.modalEventName = this.modal.getElementsByClassName('cd-schedule-modal__name')[0];
		this.coverLayer = this.element.getElementsByClassName('cd-schedule__cover-layer')[0];

		this.modalMaxWidth = 800;
		this.modalMaxHeight = 480;

		this.animating = false;
		this.supportAnimation = Util.cssSupports('transition');

		this.initSchedule();
	};

	ScheduleTemplate.prototype.initSchedule = function () {
		this.scheduleReset();
		this.initEvents();
	};

	ScheduleTemplate.prototype.scheduleReset = function () {
		// according to the mq value, init the style of the template
		var mq = this.mq(),
			loaded = Util.hasClass(this.element, 'js-schedule-loaded'),
			modalOpen = Util.hasClass(this.modal, 'cd-schedule-modal--open');
		if (mq == 'desktop' && !loaded) {
			Util.addClass(this.element, 'js-schedule-loaded');
			this.placeEvents();
			modalOpen && this.checkEventModal(modalOpen);
		} else if (mq == 'mobile' && loaded) {
			//in this case you are on a mobile version (first load or resize from desktop)
			Util.removeClass(this.element, 'cd-schedule--loading js-schedule-loaded');
			this.resetEventsStyle(); ~~
				modalOpen && this.checkEventModal();
		} else if (mq == 'desktop' && modalOpen) {
			//on a mobile version with modal open - need to resize/move modal window
			this.checkEventModal(modalOpen);
			Util.removeClass(this.element, 'cd-schedule--loading');
		} else {
			Util.removeClass(this.element, 'cd-schedule--loading');
		}
	};

	ScheduleTemplate.prototype.resetEventsStyle = function () {
		// remove js style applied to the single events
		for (var i = 0; i < this.singleEvents.length; i++) {
			this.singleEvents[i].removeAttribute('style');
		}
	};

	ScheduleTemplate.prototype.placeEvents = function () {
		// on big devices - place events in the template according to their time/day
		var self = this,
			slotHeight = this.topInfoElement.offsetHeight;
		for (var i = 0; i < this.singleEvents.length; i++) {
			var anchor = this.singleEvents[i].getElementsByTagName('a')[0];
			var start = getScheduleTimestamp(anchor.getAttribute('data-start')),
				duration = getScheduleTimestamp(anchor.getAttribute('data-end')) - start;

			var eventTop = slotHeight * (start - self.timelineStart) / self.timelineUnitDuration,
				eventHeight = slotHeight * duration / self.timelineUnitDuration;

			this.singleEvents[i].setAttribute('style', 'top: ' + (eventTop - 1) + 'px; height: ' + (eventHeight + 1) + 'px');
		}

		Util.removeClass(this.element, 'cd-schedule--loading');
	};

	ScheduleTemplate.prototype.initEvents = function () {
		var self = this;
		for (var i = 0; i < this.singleEvents.length; i++) {
			// open modal when user selects an event
			this.singleEvents[i].addEventListener('click', function (event) {
				// event.preventDefault();
				// if(!self.animating) self.openModal(this.getElementsByTagName('a')[0]);
			});
		}
		//close modal window
		this.modalClose.addEventListener('click', function (event) {
			event.preventDefault();
			if (!self.animating) self.closeModal();
		});
		this.coverLayer.addEventListener('click', function (event) {
			event.preventDefault();
			if (!self.animating) self.closeModal();
		});
	};

	ScheduleTemplate.prototype.openModal = function (target) {
		var self = this;
		var mq = self.mq();
		this.animating = true;

		//update event name and time
		this.modalEventName.textContent = target.getElementsByTagName('em')[0].textContent;
		this.modalDate.textContent = target.getAttribute('data-start') + ' - ' + target.getAttribute('data-end');
		this.modal.setAttribute('data-event', target.getAttribute('data-event'));

		//update event content
		this.loadEventContent(target.getAttribute('data-content'));

		Util.addClass(this.modal, 'cd-schedule-modal--open');

		setTimeout(function () {
			//fixes a flash when an event is selected - desktop version only
			Util.addClass(target.closest('li'), 'cd-schedule__event--selected');
		}, 10);

		if (mq == 'mobile') {
			self.modal.addEventListener('transitionend', function cb() {
				self.animating = false;
				self.modal.removeEventListener('transitionend', cb);
			});
		} else {
			var eventPosition = target.getBoundingClientRect(),
				eventTop = eventPosition.top,
				eventLeft = eventPosition.left,
				eventHeight = target.offsetHeight,
				eventWidth = target.offsetWidth;

			var windowWidth = window.innerWidth,
				windowHeight = window.innerHeight;

			var modalWidth = (windowWidth * .8 > self.modalMaxWidth) ? self.modalMaxWidth : windowWidth * .8,
				modalHeight = (windowHeight * .8 > self.modalMaxHeight) ? self.modalMaxHeight : windowHeight * .8;

			var modalTranslateX = parseInt((windowWidth - modalWidth) / 2 - eventLeft),
				modalTranslateY = parseInt((windowHeight - modalHeight) / 2 - eventTop);

			var HeaderBgScaleY = modalHeight / eventHeight,
				BodyBgScaleX = (modalWidth - eventWidth);

			//change modal height/width and translate it
			self.modal.setAttribute('style', 'top:' + eventTop + 'px;left:' + eventLeft + 'px;height:' + modalHeight + 'px;width:' + modalWidth + 'px;transform: translateY(' + modalTranslateY + 'px) translateX(' + modalTranslateX + 'px)');
			//set modalHeader width
			self.modalHeader.setAttribute('style', 'width:' + eventWidth + 'px');
			//set modalBody left margin
			self.modalBody.setAttribute('style', 'margin-left:' + eventWidth + 'px');
			//change modalBodyBg height/width ans scale it
			self.modalBodyBg.setAttribute('style', 'height:' + eventHeight + 'px; width: 1px; transform: scaleY(' + HeaderBgScaleY + ') scaleX(' + BodyBgScaleX + ')');
			//change modal modalHeaderBg height/width and scale it
			self.modalHeaderBg.setAttribute('style', 'height: ' + eventHeight + 'px; width: ' + eventWidth + 'px; transform: scaleY(' + HeaderBgScaleY + ')');

			self.modalHeaderBg.addEventListener('transitionend', function cb() {
				//wait for the  end of the modalHeaderBg transformation and show the modal content
				self.animating = false;
				Util.addClass(self.modal, 'cd-schedule-modal--animation-completed');
				self.modalHeaderBg.removeEventListener('transitionend', cb);
			});
		}

		//if browser do not support transitions -> no need to wait for the end of it
		this.animationFallback();
	};

	ScheduleTemplate.prototype.closeModal = function () {
		var self = this;
		var mq = self.mq();

		var item = self.element.getElementsByClassName('cd-schedule__event--selected')[0],
			target = item.getElementsByTagName('a')[0];

		this.animating = true;

		if (mq == 'mobile') {
			Util.removeClass(this.modal, 'cd-schedule-modal--open');
			self.modal.addEventListener('transitionend', function cb() {
				Util.removeClass(self.modal, 'cd-schedule-modal--content-loaded');
				Util.removeClass(item, 'cd-schedule__event--selected');
				self.animating = false;
				self.modal.removeEventListener('transitionend', cb);
			});
		} else {
			var eventPosition = target.getBoundingClientRect(),
				eventTop = eventPosition.top,
				eventLeft = eventPosition.left,
				eventHeight = target.offsetHeight,
				eventWidth = target.offsetWidth;

			var modalStyle = window.getComputedStyle(self.modal),
				modalTop = Number(modalStyle.getPropertyValue('top').replace('px', '')),
				modalLeft = Number(modalStyle.getPropertyValue('left').replace('px', ''));

			var modalTranslateX = eventLeft - modalLeft,
				modalTranslateY = eventTop - modalTop;

			Util.removeClass(this.modal, 'cd-schedule-modal--open cd-schedule-modal--animation-completed');

			//change modal width/height and translate it
			self.modal.style.width = eventWidth + 'px'; self.modal.style.height = eventHeight + 'px'; self.modal.style.transform = 'translateX(' + modalTranslateX + 'px) translateY(' + modalTranslateY + 'px)';
			//scale down modalBodyBg element
			self.modalBodyBg.style.transform = 'scaleX(0) scaleY(1)';
			//scale down modalHeaderBg element
			// self.modalHeaderBg.setAttribute('style', 'transform: scaleY(1)');
			self.modalHeaderBg.style.transform = 'scaleY(1)';

			self.modalHeaderBg.addEventListener('transitionend', function cb() {
				//wait for the  end of the modalHeaderBg transformation and reset modal style
				Util.addClass(self.modal, 'cd-schedule-modal--no-transition');
				setTimeout(function () {
					self.modal.removeAttribute('style');
					self.modalBody.removeAttribute('style');
					self.modalHeader.removeAttribute('style');
					self.modalHeaderBg.removeAttribute('style');
					self.modalBodyBg.removeAttribute('style');
				}, 10);
				setTimeout(function () {
					Util.removeClass(self.modal, 'cd-schedule-modal--no-transition');
				}, 20);
				self.animating = false;
				Util.removeClass(self.modal, 'cd-schedule-modal--content-loaded');
				Util.removeClass(item, 'cd-schedule__event--selected');
				self.modalHeaderBg.removeEventListener('transitionend', cb);
			});
		}

		//if browser do not support transitions -> no need to wait for the end of it
		this.animationFallback();
	};

	ScheduleTemplate.prototype.checkEventModal = function (modalOpen) {
		// this function is used on resize to reset events/modal style
		this.animating = true;
		var self = this;
		var mq = this.mq();
		if (mq == 'mobile') {
			//reset modal style on mobile
			self.modal.removeAttribute('style');
			self.modalBody.removeAttribute('style');
			self.modalHeader.removeAttribute('style');
			self.modalHeaderBg.removeAttribute('style');
			self.modalBodyBg.removeAttribute('style');
			Util.removeClass(self.modal, 'cd-schedule-modal--no-transition');
			self.animating = false;
		} else if (mq == 'desktop' && modalOpen) {
			Util.addClass(self.modal, 'cd-schedule-modal--no-transition cd-schedule-modal--animation-completed');
			var item = self.element.getElementsByClassName('cd-schedule__event--selected')[0],
				target = item.getElementsByTagName('a')[0];

			var eventPosition = target.getBoundingClientRect(),
				eventTop = eventPosition.top,
				eventLeft = eventPosition.left,
				eventHeight = target.offsetHeight,
				eventWidth = target.offsetWidth;

			var windowWidth = window.innerWidth,
				windowHeight = window.innerHeight;

			var modalWidth = (windowWidth * .8 > self.modalMaxWidth) ? self.modalMaxWidth : windowWidth * .8,
				modalHeight = (windowHeight * .8 > self.modalMaxHeight) ? self.modalMaxHeight : windowHeight * .8;

			var HeaderBgScaleY = modalHeight / eventHeight,
				BodyBgScaleX = (modalWidth - eventWidth);


			setTimeout(function () {
				self.modal.setAttribute('style', 'top:' + (windowHeight / 2 - modalHeight / 2) + 'px;left:' + (windowWidth / 2 - modalWidth / 2) + 'px;height:' + modalHeight + 'px;width:' + modalWidth + 'px;transform: translateY(0) translateX(0)');
				//change modal modalBodyBg height/width
				self.modalBodyBg.style.height = modalHeight + 'px'; self.modalBodyBg.style.transform = 'scaleY(1) scaleX(' + BodyBgScaleX + ')'; self.modalBodyBg.style.width = '1px';
				//set modalHeader width
				self.modalHeader.setAttribute('style', 'width:' + eventWidth + 'px');
				//set modalBody left margin
				self.modalBody.setAttribute('style', 'margin-left:' + eventWidth + 'px');
				//change modal modalHeaderBg height/width and scale it
				self.modalHeaderBg.setAttribute('style', 'height: ' + eventHeight + 'px;width:' + eventWidth + 'px; transform:scaleY(' + HeaderBgScaleY + ');');
			}, 10);

			setTimeout(function () {
				Util.removeClass(self.modal, 'cd-schedule-modal--no-transition');
				self.animating = false;
			}, 20);

		}
	};

	ScheduleTemplate.prototype.loadEventContent = function (content) {
		// load the content of an event when user selects it
		var self = this;

		httpRequest = new XMLHttpRequest();
		httpRequest.onreadystatechange = function () {
			if (httpRequest.readyState === XMLHttpRequest.DONE) {
				if (httpRequest.status === 200) {
					self.modal.getElementsByClassName('cd-schedule-modal__event-info')[0].innerHTML = self.getEventContent(httpRequest.responseText);
					Util.addClass(self.modal, 'cd-schedule-modal--content-loaded');
				}
			}
		};
		httpRequest.open('GET', content + '.html');
		httpRequest.send();
	};

	ScheduleTemplate.prototype.getEventContent = function (string) {
		// reset the loaded event content so that it can be inserted in the modal
		var div = document.createElement('div');
		div.innerHTML = string.trim();
		return div.getElementsByClassName('cd-schedule-modal__event-info')[0].innerHTML;
	};

	ScheduleTemplate.prototype.animationFallback = function () {
		if (!this.supportAnimation) { // fallback for browsers not supporting transitions
			var event = new CustomEvent('transitionend');
			self.modal.dispatchEvent(event);
			self.modalHeaderBg.dispatchEvent(event);
		}
	};

	ScheduleTemplate.prototype.mq = function () {
		//get MQ value ('desktop' or 'mobile') 
		var self = this;
		return window.getComputedStyle(this.element, '::before').getPropertyValue('content').replace(/'|"/g, "");
	};

	function getScheduleTimestamp(time) {
		//accepts hh:mm format - convert hh:mm to timestamp
		time = time.replace(/ /g, '');
		var timeArray = time.split(':');
		var timeStamp = parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
		return timeStamp;
	};

	var scheduleTemplate = document.getElementsByClassName('js-cd-schedule'),
		scheduleTemplateArray = [],
		resizing = false;
	if (scheduleTemplate.length > 0) { // init ScheduleTemplate objects
		for (var i = 0; i < scheduleTemplate.length; i++) {
			(function (i) {
				scheduleTemplateArray.push(new ScheduleTemplate(scheduleTemplate[i]));
			})(i);
		}

		window.addEventListener('resize', function (event) {
			// on resize - update events position and modal position (if open)
			if (!resizing) {
				resizing = true;
				(!window.requestAnimationFrame) ? setTimeout(checkResize, 250) : window.requestAnimationFrame(checkResize);
			}
		});

		window.addEventListener('keyup', function (event) {
			// close event modal when pressing escape key
			if (event.keyCode && event.keyCode == 27 || event.key && event.key.toLowerCase() == 'escape') {
				for (var i = 0; i < scheduleTemplateArray.length; i++) {
					scheduleTemplateArray[i].closeModal();
				}
			}
		});

		function checkResize() {
			for (var i = 0; i < scheduleTemplateArray.length; i++) {
				scheduleTemplateArray[i].scheduleReset();
			}
			resizing = false;
		};
	}
	function customResize() {


		if (document.getElementById("not_correct-1") != null) {
			document.getElementById("not_correct-1").style.height = "160px";
		}
		if (document.getElementById("not_correct-1-1") != null) {
			document.getElementById("not_correct-1-1").style.height = "200px";
		}
		if (document.getElementById("not_correct-2") != null) {
			document.getElementById("not_correct-2").style.height = "110px";
		}
		if (document.getElementById("not_correct-3") != null) {
			document.getElementById("not_correct-3").style.height = "250px";
		}
		if (document.getElementById("not_correct-4") != null) {
			document.getElementById("not_correct-4").style.height = "150px";
			document.getElementById("not_correct-4").style.top = "920px";
		}
		if (document.getElementById("not_correct-5") != null) {
			document.getElementById("not_correct-5").style.height = "250px";
		}
		if (document.getElementById("not_correct-6") != null) {
			document.getElementById("not_correct-6").style.height = "185px";
		}
		if (document.getElementById("not_correct-7") != null) {
			document.getElementById("not_correct-7").style.height = "213px";
		}
		if (document.getElementById("not_correct-8") != null) {
			document.getElementById("not_correct-8").style.top = "1550px";
			document.getElementById("not_correct-8").style.height = "230px";
		}
		if (document.getElementById("not_correct-9") != null) {
			document.getElementById("not_correct-9").style.top = "60px";
			document.getElementById("not_correct-9").style.height = "75px";
		}
		if (document.getElementById("not_correct-10") != null) {
			document.getElementById("not_correct-10").style.top = "586px";
			document.getElementById("not_correct-10").style.height = "80px";
		}
		if (document.getElementById("not_correct-11") != null) {
			document.getElementById("not_correct-11").style.top = "1431px";
			document.getElementById("not_correct-11").style.height = "80px";
		}
		if (document.getElementById("not_correct-12") != null) {
			document.getElementById("not_correct-12").style.top = "1510px";
			document.getElementById("not_correct-12").style.height = "80px";
		}
		if (document.getElementById("not_correct-13") != null) {
			document.getElementById("not_correct-13").style.top = "1588px";
			document.getElementById("not_correct-13").style.height = "80px";
		}
		if (document.getElementById("not_correct-14") != null) {
			document.getElementById("not_correct-14").style.top = "1668px";
			document.getElementById("not_correct-14").style.height = "80px";
		}
		if (document.getElementById("not_correct-15") != null) {
			document.getElementById("not_correct-15").style.top = "1747px";
			document.getElementById("not_correct-15").style.height = "80px";
		}
		if (document.getElementById("not_correct-16") != null) {
			document.getElementById("not_correct-16").style.top = "1749px";
			document.getElementById("not_correct-16").style.height = "80px";
		}
		if (document.getElementById("not_correct-17") != null) {
			document.getElementById("not_correct-17").style.top = "1827px";
			document.getElementById("not_correct-17").style.height = "80px";
		}
		if (document.getElementById("not_correct-18") != null) {
			document.getElementById("not_correct-18").style.top = "1906px";
			document.getElementById("not_correct-18").style.height = "80px";
		}
		if (document.getElementById("not_correct-19") != null) {
			document.getElementById("not_correct-19").style.top = "1984px";
			document.getElementById("not_correct-19").style.height = "80px";
		}
		if (document.getElementById("not_correct-20") != null) {
			document.getElementById("not_correct-20").style.top = "455px";
			document.getElementById("not_correct-20").style.height = "240px";
		}
		if (document.getElementById("not_correct-21") != null) {
			document.getElementById("not_correct-21").style.top = "1765px";
			document.getElementById("not_correct-21").style.height = "235px";
		}
		if (document.getElementById("not_correct-22") != null) {
			document.getElementById("not_correct-22").style.top = "1363px";
			document.getElementById("not_correct-22").style.height = "180px";
		}
		if (document.getElementById("not_correct-23") != null) {
			document.getElementById("not_correct-23").style.top = "650px";
			document.getElementById("not_correct-23").style.height = "240px";
		}
		if (document.getElementById("not_correct-24") != null) {
			document.getElementById("not_correct-24").style.height = "185px";
		}
		if (document.getElementById("not_correct-25") != null) {
			document.getElementById("not_correct-25").style.top = "1075px";
			document.getElementById("not_correct-25").style.height = "240px";
		}
		if (document.getElementById("not_correct-26") != null) {
			document.getElementById("not_correct-26").style.height = "220px";
		}
	};
	var testmode = false;

	setInterval(function () {
		var minutesnow = new Date().getUTCMinutes()
		var hoursnow = new Date().getUTCHours() + 3 // hours in MSK(GMT+3)
		var timefrom = 8;
		var timeto = 19;

		if (hoursnow >= timefrom && hoursnow <= timeto) {
			var barposition = ((hoursnow - timefrom) * 200) + (200 / 60 * minutesnow) + 100;
			if (document.getElementById("timelinenow") != null) {
				document.getElementById("timelinenow").style.top = barposition + "px";
				document.getElementById("timelinenow").style.visibility = "visible";
			}
		}
		else {
			if (document.getElementById("timelinenow") != null) {
				document.getElementById("timelinenow").style.visibility = "hidden";
			}
		}

		if (testmode) {
			console.log("hey");
			console.log(moscowtime);
			console.log(minutesnow);
			console.log(barposition)
		}
		scheduleTemplateArray[0].initSchedule();
		customResize();
	}, 1000);


}());
