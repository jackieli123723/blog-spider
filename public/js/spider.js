var socket = io();
//本地预览
Vue.directive('highlight',function (el) {
  let blocks = el.querySelectorAll('pre code');
  blocks.forEach((block)=>{
  hljs.highlightBlock(block)
  })
})

 var vm = new Vue({
      el: '#app',
      data: function() {
         return {
        currentPage: 1,
        content:'',
        previeWFlag:false,
        page:0,
        totalPages:-1,
        size:null,
        clawerFlag:false,
        title:"我是正在爬取的文章",
        spiderTableData:[
      //  {
      //   "paperType": "Web开发",
      //   "title": "VS2005自定义ActiveX控件在asp.net中应用方法",
      //   "loveNum": "35",
      //   "href": "http://www.mamicode.com/info-detail-2250793.html",
      //   "author": "jackieli",
      //   "originTime": "2018-04-09 14:52:45",
      //   "contentPre": "原文地址：http://www.cnblogs.com/zhf/archive/2009/03/02/1401299.html 开发环境为VS 2005, .NET framework 2.0 文件—>新建—>项目 弹出下面对话框 选择Windows 控件库 输入名称TestControl 点击“确 ...",
      //   "id": "2250793",
      //   "content": "<p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p><p>1</p>"
      // }


        ]

      }
      },
       created: function() {
         socket.on('getData', function(data) {
          console.log(data)
          this.title = data.spiderDataNowTitle.title
          this.spiderTableData = data.spiderDataPages
          this.page = data.page
          this.totalPages = data.spiderDataPages.length
        }.bind(this));
      },
     methods: {
      lookPage(index, row) {
        this.content = row.content;
        this.previeWFlag = !this.previeWFlag

        // this.$alert(row.content, {
        //   dangerouslyUseHTMLString: true
        // });
      },
      previeWFlagDone(){
       this.previeWFlag = !this.previeWFlag
      },
      goToPage(index, row) {
       window.open(row.href);   
      },
    // changePage(page) {
    //   this.currentPage = page
    //   this.splitTableData = this.tableData.slice((page - 1) * 5, page * 5)
    // },
      handleSizeChange(val) {
        console.log(`每页 ${val} 条`);
      },
      handleCurrentChange(val) {
        console.log(`当前页: ${val}`);

          // this.currentPage = page
          // this.splitTableData = this.tableData.slice((page - 1) * 5, page * 5)
      },
      open: function() {
          this.clawerFlag = true
          socket.emit('openTimer', true);
      },
      clock: function() {
          this.clawerFlag = false
          socket.emit('clockTimer', false);
      }
    
    }
    })