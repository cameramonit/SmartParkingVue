<template>
    <div class="info-box-container">
        <div class="info-box" id="kitchen-box">
            <h3>厨余垃圾</h3>
            <p>{{state.boxData.kitchen}}</p>
        </div>
        <div class="info-box" id="recyclable-box">
            <h3>可回收垃圾</h3>
            <p>{{state.boxData.recyclable}}</p>
        </div>
        <div class="info-box" id="other-box">
            <h3>其他垃圾</h3>
            <p>{{state.boxData.other}}</p>
        </div>
        <div class="info-box" id="hazardous-box">
            <h3>有害垃圾</h3>
            <p>{{state.boxData.hazardous}}</p>
        </div>
    </div>
    <select v-model="state.selectedDay" @change="loadAllCharts"  :key="state.selectedDay" >
        <option value=7>最近7天</option>
        <option value=14>最近14天</option>
        <option value=30>最近30天</option>
    </select>
    <div>
        <div ref="chart"  id="chart"     style="width: 100%; height: 500px; display: inline-block;"></div>\
        <div ref="chart4" id="chart4" style="width: 100%; height: 500px;display: inline-block;"></div>
        <div ref="chart2" id = "chart2"  style="width: 50%; height: 500px; display: inline-block;"></div>
        <div ref="chart3" id="chart3"    style="width: 50%; height: 500px; display: inline-block;"></div>

    </div>
</template>

<script setup>
    import { onMounted, reactive } from 'vue';
    import request from '@/utils/request';
    import * as echarts from 'echarts';
    import {useUserStore} from "@/stores/user";

    const state = reactive({
        chartData: [],
        selectedDay: '7',
        chartData2: {},
        boxData: {
            kitchen: 0,
            recyclable: 0,
            other: 0,
            hazardous: 0,
        },
    });

    const loadChartData = () => {
        return request.get('/garbageSortingInfo/getAll', {
            params: {
                day:state.selectedDay,
            },
        }).then((res) => {
            state.chartData = [
                { name: '可回收垃圾', value: res.recyclable },
                { name: '其他垃圾', value: res.other },
                { name: '厨余垃圾', value: res.kitchen },
                { name: '有害垃圾', value: res.hazardous },
            ];
            const chartDom = document.getElementById('chart');
            const chart = echarts.init(chartDom);
            const chartTitle = '垃圾分类情况';
            chart.setOption({
                title: {
                    text: chartTitle ,
                    x:'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ({d}%)',
                },
                series: [
                    {
                        type: 'pie',
                        roseType: 'radius',
                        radius: ['20%', '70%'],
                        avoidLabelOverlap: false,
                        label: {
                            show: true,
                            position: 'inside',
                        },
                        emphasis: {
                            label: {
                                show: false,
                                fontSize: '20',
                                fontWeight: 'bold',
                            },
                        },
                        labelLine: {
                            show: false,
                        },
                        legend: {
                            orient: 'vertical',
                            right: 10,
                            top: 20,
                        },
                        data: state.chartData,
                    },
                ],
            });
        });
    };
    const loadChartData2 = () => {
        return request.get('/garbageSortingInfo/getAllDay', {
            params: {
                day: state.selectedDay,
            },
        }).then((res) => {
            const chartData2 = {
                x: [],
                recyclable: [],
                other: [],
                kitchen: [],
                hazardous: [],
            };
            // 从后往前排列时间，方便展示最近的时间
            res.reverse().forEach((item) => {
                chartData2.x.push(item.day);
                chartData2.recyclable.push(item.recyclable);
                chartData2.other.push(item.other);
                chartData2.kitchen.push(item.kitchen);
                chartData2.hazardous.push(item.hazardous);
            });
            state.chartData2 = chartData2;
            const chartDom = document.getElementById('chart2');
            const chart2 = echarts.init(chartDom);
            chart2.setOption({
                title: {
                    text: '垃圾分类趋势图',
                    x: 'center',
                },
                toolbox: {
                    feature: {
                        dataView: {},
                        saveAsImage: {
                            pixelRatio: 2
                        }
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: function(params) {
                        let result = params[0].name + '<br/>';
                        params.forEach(function(item) {
                            result += item.seriesName + ': ' + item.value + '<br/>';
                        });
                        return result;
                    }
                },
                legend: {
                    data: ['厨余垃圾','可回收垃圾', '其他垃圾',  '有害垃圾'],
                    orient: 'horizontal',
                    top: 30,
                    left: 'center',
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: state.chartData2.x,
                },
                yAxis: {
                    type: 'value',
                },
                series: [
                    {
                        name: '可回收垃圾',
                        type: 'line',
                        data: state.chartData2.recyclable,
                    },
                    {
                        name: '其他垃圾',
                        type: 'line',
                        data: state.chartData2.other,
                    },
                    {
                        name: '厨余垃圾',
                        type: 'line',
                        data: state.chartData2.kitchen,
                    },
                    {
                        name: '有害垃圾',
                        type: 'line',
                        data: state.chartData2.hazardous,
                    },
                ],
            });
        });

    };
    const loadStackedBarChart = () => {
        return request.get('/garbageSortingInfo/getAllDay', {
            params: {
                day: state.selectedDay,
            },
        }).then((res) => {
            const chartData = {
                x: [],
                other: [],
                recyclable: [],
                hazardous: [],
                kitchen: [],
                total: [],
            };

            res.reverse().forEach((item) => {
                chartData.x.push(item.day);
                chartData.other.push(item.other);
                chartData.recyclable.push(item.recyclable);
                chartData.hazardous.push(item.hazardous);
                chartData.kitchen.push(item.kitchen);
                chartData.total.push(item.total);
            });

            const chartDom = document.getElementById('chart3');
            const chart3 = echarts.init(chartDom);

            chart3.setOption({
                title: {
                    text: '垃圾分类堆叠柱状图',
                    x: 'center',
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                    },
                },
                legend: {
                    data: ['其他垃圾', '可回收垃圾', '有害垃圾', '厨余垃圾', '垃圾总数'],
                    orient: 'horizontal',
                    top: 30,
                    left: 'center',
                },
                xAxis: {
                    type: 'category',
                    data: chartData.x,
                },
                yAxis: {
                    type: 'value',
                },
                series: [
                    {
                        name: '其他垃圾',
                        type: 'bar',
                        stack: '总量',
                        data: chartData.other,
                    },
                    {
                        name: '可回收垃圾',
                        type: 'bar',
                        stack: '总量',
                        data: chartData.recyclable,
                    },
                    {
                        name: '有害垃圾',
                        type: 'bar',
                        stack: '总量',
                        data: chartData.hazardous,
                    },
                    {
                        name: '厨余垃圾',
                        type: 'bar',
                        stack: '总量',
                        data: chartData.kitchen,
                    },
                    {
                        name: '垃圾总数',
                        type: 'line',
                        data: chartData.total,
                    },
                ],
            });
        });
    };
    const loadRadarChart = () => {
        return request.get('/garbageSortingInfo/getAll', {
            params: {
                day: state.selectedDay,
            },
        }).then((res) => {
            const chartData = [
                { name: '其他垃圾', value: res.other },
                { name: '可回收垃圾', value: res.recyclable },
                { name: '有害垃圾', value: res.hazardous },
                { name: '厨余垃圾', value: res.kitchen },
            ];

            const chartDom = document.getElementById('chart4');
            const chart4 = echarts.init(chartDom);

            chart4.setOption({
                title: {
                    text: '垃圾分类雷达图',
                    x: 'center',
                },
                tooltip: {
                    trigger: 'item',
                },
                legend: {
                    orient: 'horizontal',
                    top: 30,
                    left: 'center',
                },
                radar: {
                    name: {
                        textStyle: {
                            color: '#fff',
                            backgroundColor: '#999',
                            borderRadius: 3,
                            padding: [3, 5],
                        },
                    },
                    indicator: [
                        { name: '其他垃圾', max: Math.max(...chartData.map(item => item.value)) },
                        { name: '可回收垃圾', max: Math.max(...chartData.map(item => item.value)) },
                        { name: '有害垃圾', max: Math.max(...chartData.map(item => item.value)) },
                        { name: '厨余垃圾', max: Math.max(...chartData.map(item => item.value)) },
                    ],
                },
                series: [
                    {
                        name: '垃圾分类情况',
                        type: 'radar',
                        data: [
                            {
                                value: chartData.map(item => item.value),
                                name: '垃圾分类情况',
                            },
                        ],
                    },
                ],
            });
        });
    };
    const loadAllCharts = () => {
        request.get('/garbageSortingInfo/getAllDay', {
            params: {
                day: state.selectedDay,
            },
        }).then((res) => {
            const latestData = res[res.length - 1];
            state.boxData.kitchen = latestData.kitchen;
            state.boxData.recyclable = latestData.recyclable;
            state.boxData.other = latestData.other;
            state.boxData.hazardous = latestData.hazardous;
        });

        loadChartData();
        load();
        loadStackedBarChart();
        loadRadarChart();
    }


    onMounted(() => {
        loadAllCharts();

    });
</script>
<style scoped>
    .info-box-container {
        display: flex;
        justify-content: space-around;
        margin-bottom: 20px;
    }

    .info-box {
        width: 20%;
        padding: 20px;
        text-align: center;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    #kitchen-box {
        background-color: #f9d71c;
        color: #333;
    }

    #recyclable-box {
        background-color: #16a085;
        color: #fff;
    }

    #other-box {
        background-color: #f39c12;
        color: #fff;
    }

    #hazardous-box {
        background-color: #c0392b;
        color: #fff;
    }

    .info-box h3 {
        margin-bottom: 10px;
    }
</style>
