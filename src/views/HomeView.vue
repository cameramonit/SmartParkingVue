<script setup>
import {
  Search,
  RefreshLeft,
  Plus
} from '@element-plus/icons-vue'
import {reactive, ref} from "vue";
const name = ref('')
const pageNum = ref('1')
const pageSize = ref('5')
const state = reactive({
  tableData :[
    {name: 'admin',address:'xiamen',phone:'123456'},
    {name: 'admin',address:'xiamen',phone:'123456'},
    {name: 'admin',address:'xiamen',phone:'123456'},
  ],
})
</script>

<template>
  <div>

    <!--搜索输入框-->
    <div>
      <el-input v-model="name" placeholder="请输入名称" style="width: 300px;"/>
      <el-button style="margin-left: 5px" type="primary">
        <el-icon style="vertical-align: middle">
          <Search />
        </el-icon>
        <span style="vertical-align: middle"> 搜索 </span>
      </el-button>

      <el-button style="margin-left: 5px" type="warning">
        <el-icon style="vertical-align: middle">
          <RefreshLeft />
        </el-icon>
        <span style="vertical-align: middle"> 重置 </span>
      </el-button>

      <el-button style="margin-left: 5px" type="success">
        <el-icon style="vertical-align: middle">
          <Plus />
        </el-icon>
        <span style="vertical-align: middle"> 新增 </span>
      </el-button>

    </div>
    <!--剩余车位数量-->

    <!--表格区域-->
    <div style="margin: 10px 0">
      <el-table :data="state.tableData" stripe border>

        <el-table-column prop="name" label="名称"></el-table-column>
        <el-table-column prop="address" label="地址"></el-table-column>
        <el-table-column prop="phone" label="联系方式"></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">

            <el-button type="primary">编辑</el-button>
            <el-button type="danger">删除</el-button>

          </template>
        </el-table-column>

      </el-table>
    </div>
    <!--分页-->
    <div style="margin: 10px 0">

      <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="50"
      />

    </div>

  </div>
</template>
<script>
export default {
  data(){
    return{
      admin:''
    }
  },
  created() {
   this.admin=JSON.parse(window.localStorage.getItem('access-admin'))
  }

}

</script>
