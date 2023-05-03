<script setup>
import {nextTick, reactive, ref, toRaw} from "vue";
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
const  uid = userStore.getUserId
const  user = userStore.getUser
const username = user.name
const  flag = userStore.getFlag

const state = reactive({
  tableData: [],
  form: {}
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
  request.post('/car/del/batch', idArr).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const load = () => {

  if(flag!=="USER"){
    request.get('/car/page', {
      params: {
        name: name.value,
        pageNum: pageNum.value,
        pageSize: pageSize.value
      }
    }).then(res => {
      state.tableData = res.data.records
      total.value = res.data.total
    })
  }else {
    request.get('/car/findCarByUid', {
      params: {
        uid: uid,
        pageNum: pageNum.value,
        pageSize: pageSize.value,
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
    if(uid==1){
      state.form ={}
    }else {
      state.form = {name: username,uid: uid}
    }
      valueHtml.value = ''  // 富文本
    })

}

// 保存
const save = () => {
  ruleFormRef.value.validate(valid => {   // valid就是校验的结果
    if (valid) {
      state.form.content = valueHtml.value  // 富文本保存内容
      request.request({
        url: '/car',
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
  request.delete('/car/' + id).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const handleCarNumberSuccess = (response, file, fileList) => {
// 从后端返回的数据中获取车牌号码
  const carNumber = response.data;
  // 更新Vue组件中的状态
  state.form.carNumber = carNumber;
  // 更新Vue组件中的状态
  toRaw(state.form).carNumber = carNumber;
}


</script>

<template>
  <div>
    <div>
      <span style="margin-left: 5px">车牌号 : </span>
      <el-input v-model="name" placeholder="请输入车牌号" class="w300" style="width: 300px ;margin-left: 5px"/>
      <el-button type="primary" class="ml5" @click="load" style="margin-left: 10px">
        <el-icon style="vertical-align: middle;">
          <Search />
        </el-icon>  <span style="vertical-align: middle"> 搜索 </span>
      </el-button>
      <el-button type="warning" class="ml5" @click="reset">
        <el-icon style="vertical-align: middle">
          <RefreshLeft />
        </el-icon>  <span style="vertical-align: middle"> 重置 </span>
      </el-button>

    </div>

    <div style="margin: 10px 0">
      <el-button type="success" @click="handleAdd" v-if="auths.includes('car.add')" style="">
        <el-icon style="vertical-align: middle">
          <Plus />
        </el-icon>  <span style="vertical-align: middle"> 新增 </span>
      </el-button>


      <el-popconfirm title="您确定删除吗？" @confirm="confirmDelBatch" v-if="auths.includes('car.deleteBatch')">
        <template #reference>
          <el-button type="danger" style="margin-left: 10px">
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
        <el-table-column prop="carNumber" label="车辆号"></el-table-column>
        <el-table-column prop="uid" label="车主id"></el-table-column>
        <el-table-column prop="username" label="车主名"></el-table-column>

        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" @click="handleEdit(scope.row)" v-if="auths.includes('car.edit')">编辑</el-button>
            <el-popconfirm title="您确定删除吗？" @confirm="del(scope.row.id)" v-if="auths.includes('car.delete')">
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

    <el-dialog v-model="dialogFormVisible" title="车辆管理信息" width="40%">
      <el-form ref="ruleFormRef" :rules="rules" :model="state.form" label-width="80px" style="padding: 0 20px" status-icon>
<!--        <el-form-item prop="cid" label="车辆唯一">-->
<!--          <el-input v-model="state.form.cid" autocomplete="off"></el-input>-->
<!--        </el-form-item>-->
        <el-form-item prop="carNumber" label="车牌号">
          <el-input v-model="state.form.carNumber"  :key="state.form.carNumber" autocomplete="off"></el-input>
          <span style="font-size: 5px;float: left;color: dodgerblue">建议车牌识别，避免与识别内容冲突</span>
          <el-upload
              class="ml5"
              :show-file-list="false"
              style="display: inline-block; position: relative; top: 3px"
              action="http://localhost:8080/distinguish/uploadcar"
              :on-success="handleCarNumberSuccess"
          >
            <el-button type="success " style="margin-left: 10px" plain round>
              <el-icon style="vertical-align: middle">
                <Camera />
              </el-icon>  <span style="vertical-align: middle"> 车牌识别 </span>
            </el-button>
          </el-upload>
        </el-form-item>
<!--        <el-form-item prop="name" label="车主">-->
<!--          <el-input v-model="state.form.name" autocomplete="off"></el-input>-->
<!--        </el-form-item>-->
        <el-form-item prop="uid" label="车主号" v-if="uid==1">
          <el-input v-model="state.form.uid" autocomplete="off"></el-input>
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