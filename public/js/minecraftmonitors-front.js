$.get('http://192.168.1.251/api/query/hwgilbert16@gmail.com', ((data) => {
    for (const row of data) {
        const monitor = document.createElement('tr');
        const name = document.createElement('td');
        name.textContent = row.name;
        monitor.append(name);
        $('tbody').append(monitor);
    }
}));

$('#addMonitorForm').submit((e) => {
    e.preventDefault();

    const monitorName = $('#minecraftMonitorName').val();
    $('#addMonitorFormSubmit').attr('hidden', 'true');
    $('#ipAddress').attr('disabled', 'true');
    $('#minecraftMonitorName').attr('disabled', 'true');

    $('.alert-secondary').remove();
    $('#receivedAnalytics').remove();
    $('#alreadyExists').remove();
    $('#downloadMessage').remove();

    const downloadMessage = document.createElement('p');
    downloadMessage.textContent = 'Download and install the monitoring plugin from here, and install it into your plugins folder. Once installed, reboot your server. We will detect once we have received analytics below.';
    downloadMessage.id = "downloadMessage";

    const analyticsChecker = document.createElement('div');
    analyticsChecker.className = "alert alert-secondary text-center";
    analyticsChecker.id = 'analyticsChecker';
    const analyticsCheckerSpinner = document.createElement('span');
    analyticsCheckerSpinner.className = 'spinner-border';
    const analyticsCheckerMessage = document.createElement('p');
    analyticsCheckerMessage.textContent = 'Waiting for analytics...';

    $('.mb-3.ip-address').append(downloadMessage, analyticsChecker);
    $('.alert-secondary').append(analyticsCheckerSpinner, analyticsCheckerMessage);

    function getCookie(name) {
        let cookieArr = document.cookie.split(";");

        for (let i = 0; i < cookieArr.length; i++) {
            let cookiePair = cookieArr[i].split("=");

            if(name == cookiePair[0].trim()) {
                return decodeURIComponent(cookiePair[1]);
            }
        }

        return null;
    }

    const interval = setInterval(() => {
        $.post('http://192.168.1.251/api/create', {ip: $('#ipAddress').val(), email: getCookie('email'), name: $('#minecraftMonitorName').val()}, (data) => {
            if (data === 'exists') {
                const alreadyExists = document.createElement('div');
                alreadyExists.className = 'alert alert-danger';
                alreadyExists.id = 'alreadyExists';
                alreadyExists.textContent = 'The monitor belonging to this IP address is already owned by you or somebody else';

                $('.mb-3.ip-address').append(alreadyExists);
                $('#analyticsChecker').remove();

                $('#minecraftMonitorName').removeAttr('disabled');
                $('#ipAddress').removeAttr('disabled');
                $('#addMonitorFormSubmit').removeAttr('hidden');

                clearInterval(interval);
            }

            if (data === 'true') {
                $('.alert-secondary').remove();

                const receivedAnalytics = document.createElement('div');
                receivedAnalytics.className = 'alert alert-success text-center';
                receivedAnalytics.id = 'receivedAnalytics';
                const analyticsReceivedCheck = document.createElement('span');
                analyticsReceivedCheck.className = 'bi bi-check-lg';

                const viewMonitor = document.createElement('button');
                viewMonitor.className = 'btn btn-primary';
                viewMonitor.textContent = 'View your Monitors';
                viewMonitor.setAttribute('data-bs-dismiss', 'modal');

                $('.mb-3.ip-address').append(receivedAnalytics, viewMonitor);
                $('.alert-success').append(analyticsReceivedCheck);

                clearInterval(interval);
            }
        })
    }, 2500);

});

$('#addMonitorModal').on('show.bs.modal', () => {
    window.onbeforeunload = () => {
        return true;
    }
});

$('#addMonitorModal').on('hidden.bs.modal', () => {
    $('#minecraftMonitorName').val('');
    $('#ipAddress').val('');
    $('#addMonitorFormSubmit').removeAttr('hidden');
    $('#minecraftMonitorName').removeAttr('disabled');
    $('#ipAddress').removeAttr('disabled');
    $('#downloadMessage').remove();

    $('.alert-secondary').remove();
    $('#receivedAnalytics').remove();
    $('#alreadyExists').remove();

    // if ($('#analyticsChecker').length) {
    //     $('.alert-secondary').remove();
    // }
    //
    // if ($('#receivedAnalytics').length) {
    //     $('.alert-success').remove();
    // }
    //
    // if ($('#alreadyExists').length) {
    //     $('#alreadyExists').remove();
    // }

    if (typeof interval !== 'undefined') {
        clearInterval(interval);
    }

    window.onbeforeunload = null;
});