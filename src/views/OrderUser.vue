<script setup>
import {nextTick, onMounted, reactive, ref} from "vue";
import request from "@/utils/request";
import {ElMessage} from "element-plus";
import config from "../../config";
import {useUserStore} from "@/stores/user";


const name = ref('')
const payTime = ref('')

const pageNum = ref(1)
const pageSize = ref(5)
const total = ref(0)
const userStore = useUserStore()
const token = userStore.getBearerToken
const auths =  userStore.getAuths

// let user = userStore.getUser
const  uid = userStore.getUserId


const state = reactive({
  tableData: [],
  form: {},
  parking:[]
})

const valueHtml = ref('')  // 富文本内容



const multipleSelection = ref([])

// 批量删除
const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const confirmDelBatch = () => {
  if (!multipleSelection.value || !multipleSelection.value.length) {
    ElMessage.warning("请选择数据")
    return
  }m
  const idArr = multipleSelection.value.map(v => v.id)
  request.post('/order/del/batch', idArr).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const load = () => {
    request.get('/order/findOrderByUid', {
      params: {
        uid: uid,
        payTime: payTime.value,
        pageNum: pageNum.value,
        pageSize: pageSize.value
      }
    }).then(res => {
      state.tableData = res.data.records
      total.value = res.data.total
    })
}
load()  // 调用 load方法拿到后台数据

const reset = () => {
  name.value = ''
  load()
}

const dialogFormVisible = ref(false)

const rules = reactive({
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
  ]
})
const ruleFormRef = ref()

// 新增
const handleAdd = () => {
  dialogFormVisible.value = true
  nextTick(() => {
    ruleFormRef.value.resetFields()
    state.form = {}
    valueHtml.value = ''  // 富文本
  })
}

// 保存
const save = () => {
  ruleFormRef.value.validate(valid => {   // valid就是校验的结果
    if (valid) {
      state.form.content = valueHtml.value  // 富文本保存内容
      request.request({
        url: '/order',
        method: state.form.id ? 'put' : 'post',
        data: state.form
      }).then(res => {
        if (res.code === '200') {
          ElMessage.success('保存成功')
          dialogFormVisible.value = false
          load()  // 刷新表格数据
        } else {
          ElMessage.error(res.msg)
        }
      })
    }
  })
}

// 编辑
const handleEdit = (raw) => {
  dialogFormVisible.value = true
  nextTick(() => {
    ruleFormRef.value.resetFields()
    state.form = JSON.parse(JSON.stringify(raw))
    valueHtml.value = raw.content  // 富文本
  })
}

const pay = (row) =>{
  window.open('http://localhost:8080/order/pay?subject='+row.carNumber+'$&traceNo='+row.oid+'&totalAmount='+row.money+'');
}

// 删除
const del = (id) => {
  request.delete('/order/' + id).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}
const handleFileUploadSuccess = (res) => {
  state.form.file = res.data
  ElMessage.success('上传成功')
}
const handleImgUploadSuccess = (res) => {
  state.form.img = res.data
  ElMessage.success('上传成功')
}


const getNameById = (id) => {
  const parkingLot = state.parking.find(p => p.value === id)
  return parkingLot ? parkingLot.label : ''
}

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
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取停车场列表数据失败')
  }
}
onMounted(() => {
  parkingInfo()
})

</script>
<script>
export default {
  methods: {
    formatMoney(row, column, cellValue, index) {
      return Number(cellValue).toFixed(2)
    }
  }
}
</script>
<template>
  <div>

    <div style="margin: 10px 0">
      <span style="margin-left: 10px">支付时间 : </span>
      <el-input v-model="payTime" placeholder="请输入支付时间" class="w300" style="width: 150px; margin-left: 20px" type="date"/>
      <el-button type="primary" class="ml5" @click="load" style="margin-left:20px">
        <el-icon style="vertical-align: middle">
          <Search />
        </el-icon>  <span style="vertical-align: middle;"> 搜索 </span>
      </el-button>
      <el-table :data="state.tableData" stripe border  @selection-change="handleSelectionChange" style="margin-top: 10px">
        <el-table-column type="selection" width="55" />
<!--      <el-table-column prop="uid" label="用户编号"></el-table-column>-->
      <el-table-column prop="carNumber" label="车牌号"></el-table-column>
      <el-table-column prop="oid" label="订单号"></el-table-column>
      <el-table-column prop="pid" label="停车场">
        <template #default="{ row }">
          {{ getNameById(row.pid) }}
        </template>
      </el-table-column>
      <el-table-column prop="state" label="支付状态">
        <template #default="{row}">
          <span v-if="row && row.state===0">未支付</span>
          <span v-else>已支付</span>
        </template>
      </el-table-column>
<!--      <el-table-column prop="money" label="停车费用"></el-table-column>-->
        <el-table-column prop="money" label="停车费用￥" :formatter="formatMoney"></el-table-column>
      <el-table-column prop="payTime" label="支付时间"></el-table-column>
      <el-table-column prop="alipayNo" label="支付宝交易凭证号"></el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" @click="pay(scope.row)" v-if="scope.row.state === 0 && scope.row.money > 0 && uid!=1">支 付</el-button>
          </template>
        </el-table-column>

      </el-table>
    </div>

    <div style="margin: 10px 0">
      <el-pagination
          @current-change="load"
          @size-change="load"
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          background
          :page-sizes="[2, 5, 10, 20]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
      />
    </div>

    <el-dialog v-model="dialogFormVisible" title="订单信息" width="40%">
      <el-form ref="ruleFormRef" :rules="rules" :model="state.form" label-width="80px" style="padding: 0 20px" status-icon>
        <el-form-item prop="oid" label="订单号">
          <el-input v-model="state.form.oid" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="psid" label="车位">
          <el-input v-model="state.form.psid" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="state" label="支付状态">
          <el-input v-model="state.form.state" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="moeny" label="停车费用">
          <el-input v-model="state.form.moeny" autocomplete="off"></el-input>
        </el-form-item>

      </el-form>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="save">
          保存
        </el-button>
      </span>
      </template>
    </el-dialog>


  </div>
</template>
