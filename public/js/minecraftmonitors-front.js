let cpuTimeout;
let memoryTimeout;
let playercountTimeout;
let reorderGraphsTimeout;

// get cookie by name
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

// pass authorization header on every request
$.ajaxSetup({
    beforeSend: (xhr) => {
        xhr.setRequestHeader('Authorization', getCookie('user'));
    }
})

$.get('http://192.168.1.251:3000/api/query/hwgilbert16@gmail.com', ((data) => {
    // loop through all of the rows returned from api
    for (const row of data) {
        // create table row
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        const name = document.createElement('span');
        const escapedRowName = row.name.replace(/\s+/g, '-').toLowerCase();
        name.textContent = row.name;
        name.className = 'monitor-button';

        // event listener on monitor name in graph
        name.addEventListener('click', () => {
            // create modal with bootbox
            bootbox.dialog({
                title: row.name,
                closeButton: false,
                message: 'Time is shown in UTC',
                size: 'large',
                onEscape: true,
                backdrop: true,
                className: escapedRowName,
                id: escapedRowName,
                onHidden: () => {
                    // clear all of the 1 min get requests to api for graph data
                    if (!isNaN(cpuTimeout) && !isNaN(memoryTimeout) && !isNaN(playercountTimeout)) {
                        clearTimeout(cpuTimeout);
                        clearTimeout(memoryTimeout);
                        clearTimeout(playercountTimeout);
                    }
                }
            });

            // replace the close button in the modal since bootbox's one is broken
            const closeButton = document.createElement('button');
            closeButton.className = 'btn-close';
            closeButton.setAttribute('data-bs-dismiss', 'modal');
            $(`.${escapedRowName} .modal-header`).append(closeButton);
            $(`.${escapedRowName}`).attr('id', escapedRowName);

            // create refresh button and click handler

            const refreshMonitorButton = document.createElement('button');
            refreshMonitorButton.className = 'btn btn-primary refresh-monitor';
            refreshMonitorButton.textContent = 'Refresh Monitors';

            $(`.${escapedRowName} .modal-body`).append(refreshMonitorButton);

            $('.refresh-monitor').click(() => {
                $('.refresh-monitor').attr('disabled', 'true');

                // remove existing graphs
                $('canvas#cpu').remove();
                $('canvas#memory').remove();
                $('canvas#playercount').remove();

                // clear timeouts of existing graphs
                clearTimeout(cpuTimeout);
                clearTimeout(memoryTimeout);
                clearTimeout(playercountTimeout);

                // create new graphs
                cpuGraph();
                memoryGraph();
                playercountGraph();

                // remove disabled button attribute
                $('span.spinner-border').remove();
                $('.refresh-monitor').removeAttr('disabled');

            })

            // create divs to order graphs
            const cpuContainer = document.createElement('div');
            cpuContainer.setAttribute('id', 'cpuContainer');
            const memoryContainer = document.createElement('div');
            memoryContainer.setAttribute('id', 'memoryContainer');
            const playercountContainer = document.createElement('div');
            playercountContainer.setAttribute('id', 'playercountContainer');

            $(`.${escapedRowName} .modal-body`).append(cpuContainer, memoryContainer, playercountContainer);

            function cpuGraph() {
                $.get(`http://192.168.1.251:3000/api/query/${row.uuid}/cpu_usage/1h`, ((data) => {

                    // if the canvas already exists, remove it, and recreate it
                    // used for refreshing the graphs every minute
                    if ($('canvas#cpu').length) {
                        $('canvas#cpu').remove();
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('id', 'cpu');
                        canvas.className = escapedRowName;
                        $('#cpuContainer').append(canvas);
                    } else {
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('id', 'cpu');
                        canvas.className = escapedRowName;
                        $('#cpuContainer').append(canvas);
                    }

                    // get current time in hh:mm
                    let currentTime = new Date().toLocaleTimeString('en', {
                        timeStyle: 'short',
                        hour12: false,
                        timeZone: 'UTC'
                    })

                    // get the most recent time by analytics
                    let recentAnalyticsTime = new Date(data[1][data[1].length - 1]).toLocaleTimeString('en', {
                        timeStyle: 'short',
                        hour12: false,
                        timeZone: 'UTC'
                    });

                    // add null to the data[1] array for any empty values
                    if (currentTime !== recentAnalyticsTime) {
                        const dateTimeNow = new Date();
                        const dateAnalyticsTime = new Date(data[1][data[1].length - 1]);

                        const minutesDifference = Math.floor((dateTimeNow.getTime() - dateAnalyticsTime.getTime()) / 1000 / 60);

                        for (let i = 1; i <= minutesDifference; i++) {
                            //data[1].push(dateTimeNow.setMinutes(dateTimeNow.getMinutes() + 1));
                            dateAnalyticsTime.setMinutes(dateAnalyticsTime.getMinutes() + 1);
                            data[1].push(dateAnalyticsTime.toISOString());
                            data[0].push(null);
                        }
                    }

                    // iterate over data[1] to check if the difference between any two values is > 1 minute
                    for (let i = 0; i < data[1].length - 1; i++) {
                        let time1 = new Date(data[1][i]);
                        time1.setSeconds(0, 0);
                        let time2 = new Date(data[1][i + 1]);
                        time2.setSeconds(0, 0);

                        const position = i;

                        let correctTime2 = new Date(data[1][i]);
                        correctTime2.setMinutes(time1.getMinutes() + 1);
                        correctTime2.setSeconds(0, 0);

                        // need to check if time2 does not equal time1 + 1 minute (correctTime2)
                        // need to check if the second value does not equal the first time + 1 minute
                        if (time2.toISOString() !== correctTime2.toISOString()) {
                            const minutesDifference = Math.floor((time2.getTime() - time1.getTime()) / 1000 / 60);

                            for (let i = 1; i <= minutesDifference; i++) {
                                time1.setMinutes(time1.getMinutes() + 1);
                                if (time1.toISOString() === time2.toISOString()) {
                                    break;
                                }
                                data[1].splice(position + i, 0, time1.toISOString());
                                data[0].splice(position + i, 0, null);
                            }
                        }
                    }

                    // convert iso time to human readable format
                    for (let i = 0; i < data[1].length; i++) {
                        data[1][i] = new Date(data[1][i]).toLocaleTimeString('en', {
                            timeStyle: 'short',
                            hour12: false,
                            timeZone: 'UTC'
                        });
                    }

                    // create chartjs chart
                    const chart = new Chart($(`canvas#cpu`), {
                        type: 'line',
                        data: {
                            labels: data[1],
                            datasets: [{
                                label: 'CPU Usage',
                                backgroundColor: 'rgb(67, 160, 231, 0.1)',
                                borderColor: 'rgb(67, 160, 231)',
                                data: data[0],
                                pointRadius: 1,
                                fill: true,
                                spanGaps: false,
                                displayLine: true
                            }]
                        },
                        options: {
                            // allow to hover over graph and still get point tooltip
                            interaction: {
                                intersect: false,
                                mode: 'index',
                            },
                            scales: {
                                y: {
                                    ticks: {
                                        // Include a percentage sign in the y axis ticks
                                        callback: function(value, index, values) {
                                            return (value * 100).toString() + "%";
                                        }
                                    },
                                    beginAtZero: true,
                                    max: 1
                                },
                                x: {
                                    // put the minimum of x to the current time
                                    suggestedMin: new Date().toLocaleTimeString('en', {
                                        timeStyle: 'short',
                                        hour12: false,
                                        timeZone: 'UTC'
                                    })
                                }
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        // add a percentage to the number when using the tooltip
                                        label: function(tooltipItem, data) {
                                            return (tooltipItem.raw * 100).toString() + "%";
                                        },
                                    }
                                },
                                // display title of graph
                                title: {
                                    display: true,
                                    text: 'CPU Usage',
                                    font: {
                                        size: 24
                                    }
                                },
                                legend: {
                                    display: false
                                }
                            }

                        }
                    });

                    cpuTimeout = setTimeout(cpuGraph, 60000);
                }))
            }

            function memoryGraph() {
                $.get(`http://192.168.1.251:3000/api/query/${row.uuid}/memory_usage/1h`, ((data) => {

                    if ($('canvas#memory').length) {
                        $('canvas#memory').remove();
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('id', 'memory');
                        canvas.className = escapedRowName;
                        $('#memoryContainer').append(canvas);
                    } else {
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('id', 'memory');
                        canvas.className = escapedRowName;
                        $('#memoryContainer').append(canvas);
                    }

                    // get current time in hh:mm
                    let currentTime = new Date().toLocaleTimeString('en', {
                        timeStyle: 'short',
                        hour12: false,
                        timeZone: 'UTC'
                    })

                    // get the most recent time by analytics
                    let recentAnalyticsTime = new Date(data[1][data[1].length - 1]).toLocaleTimeString('en', {
                        timeStyle: 'short',
                        hour12: false,
                        timeZone: 'UTC'
                    });

                    // add null to the data[1] array for any empty values
                    if (currentTime !== recentAnalyticsTime) {
                        const dateTimeNow = new Date();
                        const dateAnalyticsTime = new Date(data[1][data[1].length - 1]);

                        const minutesDifference = Math.floor((dateTimeNow.getTime() - dateAnalyticsTime.getTime()) / 1000 / 60);

                        for (let i = 1; i <= minutesDifference; i++) {
                            //data[1].push(dateTimeNow.setMinutes(dateTimeNow.getMinutes() + 1));
                            dateAnalyticsTime.setMinutes(dateAnalyticsTime.getMinutes() + 1);
                            data[1].push(dateAnalyticsTime.toISOString());
                            data[0].push(null);
                        }
                    }

                    // iterate over data[1] to check if the difference between any two values is > 1 minute
                    for (let i = 0; i < data[1].length - 1; i++) {
                        let time1 = new Date(data[1][i]);
                        time1.setSeconds(0, 0);
                        let time2 = new Date(data[1][i + 1]);
                        time2.setSeconds(0, 0);

                        const position = i;

                        let correctTime2 = new Date(data[1][i]);
                        correctTime2.setMinutes(time1.getMinutes() + 1);
                        correctTime2.setSeconds(0, 0);

                        // need to check if time2 does not equal time1 + 1 minute (correctTime2)
                        // need to check if the second value does not equal the first time + 1 minute
                        if (time2.toISOString() !== correctTime2.toISOString()) {
                            const minutesDifference = Math.floor((time2.getTime() - time1.getTime()) / 1000 / 60);

                            for (let i = 1; i <= minutesDifference; i++) {
                                time1.setMinutes(time1.getMinutes() + 1);
                                if (time1.toISOString() === time2.toISOString()) {
                                    break;
                                }
                                data[1].splice(position + i, 0, time1.toISOString());
                                data[0].splice(position + i, 0, null);
                            }
                        }
                    }

                    for (let i = 0; i < data[1].length; i++) {
                        data[1][i] = new Date(data[1][i]).toLocaleTimeString('en', {
                            timeStyle: 'short',
                            hour12: false,
                            timeZone: 'UTC'
                        });
                    }

                    const chart = new Chart($('canvas#memory'), {
                        type: 'line',
                        data: {
                            labels: data[1],
                            datasets: [{
                                label: 'Memory Usage',
                                backgroundColor: 'rgb(255, 183, 43, 0.1)',
                                borderColor: 'rgb(255, 183, 43)',
                                data: data[0],
                                pointRadius: 1,
                                fill: true,
                                spanGaps: false
                            }]
                        },
                        options: {
                            interaction: {
                                intersect: false,
                                mode: 'index',
                            },
                            scales: {
                                y: {
                                    ticks: {
                                        // Include a percentage sign in the y axis ticks
                                        callback: function(value, index, values) {
                                            return (value / 1000).toString() + "GB";
                                        }
                                    },
                                    beginAtZero: true
                                },
                                x: {
                                    suggestedMin: new Date().toLocaleTimeString('en', {
                                        timeStyle: 'short',
                                        hour12: false,
                                        timeZone: 'UTC'
                                    })
                                }
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: function(tooltipItem, data) {
                                            // convert kb to gb
                                            return (tooltipItem.raw / 1000).toFixed(3) + "GB";
                                        },
                                    }
                                },
                                title: {
                                    display: true,
                                    text: 'Memory Usage',
                                    font: {
                                        size: 24
                                    }
                                },
                                legend: {
                                    display: false
                                }
                            }

                        }
                    });

                    memoryTimeout = setTimeout(memoryGraph, 60000);
                }))
            }

            function playercountGraph() {
                $.get(`http://192.168.1.251:3000/api/query/${row.uuid}/player_count/1h`, ((data) => {

                    if ($('canvas#playercount').length) {
                        $('canvas#playercount').remove();
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('id', 'playercount');
                        canvas.className = escapedRowName;
                        $('#playercountContainer').append(canvas);
                    } else {
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('id', 'playercount');
                        canvas.className = escapedRowName;
                        $('#playercountContainer').append(canvas);
                    }

                    // get current time in hh:mm
                    let currentTime = new Date().toLocaleTimeString('en', {
                        timeStyle: 'short',
                        hour12: false,
                        timeZone: 'UTC'
                    })

                    // get the most recent time by analytics
                    let recentAnalyticsTime = new Date(data[1][data[1].length - 1]).toLocaleTimeString('en', {
                        timeStyle: 'short',
                        hour12: false,
                        timeZone: 'UTC'
                    });

                    // add null to the data[1] array for any empty values
                    if (currentTime !== recentAnalyticsTime) {
                        const dateTimeNow = new Date();
                        const dateAnalyticsTime = new Date(data[1][data[1].length - 1]);

                        const minutesDifference = Math.floor((dateTimeNow.getTime() - dateAnalyticsTime.getTime()) / 1000 / 60);

                        for (let i = 1; i <= minutesDifference; i++) {
                            //data[1].push(dateTimeNow.setMinutes(dateTimeNow.getMinutes() + 1));
                            dateAnalyticsTime.setMinutes(dateAnalyticsTime.getMinutes() + 1);
                            data[1].push(dateAnalyticsTime.toISOString());
                            data[0].push(null);
                        }
                    }

                    // iterate over data[1] to check if the difference between any two values is > 1 minute
                    for (let i = 0; i < data[1].length - 1; i++) {
                        let time1 = new Date(data[1][i]);
                        time1.setSeconds(0, 0);
                        let time2 = new Date(data[1][i + 1]);
                        time2.setSeconds(0, 0);

                        const position = i;

                        let correctTime2 = new Date(data[1][i]);
                        correctTime2.setMinutes(time1.getMinutes() + 1);
                        correctTime2.setSeconds(0, 0);

                        // need to check if time2 does not equal time1 + 1 minute (correctTime2)
                        // need to check if the second value does not equal the first time + 1 minute
                        if (time2.toISOString() !== correctTime2.toISOString()) {
                            const minutesDifference = Math.floor((time2.getTime() - time1.getTime()) / 1000 / 60);

                            for (let i = 1; i <= minutesDifference; i++) {
                                time1.setMinutes(time1.getMinutes() + 1);
                                if (time1.toISOString() === time2.toISOString()) {
                                    break;
                                }
                                data[1].splice(position + i, 0, time1.toISOString());
                                data[0].splice(position + i, 0, null);
                            }
                        }
                    }

                    for (let i = 0; i < data[1].length; i++) {
                        data[1][i] = new Date(data[1][i]).toLocaleTimeString('en', {
                            timeStyle: 'short',
                            hour12: false,
                            timeZone: 'UTC'
                        });
                    }

                    const chart = new Chart($('canvas#playercount'), {
                        type: 'line',
                        data: {
                            labels: data[1],
                            datasets: [{
                                label: 'Playercount',
                                backgroundColor: 'rgb(65, 255, 111, 0.1)',
                                borderColor: 'rgb(65, 255, 111)',
                                data: data[0],
                                pointRadius: 1,
                                fill: true,
                                spanGaps: false
                            }]
                        },
                        options: {
                            interaction: {
                                intersect: false,
                                mode: 'index',
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        // remove decimals in y axis
                                        precision: 0
                                    }
                                },
                                x: {
                                    suggestedMin: new Date().toLocaleTimeString('en', {
                                        timeStyle: 'short',
                                        hour12: false,
                                        timeZone: 'UTC'
                                    })
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Playercount',
                                    font: {
                                        size: 24
                                    }
                                },
                                legend: {
                                    display: false
                                }
                            }

                        }
                    });

                    playercountTimeout = setTimeout(playercountGraph, 60000);
                }))
            }

            // needed to reorder the graphs to be cpu -> memory -> playercount, top to bottom
            // $.when(cpuGraph(), memoryGraph(), playercountGraph()).done(() => {
            //     $('canvas#cpu').insertBefore($('canvas#memory'));
            //     $('canvas#playercount').appendTo('.modal-body');
            // })

            cpuGraph();
            memoryGraph();
            playercountGraph();

        });

        tr.append(td);
        td.append(name);
        $('tbody').append(tr);
    }
}));

$('#addMonitorForm').submit((e) => {
    e.preventDefault();

    const monitorName = $('#minecraftMonitorName').val();
    // hide the submit button, lock the ip address and name field
    $('#addMonitorFormSubmit').attr('hidden', 'true');
    $('#ipAddress').attr('disabled', 'true');
    $('#minecraftMonitorName').attr('disabled', 'true');

    // remove any of the success messages if they exist
    $('.alert-secondary').remove();
    $('#receivedAnalytics').remove();
    $('#alreadyExists').remove();
    $('#downloadMessage').remove();

    // add the download message
    const downloadMessage = document.createElement('p');
    downloadMessage.textContent = 'Download and install the monitoring plugin from here, and install it into your plugins folder. Once installed, reboot your server. We will detect once we have received analytics below.';
    downloadMessage.id = "downloadMessage";

    // add the alert spinner while checking for analytics from monitor
    const analyticsChecker = document.createElement('div');
    analyticsChecker.className = "alert alert-secondary text-center";
    analyticsChecker.id = 'analyticsChecker';
    const analyticsCheckerSpinner = document.createElement('span');
    analyticsCheckerSpinner.className = 'spinner-border';
    const analyticsCheckerMessage = document.createElement('p');
    analyticsCheckerMessage.textContent = 'Waiting for analytics...';

    // append the alert spinner
    $('.mb-3.ip-address').append(downloadMessage, analyticsChecker);
    $('.alert-secondary').append(analyticsCheckerSpinner, analyticsCheckerMessage);

    // check api every 2.5 seconds if analytics has been received for the entered ip address
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

// ask user if they're sure they want to leave when pressing the back arrow with the create monitor modal open
$('#addMonitorModal').on('show.bs.modal', () => {
    window.onbeforeunload = () => {
        return true;
    }
});

// reset entered information in the add monitor modal when closed
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

    if (typeof interval !== 'undefined') {
        clearInterval(interval);
    }

    window.onbeforeunload = null;
});