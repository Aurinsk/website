$(document).ready(() => {

    $('#addMonitorForm').submit((e) => {
        e.preventDefault();

        const monitorName = $('#minecraftMonitorName').val();
        $('#addMonitorFormSubmit').attr('hidden', 'true');
        $('#ipAddress').attr('disabled', 'true');
        $('#minecraftMonitorName').attr('disabled', 'true');

        const downloadMessage = document.createElement('p');
        downloadMessage.textContent = 'Download and install the monitoring plugin from here, and install it into your plugins folder. Once installed, reboot your server. We will detect once we have received analytics below.';
        downloadMessage.id = "downloadMessage";

        const analyticsChecker = document.createElement('div');
        analyticsChecker.className = "alert alert-secondary text-center";
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
                if (data === 'true') {
                    $('.alert-secondary').remove();

                    const receivedAnalytics = document.createElement('div');
                    receivedAnalytics.className = 'alert alert-success text-center';
                    const analyticsReceivedCheck = document.createElement('span');
                    analyticsReceivedCheck.className = 'bi bi-check-lg';
                    $('.mb-3.ip-address').append(receivedAnalytics);
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

        if ($('.alert-secondary').length) {
            $('.alert-secondary').remove();
        }

        if ($('.alert-success').length) {
            $('.alert-success').remove();
        }

        if (typeof interval !== 'undefined') {
            clearInterval(interval);
        }

        window.onbeforeunload = null;
    });
});

function receiveAnalytics() {
    $('.alert-secondary').remove();

    const receivedAnalytics = document.createElement('div');
    receivedAnalytics.className = 'alert alert-success text-center';
    const analyticsReceivedCheck = document.createElement('span');
    analyticsReceivedCheck.className = 'bi bi-check-lg';
    $('.mb-3').append(receivedAnalytics);
    $('.alert-success').append(analyticsReceivedCheck);
}