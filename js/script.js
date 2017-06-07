
// document.getElementById("bgAudio").volume = 0.075;

var currentDrawerId = -1;
var currentDrawer = undefined;
var currentProjectId = -1;
var currentProject = undefined;
var currentProjectDetail = undefined;

$(".project").each(function () {
    var project = this;
    // console.log('hi');
    // xPos = drag.offsetWidth / 2;
  //   // yPos = drag.offsetHeight / 2;
    $(project).on('click', function() {
    	var drawerId = $(project).data("drawer");
    	var projectId = $(project).data("id");
    	var clickedProject = this;

    	// Check if clicked on different project.
    	if (currentProjectId !== projectId) {
    		// Swap project detail.
    		if (currentProjectDetail) {
    			$(currentProjectDetail).hide();
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
    	// console.log(drawer);
    	
    	// if (drawerId = 1) {

    	// }
    	// console.log('strip');
  //   	var clickedProject = this;
		// 	$('.drawer').slideDown(1000);

		// $( ".project" ).each(function() {
  //   		var project = this;
  //   		if (clickedProject === project) {
  //   			console.log('found');
  //   		} else {
  //   			$(project).fadeTo(1000, 0.25, function() {})
  //   		}
    		// project.animate({
    		// 	opacity: 0.25
    		// }, 5000, function() {

    		// })
    })

    // project.addEventListener("click", function() {
    //     event.preventDefault();
    //     // console.log("hi");
    //     var currProject = this;
    //     $('#drawer-1').slideDown(1000);
    //     // $(this).css({
    //     //   'left' : event.targetTouches[0].pageX - xPos + 'px', 
    //     //   'top' : event.targetTouches[0].pageY - yPos + 'px'
    //     // });
    // 	$( ".project" ).each(function() {
    // 		var project = this;
    // 		$(project).fadeTo(1000, 0.25, function() {})
    // 		// project.animate({
    // 		// 	opacity: 0.25
    // 		// }, 5000, function() {

    // 		// })
    // 	});
    		

    	// $('body').fadeTo(5000, 0.0, function() {})
    // });
})