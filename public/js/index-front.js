$(document).ready(() => {
    if ($('.alert-danger').length) {
        console.log('invalid');
        const loginModal = $('#loginModal');
        loginModal.removeClass('fade');
        loginModal.modal('show');
    }
})