$(function () {
    $.ajax({
        type: "GET",
        url: "https://wakatime.com/share/@vicho/71e16e4c-46df-433e-81df-97dcf6124ef6.json",
        dataType: "jsonp",
        success: function (response) {
            if (Array.isArray(response.data)) {
                var chartLabels = [],
                    chartData = [],
                    index,
                    data;
                for(index in response.data) {
                    data = response.data[index];
                    if (typeof data.range == "object") {
                        chartLabels[index] = moment(data.range.start).format("DD [de] MMMM");
                    }
                    if (typeof data.grand_total == "object") {
                        chartData[index] = data.grand_total.total_seconds;
                    }
                }

                renderChart(chartLabels, chartData);
            } else {
                $("#stats").remove();
            }
        },
    });

    
});

function renderChart(chartLabels, chartData) {
    var ctx = $("#statsWakatime");
    var myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "Tiempo programando",
                data: chartData,
                backgroundColor: [
                    "rgba(66, 66, 66, 0.2)"
                ],
                borderColor: [
                    "rgba(66, 66, 66, 1)"
                ]
            }]
        },
        options: {
            maintainAspectRatio: false,
            tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (tooltipItem, data) {
                        var duration = moment.duration(tooltipItem.yLabel, "seconds");
                        return (duration.hours() != 1 ? duration.hours() + " horas " : duration.hours() + " hora ") +
                                (duration.minutes() != 1 ? duration.minutes() + " minutos " : duration.minutes() + " minuto ");
                    }
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: function(value, index, values) {
                            return moment.duration(value, "seconds").hours();
                        }
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "Horas"
                    }
                }]
            }
        }
    });
};
