$(document).ready(() => {
    if ($('#verified').length) {
        $('#verified').modal('show');
    }
})

$('#closeLoginButton').click(() => {
    $('#loginModal').hide();
    //$('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
    console.log('test');
})

if ($('.alert-danger').length) {
    //$('#loginModal').removeClass('fade');
    $('#loginModal').addClass('fade');
    $('#loginModal').modal('show');
}

grecaptcha.ready(() => {
    grecaptcha.execute('6LeG9PMbAAAAAE_RAFIQCVUJduCejHXA8C00wqXN', {action: 'demo'})
        .then((token) => {
            $('#waitingList').submit((e) => {
                e.preventDefault();

                const data = {
                    email: $('#waitingListEmail').val(),
                    token: token
                }

                $.ajax({
                    url: '/waitinglist',
                    method: 'POST',
                    data: data,
                    beforeSend: () => {
                        if ($('#waitingListAlreadyExists').length) {
                            $('#waitingListAlreadyExists').remove();
                        }
                    }
                }).done((data) => {
                    if (data === 'success') {
                        $('#joinWaitingList').remove();
                        const success = document.createElement('div');
                        success.className = 'alert alert-success';
                        success.textContent = "Thanks! Check your email to confirm your placement onto the waiting list."
                        success.id = 'waitingListSuccess';
                        $('#mainContent').append(success);
                        $('#waitingListEmail').attr('disabled', 'true');
                        $('.form-check-input').attr('disabled', 'true');
                    } else if (data === 'exists') {
                        const error = document.createElement('div');
                        error.className = 'alert alert-danger';
                        error.textContent = 'You have already signed up for the waiting list';
                        error.id = 'waitingListAlreadyExists';
                        $('#mainContent').append(error);
                    } else {
                        const error = document.createElement('div');
                        error.className = 'alert alert-danger';
                        error.textContent = 'reCaptcha failed, please try again';
                        error.id = 'waitingListAlreadyExists';
                        $('#mainContent').append(error);
                    }
                })
            });
        })
})