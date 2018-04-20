//引入爬虫
var request = require('superagent');
var cheerio = require('cheerio');
var page = 3
// var url = "http://www.cdfgj.gov.cn/Consultative/Default.aspx?"+'__EVENTTARGET=ID_ucDefault'+'$ucConsultativeList1'+'$UcPager1'+'$btnPage'+page

var url = `http://www.cdfgj.gov.cn/Consultative/Default.aspx?__EVENTTARGET=ID_ucDefault$ucConsultativeList1$UcPager1$btnPage`+`${page}`

let trList = []
var params = {
  '__EVENTTARGET':'ID_ucDefault'+'$'+'ucConsultativeList1'+'$'+'UcPager1'+'$'+'btnPage'+page
}


function go(){
  return request
            .get(url)
            // .send(params)
            .end((err, res) => {
                if (!err && res.statusCode == 200) {
                  let $ = cheerio.load(res.text, {decodeEntities: false});
                  let total = $('#ID_ucDefault_ucConsultativeList1_UcPager1_spanRecordCount').text(); //总数据条数
                  let pages = $('#ID_ucDefault_ucConsultativeList1_UcPager1_lbPageCount').text(); //分页总数

                  //过滤表头
                  $('#ID_ucDefault_ucConsultativeList1_gridView >tbody>tr:not(.boxHeader)').each((i, tr) => {
                       let tdList = [];
                       $(tr).find('td').each((j, td) => {
                             tdList.push(($(td).text()).replace(/(\r\n)|(\n)/g,'').replace(/^\s+|\s+$/g, '')); //js 正则  \n 替换 和替换空格
                       });
                       trList.push(tdList);
                   });
                  console.log('格式化数据', trList)
                }
            })
}

console.log('爬取地址:',url)

go()

//启动爬虫
// setInterval(go,300)
