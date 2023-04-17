<script setup>
import {nextTick, onMounted, reactive, ref} from "vue";
import request from "@/utils/request";
import {ElMessage} from "element-plus";
import config from "../../config";
import {useUserStore} from "@/stores/user";


const name = ref('')
const pageNum = ref(1)
const pageSize = ref(5)
const total = ref(0)

const userStore = useUserStore()
const token = userStore.getBearerToken
const auths =  userStore.getAuths
const flag = userStore.getFlag
const uid = userStore.getUserId



let DEFAULT_PARKING = ref(0)
const state = reactive({
  tableData: [],
  form: {
    parking: DEFAULT_PARKING
  },
  parking: []
})

const valueHtml = ref('')  // 富文本内容
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
    ElMessage.error('获取站点列表数据失败')
  }
}
onMounted(() => {
  parkingInfo()
})


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
  request.post('/bookings/del/batch', idArr).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const load = () => {
if (flag==="SUPERADMIN" || flag === "ADMIN") {
  request.get('/bookings/page', {
    params: {
      pid:state.form.parking,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
  }).then(res => {
    state.tableData = res.data.records
    total.value = res.data.total
  })


}else {
  request.get('/bookings/findUserBookings', {
    params: {
      pid:state.form.parking,
      uid:uid,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
  }).then(res => {
    state.tableData = res.data.records
    total.value = res.data.total
  })

}
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
        url: '/bookings',
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
  request.delete('/bookings/' + id).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

// 导出接口
const exportData = () => {
  window.open(`http://${config.serverUrl}/bookings/export`)
}


const handleImportSuccess = () => {
  // 刷新表格
  load()
  ElMessage.success("导入成功")
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



</script>

<template>
  <div>
    <div style="display: flex; align-items: center;">
      <el-form-item prop="parking" label="停车场 :" style="margin-right: 20px ; margin-top: 20px">
        <el-select clearable v-model="state.form.parking" placeholder="请选择停车场" style="width: 300px;">
          <el-option v-for="item in state.parking" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="load">
        <el-icon style="vertical-align: middle">
          <Search />
        </el-icon>  <span style="vertical-align: middle"> 搜索 </span>
      </el-button>
      <el-button type="warning" @click="reset">
        <el-icon style="vertical-align: middle">
          <RefreshLeft />
        </el-icon>  <span style="vertical-align: middle"> 重置 </span>
      </el-button>
    </div>

    <div style="margin: 10px 0">
      <el-button type="success" @click="handleAdd" v-if="auths.includes('bookings.add')">
        <el-icon style="vertical-align: middle">
          <Plus />
        </el-icon>  <span style="vertical-align: middle"> 新增 </span>
      </el-button>
      <el-popconfirm title="您确定删除吗？" @confirm="confirmDelBatch" v-if="auths.includes('bookings.deleteBatch')">
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
      <el-table-column prop="uid" label="用户ID" v-if="flag!=='USER'"></el-table-column>
      <el-table-column prop="pid" label="停车场">
        <template #default="{ row }">
          {{ getNameById(row.pid) }}
        </template>
      </el-table-column>
      <el-table-column prop="psNumber" label="车位号"></el-table-column>
      <el-table-column prop="entryTime" label="入库时间"></el-table-column>
      <el-table-column prop="state" label="预约状态">

        <template #default="{row}">
          <span v-if="row && row.state===0">预约中</span>
          <span v-else-if="row && row.state===1">已取消</span>
          <span v-else-if="row && row.state===2">已完成</span>
          <span v-else-if="row && row.state===3">已过期</span>
        </template>

      </el-table-column>

        <el-table-column label="操作" width="180" v-if="flag === 'SUPERADMIN' || flag==='ADMIN'">
          <template #default="scope">
            <el-button type="primary" @click="handleEdit(scope.row)" v-if="auths.includes('bookings.edit')">编辑</el-button>
            <el-popconfirm title="您确定删除吗？" @confirm="del(scope.row.id)" v-if="auths.includes('bookings.delete')">
              <template #reference>
                <el-button type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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

    <el-dialog v-model="dialogFormVisible" title="预约管理信息" width="40%">
      <el-form ref="ruleFormRef" :rules="rules" :model="state.form" label-width="80px" style="padding: 0 20px" status-icon>
        <el-form-item prop="uid" label="用户ID">
          <el-input v-model="state.form.uid" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="pid" label="停车场ID">
          <el-input v-model="state.form.pid" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="psNumber" label="车位号">
          <el-input v-model="state.form.psNumber" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="entryTime" label="入库时间">
          <el-date-picker style="width: 100%" v-model="state.form.entryTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择日期时间"></el-date-picker>
        </el-form-item>
        <el-form-item prop="state" label="预约状态">
          <el-select v-model="state.form.state" multiple>
            <el-option label="已预约" :value="0"></el-option>
            <el-option label="已取消" :value="1"></el-option>
            <el-option label="已完成" :value="2"></el-option>
            <el-option label="已过期" :value="3"></el-option>
          </el-select>
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