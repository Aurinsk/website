$(document).ready(() => {
    if ($('#verified').length) {
        $('#verified').modal('show');
    }
})

if ($('.alert-danger').length) {
    console.log('invalid');
    const loginModal = $('#loginModal');
    loginModal.removeClass('fade');
    loginModal.modal('show');
}

$('#waitingList').submit((e) => {
    e.preventDefault();

    const email = $('#waitingListEmail').val();
    $.ajaxSetup({
        beforeSend: () => {
            if ($('#waitingListAlreadyExists').length) {
                $('#waitingListAlreadyExists').remove();
            }
        },
        statusCode: {
            201: () => {
                $('#joinWaitingList').remove();
                const success = document.createElement('div');
                success.className = 'alert alert-success';
                success.textContent = "Thanks! Check your email to confirm your placement onto the waiting list."
                success.id = 'waitingListSuccess';
                $('#mainContent').append(success);
                $('#waitingListEmail').attr('disabled', 'true');
                $('.form-check-input').attr('disabled', 'true');
            },
            200: () => {
                const error = document.createElement('div');
                error.className = 'alert alert-danger';
                error.textContent = 'You have already signed up for the waiting list';
                error.id = 'waitingListAlreadyExists';
                $('#mainContent').append(error);
            }
        }
    });

    $.post('/waitinglist', {email});
});