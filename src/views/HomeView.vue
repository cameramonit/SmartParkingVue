
<template>
  <!--主体-->
  <div style="display: flex; flex-wrap: wrap;" v-if="flag==='SUPERADMIN' || flag === 'ADMIN'">

    <div class="dashboard-container">

      <div class="dashboard-item">
        <p class="dashboard-label">已停车位</p>
        <div class="dashboard-value">
          <img class="dashboard-icon" :src="'src/assets/bicycle.jpg'">
          <p class="dashboard-number">{{ spNumber }}</p>
        </div>
      </div>

      <div class="dashboard-item">
        <p class="dashboard-label">剩余车位</p>
        <div class="dashboard-value">
          <img class="dashboard-icon" :src="'src/assets/bicycle.jpg'">
          <p class="dashboard-number">{{ sumSPNumber }}/{{ sumNumber }}</p>
        </div>
      </div>

      <div class="dashboard-item" >
        <p class="dashboard-label">订单数</p>
        <div class="dashboard-value">
          <img class="dashboard-icon" :src="'src/assets/Cashregisters.png'">
          <p class="dashboard-number">{{ orderCount }}</p>
        </div>
      </div>

      <div class="dashboard-item">
        <p class="dashboard-label">总收益</p>
        <div class="dashboard-value">
          <img class="dashboard-icon" :src="'src/assets/money.jpg'">
          <p class="dashboard-number">{{ sum }}</p>
        </div>
      </div>

      <div class="dashboard-item">
        <p class="dashboard-label">停车记录数</p>
        <div class="dashboard-value">
          <img class="dashboard-icon" :src="'src/assets/record.jpg'">
          <p class="dashboard-number">{{ recordCount }}</p>
        </div>
      </div>
      <div class="dashboard-item">
        <p class="dashboard-label">用户数</p>
        <div class="dashboard-value">
          <img class="dashboard-icon" :src="'src/assets/human.jpg'">
          <p class="dashboard-number">{{ userNumber }}</p>
        </div>
      </div>

    </div>


    <div class="chart-container">
      <div class="chart-item">
        <div ref="chart3" id="chart3" class="chart" style="margin-top: 80px;"></div>
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-item">
        <label for="order-day">订单日期：</label>
        <select id="order-day" v-model="state.OrderDay" @change="loadAllOrderCharts" :key="state.OrderDay">
          <option value=0 label="今天">今天</option>
          <option value=1 label="昨天">昨天</option>
          <option value=7 label="最近7天">最近7天</option>
          <option value=30 label="最近30天">最近30天</option>
        </select>
        <div ref="chart2" id="chart2" class="chart"></div>
      </div>

      <div class="chart-item">
        <label for="record-day">记录日期：</label>
        <select id="record-day" v-model="state.RecordDay" @change="loadAllRecordCharts" :key="state.RecordDay">
          <option value=0 label="今天">今天</option>
          <option value=1 label="昨天">昨天</option>
          <option value=7 label="最近7天">最近7天</option>
          <option value=30 label="最近30天">最近30天</option>
        </select>
        <div ref="chart1" id="chart1" class="chart"></div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import {useUserStore} from "@/stores/user";

const state = reactive({
  tableData: [],
  RecordDay: '30',
  OrderDay: '7',
  form: {
    parking: 1
  },
  parking: [], // 选中的停车场
  chart: null, // echarts 实例
});
const userStore = useUserStore()
const flag = userStore.getFlag


const parkingInfo = async () => {
  try {
    const response = await request.get('/parking/all')
    if (response && response.data) {
      const parking = response.data.map(item => ({
        label: item.name,
        value: item.pid
      }))
      state.parking = parking
      state.form.parking = parking[0].value // 给 v-model 赋初始值
      selectCount()
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('停车场列表数据失败')
  }
}
const loadAllRecordCharts = () => {
  request.get('/record/getRecordCountByDay', {
        params: {
          day: state.RecordDay,
        },
      })
      .then((res) => {
        const chartData2 = res.data.map(item => {
          return {
            name: item.name,
            value: item.count
          }
        });
        const chartDom = document.getElementById('chart1');
        const chart1 = echarts.init(chartDom);
        chart1.setOption({
          title: {
            text: '停车记录情况饼图',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',

          },
          legend: {
            orient: 'vertical',
            left: 'left'
          },
          series: [
            {
              type: 'pie',
              radius: '50%',
              data: chartData2,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        });
      })
};


const pid = ref(0)
// 获取记录统计数据
async function selectCount() {
  try {
    request.get('/parking/allparking')
    .then((res) => {
      const chartData = {
        name:[],
        number:[],
        psNum:[]
      };
      res.reverse().forEach((item) => {
        chartData.name.push(item.name);
        chartData.number.push(item.number);
        chartData.psNum.push(item.parkingSpaceNumber);
      });

      const chartDom = document.getElementById('chart3');
      const chart3 = echarts.init(chartDom);

      chart3.setOption({
        title: {
          text: '停车场使用情况',
          x: 'center',
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        xAxis: {
          type: 'category',
          data: chartData.name,
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '车位总数',
            type: 'bar',
            data: chartData.number
          },
          {
            name: '车位剩余数',
            type: 'bar',
            data: chartData.psNum
          }
        ]
    })
    })
    } catch (error) {
    ElMessage.error('获取记录统计数据失败'+error);
  }
}



async function selectCount1() {
  try {
    request.get('/parking/allparking')
        .then((res) => {
          const chartData5 = {
            name:[],
            number:[],
            psNum:[]
          };
          res.reverse().forEach((item) => {
            chartData5.name.push(item.name);
            chartData5.number.push(item.number);
            chartData5.psNum.push(item.parkingSpaceNumber);
          });

          const chartDom = document.getElementById('chart4');
          const chart4 = echarts.init(chartDom);

          chart4.setOption({
            title: {
              text: '停车场使用情况',
              x: 'center',
            },
            legend: {
              orient: 'vertical',
              left: 'left'
            },
            xAxis: {
              type: 'category',
              data: chartData.name,
            },
            yAxis: {
              type: 'value',
            },
            series: [
              {
                name: '车位总数',
                type: 'bar',
                data: chartData.number
              },
              {
                name: '车位剩余数',
                type: 'bar',
                data: chartData.psNum
              }
            ]
          })
        })
  } catch (error) {
    ElMessage.error('获取记录统计数据失败'+error);
  }
}


let sum = ref(0)
const loadAllOrderCharts = () => {
  request.get('/order/findOrderMoneyByDay', {
    params: {
      day: state.OrderDay,
    },
  }).then((res) => {
        const chartData3 = res.data.map(item => {
          return {
            name: item.name,
            value: item.sumMoney
          }
        });

    sum.value = chartData3.reduce((total, item) => total + item.value, 0);

        const chartDom = document.getElementById('chart2');
        const chart2 = echarts.init(chartDom);
        chart2.setOption({
          title: {
            text: '停车场订单收费情况',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',

          },
          legend: {
            orient: 'vertical',
            left: 'left'
          },
          series: [
            {
              type: 'pie',
              radius: '50%',
              data: chartData3,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        });
      })
};
let sumNumber = ref(0);
let sumSPNumber = ref(0);
let spNumber = ref(0);

const loadParkingNumber = () => {
  request.get("/parking/findParkingNumber").then(res => {
    sumNumber.value = res.data.sumNumber;
    sumSPNumber.value = res.data.sumSPNumber;
    spNumber.value = sumNumber.value-sumSPNumber.value

  });
};
let orderCount = ref( 0)
const loadOrderCount = () => {
  request.get("/order/findOrderCount").then(res => {
    orderCount.value = res.data
  });

};

let recordCount = ref( 0)
const loadRecordCount = () => {
  request.get("/record/findRecordCount").then(res => {
    recordCount.value = res.data
  });

};

let userNumber = ref( 0)
const loadUserCount = () => {
  request.get("/user/selectUserNumber").then(res => {
    userNumber.value = res.data
  });

};


onMounted(() => {
  parkingInfo()
  loadAllRecordCharts()
  loadAllOrderCharts()
  loadParkingNumber()
  loadOrderCount()
  loadRecordCount()
  loadUserCount()
})
</script>
<style>
.dashboard-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex: 1 0 400px;
  margin-right: 10px;
}

.dashboard-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 200px;
  height: 150px;
  border: 5px solid dodgerblue;
  border-radius: 20px;
}

.dashboard-label {
  font-size: 18px;
  color: gray;
  margin: 0;
}

.dashboard-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-icon {
  width: 48px;
  height: 48px;
}

.dashboard-number {
  margin: 0;
  font-size: 24px;
  font-weight: bolder;
  color: dodgerblue;
  font-family: 'MyFont', sans-serif;
}

.dashboard-chart {
  width: 400px;
  height: 300px;
}

.chart-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.chart-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 10px 20px;
  width: 400px;
}

.chart-item label {
  margin-bottom: 10px;
  font-size: 1.2rem;
  font-weight: bold;
}

.chart-item select {
  width: 100%;
  padding: 10px;
  font-size: 1.2rem;
  border: none;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  position: relative;
}

.chart-item select::after {
  content: '\25bc';
  font-size: 1.2rem;
  color: #999;
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  pointer-events: none;
}

.chart-item .chart {
  width: 100%;
  height: 300px;
  margin-top: 20px;
}
.user-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.info-container {
  margin: 50px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
}

.info-title {
  font-size: 24px;
  margin-bottom: 10px;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  margin-bottom: 10px;
}

.info-text {
  margin: 10px 0;
}

.parking-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 50px;
}

.parking-info {
  margin-right: 20px;
}

.parking-title {
  font-size: 24px;
  margin-bottom: 10px;
}

.parking-details {
  display: flex;
  justify-content: center;
  align-items: center;
}

.parking-image {
  height: 50px;
  margin-right: 10px;
}

.parking-number {
  font-size: 24px;
  margin: 0;
}
</style>