$(document).ready(() => {
    const page = window.location.pathname;
    switch (page) {
        case '/dashboard':
            const dashboardLi = $('a[href="/dashboard"]');
            dashboardLi.addClass('active');
            break;
        case '/dashboard/minecraftmonitors':
            const minecraftMonitorsLi = $('a[href="/dashboard/minecraftmonitors"]');
            minecraftMonitorsLi.addClass('active');
            break;
    }

    $('#submitReport').click((e) => {
        e.preventDefault();

        const errorReport = $('#describeError').val();

        $.ajaxSetup({
            beforeSend: () => {
                $('#submitReport').attr('hidden', 'true');
                $('#describeError').attr('disabled', true);
                const spinner = document.createElement('div');
                spinner.classList.add('spinner-border');
                spinner.setAttribute('role', 'status');
                $('.mb-3').append(spinner);
            },
            complete: () => {
                $('.spinner-border').remove();
                const complete = document.createElement('div');
                complete.classList.add('alert');
                complete.classList.add('alert-success');
                complete.id = "successAlert";
                complete.style = "margin-top: 1rem;"
                complete.textContent = 'Thanks for the report!';
                $('.mb-3').append(complete);
            }
        });

        $.post('/report', {errorReport}, () => {
            console.log('sent');
        })
    });

    const reportErrorModal = document.getElementById('reportErrorModal');
    reportErrorModal.addEventListener('hidden.bs.modal', () => {
        $('#describeError').val('');
        if ($('#successAlert').length) {
            $('#successAlert').remove();
        }
        $('#submitReport').removeAttr('hidden');
        $('#describeError').removeAttr('disabled');
    });
});

