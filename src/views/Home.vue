<template>
  <div class="container">
    <div class="left-container">
      <div class="parking-info">
        <div class="parking-details">
          <img class="parking-image" :src="'src/assets/bicycle.jpg'">
          <div class="parking-number-container">
            <p class="parking-title">已停车位</p>
            <p class="parking-number">{{ spNumber }}</p>
          </div>
        </div>
      </div>

      <div class="parking-info">
        <div class="parking-details">
          <img class="parking-image" :src="'src/assets/bicycle.jpg'">
          <div class="parking-number-container">
            <p class="parking-title">剩余车位</p>
            <p class="parking-number">{{ sumSPNumber }}/{{ sumNumber }}</p>
          </div>
        </div>
      </div>

      <div id="chart3" ref="chart3" style="width: 600px;height: 400px;"></div>
    </div>

    <div class="right-container">
      <h2 class="info-title">停车场规则和指引</h2>
      <ul class="info-list">
        <li>停车场收费情况：SmartParkingI ¥1/小时，SmartParkingI ¥0.5/小时</li>
        <li>停车场收费规则：停满一个小时后开始计时收费</li>
        <li>停车场规定：禁止吸烟，禁止乱停乱放，禁止酒后驾车</li>
      </ul>
      <h2 class="info-title">联系方式</h2>
      <p class="info-text">如有任何问题，请拨打以下电话联系我们：</p>
      <p class="info-text">客服热线：400-123-4567</p>
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




onMounted(() => {
  parkingInfo()
  loadParkingNumber()

})
</script>


<style>
.container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.parking-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 3px solid dodgerblue;
  border-radius: 20px;
  height: 100px;
  margin-top: 10px;
}

.parking-details {
  display: flex;
  align-items: center;
}

.parking-image {
  height: 50px;
  margin-right: 5px;
}

#chart3 {
  margin-top: 50px;
}

h2 {
  margin-top: 30px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  margin-bottom: 10px;
}

.right-container{
  margin-right: 50px;
  padding: 20px;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  font-size: 16px;
  color: #333;
  text-align: justify;
}
</style>