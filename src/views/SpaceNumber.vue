<script setup>
import {nextTick, onMounted, reactive, ref} from "vue";
import request from "@/utils/request";
import {ElMessage} from "element-plus";
import config from "../../config";
import {useUserStore} from "@/stores/user";
import axios from "axios";


const name = ref('')
const pageNum = ref(1)
const pageSize = ref(5)
const total = ref(0)

const userStore = useUserStore()
const token = userStore.getBearerToken
const auths =  userStore.getAuths
const uid = userStore.getUserId
const flag = userStore.getFlag

let DEFAULT_PARKING = ref(0)
const state = reactive({
  tableData: [],
  form: {
    parking: DEFAULT_PARKING
  },
  parking: [],
})


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
  }
  const idArr = multipleSelection.value.map(v => v.id)
  request.post('/parkingSpace/del/batch', idArr).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const load = () => {
    request.get('/parkingSpace/page', {
      params: {
        psNumber: name.value,
        pid:state.form.parking,
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
      request.request({
        url: '/parkingSpace',
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

// 删除
const del = (id) => {
  request.delete('/parkingSpace/' + id).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}


const psvalue = ref(0)
const options = [
  {
    value: 0,
    label: "空闲",
  },
  {
    value: 1,
    label: '占用',
  },
  {
    value: 2,
    label: '预约中',
  },
]

const stateOptions = [
  {
    value: 0,
    label: "预约中",
  },
  {
    value: 1,
    label: '已取消',
  },
  {
    value: 2,
    label: '已完成',
  },
  {
    value: 3,
    label: '已过期',
  },
]

const getNameById = (id) => {
  const parkingLot = state.parking.find(p => p.value === id)
  return parkingLot ? parkingLot.label : ''
}


const addbookings = (row) => {
  request.post("/bookings/add?uid=" + uid + "&pid=" + row.pid + "&psNumber=" + row.psNumber).then(res => {
    if (res.code==='200' || res.code===200){
    ElMessage.success(res.data)
    }else if (res.code==='800' || res.code===800){
      ElMessage.error(res.data)
    }
    load()
  })
}

const cancelbookings = (row) => {
  request.post("/bookings/cancel?uid=" + uid + "&pid=" + row.pid + "&psNumber=" + row.psNumber).then(res => {
    if (res.code==='200' || res.code===200){
      ElMessage.success(res.data)
    }else {
      ElMessage.error("取消失败")
    }

    load()
  })
}
let timer
const startTimer = (row) => {
  request.post("/bookings/time?uid=" + uid ).then(res => {
    if (res.code==='200' || res.code===200){
      timer = res.data
      alert("请在"+timer+"之前进入停车场")
    }else {
      ElMessage.error(res.msg)
    }

  })
}

</script>


<template>
  <div>
    <div style="display: flex; align-items: center;">
      <el-form-item prop="parking" label="停车场  : " style="margin-top: 17px;">
        <el-select clearable v-model="state.form.parking" placeholder="请选择停车场" style="width: 300px" >
          <el-option v-for="item in state.parking" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <span style="margin-left: 8px">车位号 : </span>
      <el-input v-model="name" placeholder="请输入车位号" class="w300" style="width: 300px; margin-left: 10px"/>
      <el-button type="primary" class="ml5" @click="load" style="margin-left: 20px">
        <el-icon style="vertical-align: middle">
          <Search />
        </el-icon>  <span style="vertical-align: middle;"> 搜索 </span>
      </el-button>
      <el-button type="warning" class="ml5" @click="reset" style="margin-left: 10px">
        <el-icon style="vertical-align: middle">
          <RefreshLeft />
        </el-icon>  <span style="vertical-align: middle"> 重置 </span>
      </el-button>
    </div>

    <div style="margin: 10px 0">
      <el-button type="success" @click="handleAdd" v-if="auths.includes('parkingSpace.add')">
        <el-icon style="vertical-align: middle">
          <Plus />
        </el-icon>  <span style="vertical-align: middle"> 新增 </span>
      </el-button>




      <el-popconfirm title="您确定删除吗？" @confirm="confirmDelBatch" v-if="auths.includes('parkingSpace.deleteBatch')">
        <template #reference>
          <el-button type="danger" style="margin-left: 5px">
            <el-icon style="vertical-align: middle">
              <Remove />
            </el-icon>  <span style="vertical-align: middle"> 批量删除 </span>
          </el-button>
        </template>
      </el-popconfirm>
    </div>

    <div style="margin: 10px 0">
      <el-table :data="state.tableData" stripe border  @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="编号"></el-table-column>
        <el-table-column label="停车场"  prop="pid">
          <template #default="{ row }">
            {{ getNameById(row.pid) }}
          </template>
        </el-table-column>
        <el-table-column prop="psNumber" label="车位号"></el-table-column>

        <el-table-column prop="state" label="车位状态">
          <template #default="{row}">
            <span v-if="row && row.state===0">空闲</span>
            <span v-else-if="row.state===1">占用</span>
            <span v-else>预约中</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="300">
          <template #default="scope">
            <el-button type="success" @click="addbookings(scope.row)" v-if="scope.row.state === 0">预约</el-button>
            <el-button type="danger" @click="cancelbookings(scope.row)" v-if="scope.row.state === 2">取消预约</el-button>
            <el-button type="info" @click="startTimer(scope.row)" v-if="scope.row.state===2">查看剩余时间</el-button>

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
  </div>
</template>
