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
        xhr.setRequestHeader('Authorization', `Bearer ${getCookie('user')}`);
    }
});

const email = getCookie('email');

$.get(`http://192.168.1.251:3000/query/monitors/${email}`, (data) => {

    let upMonitors = 0;
    let downMonitors = 0;
    let cpuUsage = [];
    let memoryUsage = [];
    let cpuUsagePromises = [];
    let memoryUsagePromises = [];

    const average = arr => arr.reduce((acc,v) => acc + v, 0) / arr.length;

    for (const row of data) {
        cpuUsagePromises.push(new Promise((res, rej) => {
            $.get(`http://192.168.1.251:3000/query/graph/${row.uuid}/cpu_usage/10m`, (cpu) => {
                if (cpu[0].length) {
                    cpuUsage.push(...cpu[0]);
                    res('Received');
                } else {
                    res('Empty');
                }
            });
        }));

        memoryUsagePromises.push(new Promise((res, rej) => {
            $.get(`http://192.168.1.251:3000/query/graph/${row.uuid}/memory_usage/10m`, (memory) => {
                if (memory[0].length) {
                    memoryUsage.push(...memory[0]);
                    res('Received');
                } else {
                    res('Empty');
                }
            });
        }))


        if (row.status === 'up') {
            upMonitors++;
        } else downMonitors++;
    }

    Promise.all([...cpuUsagePromises, ...memoryUsagePromises]).then(() => {
        const avgCpu = (parseFloat(average(cpuUsage).toFixed(4)) * 100).toString() + "%";
        const avgMem = (parseFloat(average(memoryUsage).toFixed(2))).toString() + " MB";

        if (isNaN(avgCpu)) {
            $('.avg-cpu').text('0%');
        } else {
            $('.avg-cpu').text(avgCpu);
        }

        if (isNaN(avgMem)) {
            $('.avg-mem').text('0 MB');
        } else {
            $('.avg-mem').text(avgMem);
        }
    })

    $('.up-monitors').text(upMonitors);
    $('.down-monitors').text(downMonitors);
});