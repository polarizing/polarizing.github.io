
// document.getElementById("bgAudio").volume = 0.075;

// media query event handler
// if (matchMedia) {
//   var mq = window.matchMedia("(max-width: 768px)");
//   mq.addListener(WidthChange);
//   WidthChange(mq);
// }

// // media query change
// function WidthChange(mq) {
//   if (mq.matches) {
//     // window width is at least 768px
//         console.log('less than 768')

//   } else {
//     // window width is more than 768px
//     console.log('more than 768')
//   }
// }


var currentDrawerId = -1;
var currentDrawer = undefined;
var currentProjectId = -1;
var currentProject = undefined;
var currentProjectDetail = undefined;

$(document).click(function(event) { 
    if(!$(event.target).closest('.strip').length) {
    	if (currentDrawer) {
			$(currentDrawer).slideUp(500, function() {
				// $('html, body').animate({
			 //        scrollTop: $(clickedProject).offset().top - 10
			 //    }, 1000);
				// $(newDrawer).slideDown(500);
			})
		} 
		$(".project").each(function() {
			var project = this;
			$(project).fadeTo(500, 1.0, function() {})
			$(project).find("img").css("filter", "grayscale(100%)");
		})

		currentDrawerId = -1;
		currentDrawer = undefined;
		currentProjectId = -1;
		currentProject = undefined;
		currentProjectDetail = undefined;
    }        
})

$(".project").each(function () {
    var project = this;
    // console.log('hi');
    // xPos = drag.offsetWidth / 2;
  //   // yPos = drag.offsetHeight / 2;
    $(project).on('click', function() {
    	var windowWidth = $(window).width();
    	if (windowWidth <= 768) {
    		console.log('mobile');
			$(".project-row").fadeTo("fast", 0.25, function() {
  				// Animation complete.''
			});

			// $("body").addClass("prevent-scroll");
    	}

    	var drawerId = $(project).data("drawer");
    	var projectId = $(project).data("id");
    	var clickedProject = this;
        $(project).find("img").css("filter", "none");
        
    	// Check if clicked on different project.
    	if (currentProjectId !== projectId) {
    		// Swap project detail.
    		if (currentProjectDetail) {
    			$(currentProjectDetail).hide();
                $(currentProject).find("img").css("filter", "grayscale(100%)");
    		}

    		$(".project-detail").each(function() {
	    		var projectDetail = this;
	    		var projectDetailId = $(this).data("id");
	    		if (projectDetailId === projectId) {
	    			$(projectDetail).show();
	    			currentProjectDetail = projectDetail;
	    		}
	    	})
    		currentProject = clickedProject;
	    	currentProjectId = projectId;

    	}

    	

    	if (currentDrawerId !== drawerId) {
			$(".drawer").each(function() {
	    		// $(this).slideUp(1000, function() {
	    		// 	$('html, body').animate({
				   //      scrollTop: $(clickedProject).offset().top - $(drawer)
				   //  }, 2000);
	    		// });
	    		var newDrawer = this;
	    		var id = $(newDrawer).data("id");
	    		// console.log(id);
	    		if (drawerId == id) {
	    			if (currentDrawer) {
	    				$(currentDrawer).slideUp(500, function() {
	    					$('html, body').animate({
						        scrollTop: $(clickedProject).offset().top - 10
						    }, 1000);
	    					$(newDrawer).slideDown(500);
	    				})
	    			} else {
	    				$('html, body').animate({
						        scrollTop: $(clickedProject).offset().top - 10
						    }, 1000);
	    				$(newDrawer).slideDown(500);
	    			}
	    			currentDrawer = newDrawer;
	    		}
	    	})

	    	currentDrawerId = drawerId;
    	}


		$( ".project" ).each(function() {
    		var project = this;
    		if (clickedProject === project) {
    			console.log('found');
    			$(project).fadeTo(500, 1.0, function() {})
    		} else {
    			$(project).fadeTo(500, 0.25, function() {})
    		}
    	})

    })

})