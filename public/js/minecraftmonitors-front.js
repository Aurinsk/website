let cpuTimeout;
let memoryTimeout;
let playercountTimeout;
let tpsTimeout;
let checkForAnalyticsTimeout;
let statusAlertTimeout;
let mainTableTimeout;

const apiUrl = 'http://192.168.1.251:3000';

// get cookie by name
function getCookie(name) {
    let cookieArr = document.cookie.split(";");

    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");

        if (name == cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }

    return null;
}

// pass authorization header on every request
$.ajaxSetup({
    beforeSend: (xhr) => {
        xhr.setRequestHeader('Authorization', `Bearer ${getCookie('user')}`);
    }
});

$('#refreshMonitors').click(() => {
    mainTable();
});

function mainTable() {
    $.get(`${apiUrl}/query/monitors/${getCookie('email')}`, ((data) => {
        // check if any rows already exist, if they do, delete them
        if ($('.monitors').length) {
            $('.monitors').remove();
            mainTableTimeout = null;
        }

        // loop through all of the rows returned from api
        for (const row of data) {
            const escapedRowName = row.name.replace(/\s+/g, '-').toLowerCase();

            const tr = helper.createSetAttributes('tr', {className: `monitors ${escapedRowName}`})

            const name = helper.createSetAttributes('td', {textContent: row.name});

            const status = helper.createSetAttributes('td', {textContent: row.status.charAt(0).toUpperCase() + row.status.slice(1)})
            if (row.status === 'up') {
                status.className = 'bi bi-arrow-up status';
            } else {
                status.className = 'bi bi-arrow-down status';
            }

            const lastChecked = helper.createSetAttributes('td', {textContent: new Date(row.lastChecked).toUTCString()})

            // event listener on monitor name in graph
            tr.addEventListener('click', () => {
                // create modal with bootbox
                bootbox.dialog({
                    title: row.name,
                    closeButton: false,
                    message: 'Times are shown in UTC 24-hour',
                    size: 'extra-large',
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
                            clearTimeout(statusAlertTimeout);
                            clearTimeout(tpsTimeout);
                        }
                    }
                });

                // center utc 24-hour message
                $(`.${escapedRowName} .bootbox-body`).addClass('text-center');
                // center modal body
                $(`.${escapedRowName} .modal-body`).addClass('text-center');

                // replace the close button in the modal since bootbox's one is broken
                const closeButton = helper.createSetAttributes('button', {className: 'btn-close', 'data-bs-dismiss': 'modal'});
                $(`.${escapedRowName} .modal-header`).append(closeButton);
                $(`.${escapedRowName}`).attr('id', escapedRowName);

                // create refresh button and click handler

                const refreshMonitorButton = helper.createSetAttributes('button', {className: 'btn btn-primary refresh-monitor', textContent: 'Refresh Monitor'});

                $(`.${escapedRowName} .modal-body`).append(refreshMonitorButton);

                function refreshGraphs() {
                    $('.refresh-monitor').attr('disabled', 'true');

                    // remove existing graphs
                    $('canvas#cpu').remove();
                    $('canvas#memory').remove();
                    $('canvas#playercount').remove();
                    $('canvas#tps').remove();
                    $('#status').remove();

                    // clear timeouts of existing graphs
                    clearTimeout(cpuTimeout);
                    clearTimeout(memoryTimeout);
                    clearTimeout(playercountTimeout);
                    clearTimeout(tpsTimeout);
                    clearTimeout(statusAlertTimeout);

                    const selectedTime = $('.time-selector button.active').text();

                    // create new graphs
                    cpuGraph(selectedTime);
                    memoryGraph(selectedTime);
                    playercountGraph(selectedTime);
                    tpsGraph(selectedTime);
                    statusAlert(selectedTime);

                    // remove disabled button attribute
                    $('span.spinner-border').remove();
                    $('.refresh-monitor').removeAttr('disabled');
                }

                $('.refresh-monitor').click(refreshGraphs);

                // create status alert of server

                async function statusAlert() {
                    if ($('.monitor-information').length) {
                        $('.monitor-information').remove();
                    }

                    const response = await Promise.all([
                        fetch(`${apiUrl}/query/recent/minecraftVersion/${row.uuid}`, {
                            headers: {
                                'Authorization': `Bearer ${getCookie('user')}`
                            }
                        }),
                        fetch(`${apiUrl}/query/recent/ip/${row.uuid}`, {
                            headers: {
                                'Authorization': `Bearer ${getCookie('user')}`
                            }
                        }),
                        fetch(`${apiUrl}/query/status/${row.uuid}`, {
                            headers: {
                                'Authorization': `Bearer ${getCookie('user')}`
                            }
                        }),
                        fetch(`${apiUrl}/query/recent/pluginVersion/${row.uuid}`, {
                            headers: {
                                'Authorization': `Bearer ${getCookie('user')}`
                            }
                        }),
                        fetch(`${apiUrl}/query/plugin-version`, {
                            headers: {
                                'Authorization': `Bearer ${getCookie('user')}`
                            }
                        })
                    ]);

                    let data = await Promise.all(response.map(r => r.json()));
                    data = data.flat();

                    const flexContainer = helper.createSetAttributes('div', {className: 'd-flex justify-content-center monitor-information'});

                    const versionContainer = helper.createSetAttributes('div', {className: 'p-2'});
                    const pluginVersionContainer = helper.createSetAttributes('div', {className: 'p-2'});
                    const ipContainer = helper.createSetAttributes('div', {className: 'p-2'});
                    const statusContainer = helper.createSetAttributes('div', {className: 'p-2'});
                    const lastCheckedContainer = helper.createSetAttributes('div', {className: 'p-2'});

                    const versionTitle = helper.createSetAttributes('p', {textContent: 'Minecraft Version', className: 'fs-5'});
                    const versionValue = helper.createSetAttributes('p', {textContent: data[0]});
                    versionContainer.append(versionTitle, versionValue);

                    const ipTitle = helper.createSetAttributes('p', {textContent: 'IP Address', className: 'fs-5'});
                    const ipValue = helper.createSetAttributes('p', {textContent: data[1]});
                    ipContainer.append(ipTitle, ipValue);

                    const statusTitle = helper.createSetAttributes('p', {textContent: 'Status', className: 'fs-5'});
                    const statusValue = document.createElement('p');
                    if (data[2].status === 'up') {
                        helper.setAttributes(statusValue, {className: 'bi bi-arrow-up status', textContent: 'Up'});
                    } else {
                        helper.setAttributes(statusValue, {className: 'bi bi-arrow-down status status', textContent: 'Down'});
                    }
                    statusContainer.append(statusTitle, statusValue);

                    const pluginVersionTitle = helper.createSetAttributes('p', {textContent: 'Plugin Version', className: 'fs-5'});
                    const pluginVersionValue = helper.createSetAttributes('p', {textContent: data[3]});
                    pluginVersionContainer.append(pluginVersionTitle, pluginVersionValue);

                    if (data[3] !== data[4]) {
                        const exclamationMark = helper.createSetAttributes('i', {className: 'bi bi-exclamation-triangle'});
                        pluginVersionValue.append(exclamationMark);

                        if ($('.update-message').length) {
                            $('.update-message').remove();
                        }
                        const updateMessage = helper.createSetAttributes('a', {textContent: 'Your plugin is out of date. Click here to download the latest version and update.', href: 'https://github.com/Aurinsk/website/releases/download/', className: 'update-message'});
                        $(`.${escapedRowName} .modal-body`).prepend(updateMessage);
                    }

                    pluginVersionContainer.append(pluginVersionTitle, pluginVersionValue);

                    const lastCheckedTitle = helper.createSetAttributes('p', {textContent: 'Last Checked', className: 'fs-5'});
                    //const lastCheckedValue = helper.createSetAttributes('p', {textContent: new Date(row.lastChecked).toString()});
                    const lastCheckedValue = helper.createSetAttributes('p', {textContent: new Date(row.lastChecked).toUTCString()});
                    //console.log(new Date(row.lastChecked).toUTCString());
                    // textContent: new Date(row.lastChecked).toString()
                    lastCheckedContainer.append(lastCheckedTitle, lastCheckedValue);

                    flexContainer.append(versionContainer, ipContainer, statusContainer, lastCheckedContainer, pluginVersionContainer);

                    $(`.${escapedRowName} .modal-body`).prepend(flexContainer);

                    statusAlertTimeout = setTimeout(statusAlert, 60000);
                }

                const cpuContainer = helper.createSetAttributes('div', {id: 'cpuContainer', className: 'text-center'});
                const memoryContainer = helper.createSetAttributes('div', {id: 'memoryContainer', className: 'text-center'});
                const playercountContainer = helper.createSetAttributes('div', {id: 'playercountContainer', className: 'text-center'});
                const tpsContainer = helper.createSetAttributes('div', {id: 'tpsContainer', className: 'text-center'});

                const deleteButtonContainer = helper.createSetAttributes('div', {id: 'deleteButtonContainer'});
                const deleteButton = helper.createSetAttributes('button', {className: 'btn btn-danger', textContent: 'Delete Monitor'});
                deleteButtonContainer.append(deleteButton);

                deleteButton.addEventListener('click', () => {
                    $(`.bootbox.${escapedRowName}`).modal('hide');
                    closeButton: false,
                        bootbox.confirm({
                            message: 'Are you sure you want to permanently delete this monitor and its history?',
                            size: 'small',
                            closeButton: false,
                            callback: (result) => {
                                if (result) {
                                    $(`.monitors.${escapedRowName}`).remove();

                                    fetch(`${apiUrl}/delete/monitor/${row.uuid}`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Authorization': `Bearer ${getCookie('user')}`
                                        }
                                    })
                                }
                            }
                        })
                })

                const buttonGroup = helper.createSetAttributes('div', {className: 'btn-group time-selector', role: 'group'});
                const threehour = helper.createSetAttributes('button', {className: 'btn btn-primary', textContent: '3h'});
                const sixhour = helper.createSetAttributes('button', {className: 'btn btn-primary', textContent: '6h'});
                const twelvehour = helper.createSetAttributes('button', {className: 'btn btn-primary', textContent: '12h'});
                const twentyfourhour = helper.createSetAttributes('button', {className: 'btn btn-primary', textContent: '24h'});

                buttonGroup.append(threehour, sixhour, twelvehour, twentyfourhour);

                // [cpuContainer, memoryContainer, playercountContainer, tpsContainer].forEach(item => {
                //     item.prepend(buttonGroup.cloneNode(true));
                // })

                $(`.${escapedRowName} .modal-body`).append(buttonGroup);

                $(`.${escapedRowName} .modal-body`).append(cpuContainer, memoryContainer, playercountContainer, tpsContainer, deleteButtonContainer);

                $('.time-selector button').first().addClass('active');

                $('.time-selector button').each((i, obj) => {
                    $(obj).click((e) => {
                        const hours = e.target.textContent;

                        $('.time-selector button').removeClass('active');
                        $(e.target).addClass('active');

                        refreshGraphs();
                    });
                })

                const selectedTime = $('.time-selector button.active').text();

                function cpuGraph(time) {
                    $.get(`${apiUrl}/query/graph/${row.uuid}/cpu/${time}`, ((data) => {

                        // if the canvas already exists, remove it, and recreate it
                        // used for refreshing the graphs every minute

                        const canvas = helper.createSetAttributes('canvas', {id: 'cpu', className: escapedRowName});

                        if ($('canvas#cpu').length) {
                            $('canvas#cpu').remove();
                        }

                        $('#cpuContainer').append(canvas);

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

                        const selectedTime = $('.time-selector button.active').text();
                        cpuTimeout = setTimeout(cpuGraph, 60000, selectedTime);
                    }))
                }

                function memoryGraph(time) {
                    $.get(`${apiUrl}/query/graph/${row.uuid}/memory/${time}`, ((data) => {

                        const canvas = helper.createSetAttributes('canvas', {id: 'memory', className: escapedRowName})

                        if ($('canvas#memory').length) {
                            $('canvas#memory').remove();
                        }

                        $('#memoryContainer').append(canvas);

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

                        const selectedTime = $('.time-selector button.active').text();
                        memoryTimeout = setTimeout(memoryGraph, 60000, selectedTime);
                    }))
                }

                function playercountGraph(time) {
                    $.get(`${apiUrl}/query/graph/${row.uuid}/playercount/${time}`, ((data) => {

                        const canvas = helper.createSetAttributes('canvas', {id: 'playercount', className: escapedRowName})

                        if ($('canvas#playercount').length) {
                            $('canvas#playercount').remove();
                        }

                        $('#playercountContainer').append(canvas);

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

                        const selectedTime = $('.time-selector button.active').text();
                        playercountTimeout = setTimeout(playercountGraph, 60000, selectedTime);
                    }))
                }

                function tpsGraph(time) {
                    $.get(`${apiUrl}/query/graph/${row.uuid}/tps/${time}`, ((data) => {

                        // const canvas = document.createElement('canvas');
                        const canvas = helper.createSetAttributes('canvas', {id: 'tps', className: escapedRowName});

                        if ($('canvas#tps').length) {
                            $('canvas#tps').remove();
                        }

                        $('#tpsContainer').append(canvas);

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

                        const chart = new Chart($('canvas#tps'), {
                            type: 'line',
                            data: {
                                labels: data[1],
                                datasets: [{
                                    label: 'TPS',
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
                                        text: 'TPS',
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

                        const selectedTime = $('.time-selector button.active').text();
                        tpsTimeout = setTimeout(tpsGraph, 60000, selectedTime);
                    }))
                }

                cpuGraph(selectedTime);
                memoryGraph(selectedTime);
                playercountGraph(selectedTime);
                tpsGraph(selectedTime);
                statusAlert(selectedTime);

            });

            tr.append(name, status, lastChecked);
            $('tbody').append(tr);
        }
    }));

    mainTableTimeout = setTimeout(mainTable, 60000);
}

mainTable();

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
    const downloadMessage = helper.createSetAttributes('p', {
        textContent: 'Download and install the monitoring plugin from here, and install it into your plugins folder. Once installed, reboot your server. We will detect once we have received analytics below.',
        id: 'downloadMessage'
    })

    // add the alert spinner while checking for analytics from monitor
    const analyticsChecker = helper.createSetAttributes('div', {className: 'alert alert-secondary text-center', id: 'analyticsChecker'});
    const analyticsCheckerSpinner = helper.createSetAttributes('span', {className: 'spinner-border'});
    const analyticsCheckerMessage = helper.createSetAttributes('p', {textContent: 'Waiting for analytics...'});

    // append the alert spinner
    $('.mb-3.ip-address').append(downloadMessage, analyticsChecker);
    $('.alert-secondary').append(analyticsCheckerSpinner, analyticsCheckerMessage);

    // check api every 2.5 seconds if analytics has been received for the entered ip address
    function checkForAnalytics() {
        $.post(`${apiUrl}/create`, {ip: $('#ipAddress').val(), email: getCookie('email'), name: $('#minecraftMonitorName').val()}, (data) => {
            if (data === 'exists') {
                const alreadyExists = helper.createSetAttributes('div', {className: 'alert alert-danger', id: 'alreadyExists', textContent: 'The monitor belonging to this IP address is already owned by you or somebody else'});

                $('.mb-3.ip-address').append(alreadyExists);
                $('#analyticsChecker').remove();

                $('#minecraftMonitorName').removeAttr('disabled');
                $('#ipAddress').removeAttr('disabled');
                $('#addMonitorFormSubmit').removeAttr('hidden');

                clearTimeout(checkForAnalyticsTimeout);
                return;
            }

            if (data === 'true') {
                $('.alert-secondary').remove();

                const receivedAnalytics = helper.createSetAttributes('div', {className: 'alert alert-success text-center', id: 'receivedAnalytics'});
                const analyticsReceivedCheck = helper.createSetAttributes('span', {className: 'bi bi-check-lg'});

                const viewMonitor = helper.createSetAttributes('button', {className: 'btn btn-primary', textContent: 'View your Monitors', 'data-bs-dismiss': 'modal'});

                mainTable();

                $('.mb-3.ip-address').append(receivedAnalytics, viewMonitor);
                $('.alert-success').append(analyticsReceivedCheck);

                clearTimeout(checkForAnalyticsTimeout);
                return;
            }

            checkForAnalyticsTimeout = setTimeout(checkForAnalytics, 2500);
        })
    }

    checkForAnalytics();

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

    clearTimeout(checkForAnalyticsTimeout);

    window.onbeforeunload = null;
});