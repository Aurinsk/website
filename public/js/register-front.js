$('form').on('submit', (e) => {
    e.preventDefault();

    if ($('#password').val() !== $('#confirmPassword').val()) {
        const alert = helper.createSetAttributes('div', {class: 'alert alert-danger', role: 'alert', textContent: 'Passwords must match'});

        if ($('.alert-danger').length) {
            $('.alert-danger').remove();
        }

        $('form').append(alert);

        return;
    }

    $('#confirmPassword').attr('disabled', 'true');
    document.forms['setPasswordForm'].submit();
});

const registrationKey = helper.createSetAttributes('input', {type: 'hidden', name: 'registrationKey', value: window.location.href.substring(window.location.href.lastIndexOf('/') + 1)});
$('form').prepend(registrationKey);