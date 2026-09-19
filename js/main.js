(function () {
    const AUTH_STORAGE_KEY = 'rentamax_token';

    function getAuthToken() {
        return localStorage.getItem(AUTH_STORAGE_KEY) || '';
    }

    function clearAuthSession() {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('rentamax_user');
    }

    function ensureAuthenticated() {
        const token = getAuthToken();
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        if (!token && currentPage !== 'index.html') {
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    function attachAuthHeaders(headers = {}) {
        const token = getAuthToken();
        const finalHeaders = new Headers(headers);

        if (token && !finalHeaders.has('Authorization')) {
            finalHeaders.set('Authorization', `Token ${token}`);
        }

        return finalHeaders;
    }

    window.RentamaxAuth = {
        getAuthToken,
        clearAuthSession,
        ensureAuthenticated,
        attachAuthHeaders
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = function (url, options = {}) {
        const finalOptions = { ...options };
        finalOptions.headers = attachAuthHeaders(finalOptions.headers || {});

        return originalFetch(url, finalOptions);
    };

    document.addEventListener('DOMContentLoaded', function () {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        if (currentPage !== 'index.html' && !getAuthToken()) {
            window.location.href = 'index.html';
            return;
        }

        const logoutButtons = document.querySelectorAll('.btn-exit-system, .logout-button');
        logoutButtons.forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                clearAuthSession();
                window.location.href = 'index.html';
            });
        });
    });
})();

$(document).ready(function(){

	/*  Show/Hidden Submenus */
	$('.nav-btn-submenu').on('click', function(e){
		e.preventDefault();
		var SubMenu=$(this).next('ul');
		var iconBtn=$(this).children('.fa-chevron-down');
		if(SubMenu.hasClass('show-nav-lateral-submenu')){
			$(this).removeClass('active');
			iconBtn.removeClass('fa-rotate-180');
			SubMenu.removeClass('show-nav-lateral-submenu');
		}else{
			$(this).addClass('active');
			iconBtn.addClass('fa-rotate-180');
			SubMenu.addClass('show-nav-lateral-submenu');
		}
	});

	/*  Show/Hidden Nav Lateral */
	$('.show-nav-lateral').on('click', function(e){
		e.preventDefault();
		var NavLateral=$('.nav-lateral');
		var PageConten=$('.page-content');
		if(NavLateral.hasClass('active')){
			NavLateral.removeClass('active');
			PageConten.removeClass('active');
		}else{
			NavLateral.addClass('active');
			PageConten.addClass('active');
		}
	});

	/*  Exit system buttom */
	$('.btn-exit-system').on('click', function(e){
		e.preventDefault();
		Swal.fire({
			title: 'Are you sure to close the session?',
			text: "You are about to close the session and exit the system",
			type: 'question',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, exit!',
			cancelButtonText: 'No, cancel'
		}).then((result) => {
			if (result.value) {
				localStorage.removeItem('rentamax_token');
				localStorage.removeItem('rentamax_user');
				window.location="index.html";
			}
		});
	});
});
(function($){
    $(window).on("load",function(){
        $(".nav-lateral-content").mCustomScrollbar({
        	theme:"light-thin",
        	scrollbarPosition: "inside",
        	autoHideScrollbar: true,
        	scrollButtons: {enable: true}
        });
        $(".page-content").mCustomScrollbar({
        	theme:"dark-thin",
        	scrollbarPosition: "inside",
        	autoHideScrollbar: true,
        	scrollButtons: {enable: true}
        });
    });
})(jQuery);