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