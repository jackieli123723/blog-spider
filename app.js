// require Express and Socket.io
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const config = require('./config.js');

const request = require('superagent');
const cheerio = require('cheerio');
const Promise = require('bluebird');
const fs = require('fs');
var argv = require('yargs').argv;
const db = require('./db');

// node app.js -c 1 -s 0.5 -i 30
// 
//node app.js -c 17 -s 0.5 -i 3 -p 150

//$(".marginright20 .width100bi").length

const concurrency = parseInt(argv.c || 1); // 并发数默认为1
const interval = (argv.i ? argv.i * 1000 : 30 * 1000); //刷新频率默认30秒
const sleepTime = (argv.s ? argv.s * 1000 : 0.5 * 1000); // 并发间隔时间

let hasSpiderTitle;

let spider = {
  spiderDataNowTitle:"",
  spiderDataPages:[],
  page:1
}

process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging, throwing an error, or other logic here
});

process.on("uncaughtException", function(e) {
  console.log(e);
});

let running = false;

//分页抓取
let page = parseInt(argv.p || 1); // 爬虫起页
let total;
let startTime = Date.now(); //爬虫开始时间
let runFn = () => {
    if (!running) {
        run()
            .catch(err => {
                console.error(err);
            });
    }
};


async function run() {
    running = true;
    if(page>total){
        console.log('------文章爬完了，我该休息了！！！！------')
        let endTime = Date.now();
        console.log('文章爬完共用时：' + (endTime - startTime) / 1000 + '秒。');
        process.exit();
        return 
    }
    console.log('取首页文章列表。');
    let items = await getMainPageItems();
    items.map(item => {
        item.id = item.href.replace(/\D/g, ''); 
        return item;
    });

    let currentIds = items.map(item => item.id);
    console.log(`首页有 ${currentIds.length}篇文章。`);

    console.log('从数据库判断文章是否已经存在。');
    let existIds = await queryExistId(currentIds);
    items = items.filter((item) => existIds.indexOf(item.id) === -1);
    console.log('格式好的数据；',JSON.stringify(items, null, 2))

    if (items.length > 0) {
        console.log(`开始抓取 ${items.length}篇文章。`);
    } else {
        console.log(`文章都已经存在，没有新的文章。`);
    }

    Promise.map(items, (item) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                getUrlContent(item.href).then((content) => {
                    resolve();
                    console.log(`已抓取：${item.title}`)
                    item.content = content;
                    //实时通信放在这里
                    spider.spiderDataNowTitle = item
                    spider.spiderDataPages.push(item)

                    console.log('当前正在抓的数据',JSON.stringify(item, null, 2))
                    // console.log(item)
                    saveItemToDb(item);
                });
            }, sleepTime);
        });
    }, {
        concurrency
    }).then(() => {
        console.log('done! （等待程序自动刷新）');
        page++
        spider.page = page
        console.log('正在爬取第'+page+'页');
        running = false;
    }).catch((err) => {
        console.error(err);
        running = false;
    });
}



// 检查数据库中是否已经存在
async function queryExistId(ids) {
    const conn = await db;
    return new Promise((resolve, reject) => {
        conn.query(`SELECT originId FROM mall_mamicode WHERE originId IN(?)`, [ids], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows.map(row => row.originId));
        });
    });
}

// 保存到数据库()
// UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 15): Error: ER_WRONG_VALUE_COUNT_ON_ROW
// : Column count doesn't match value count at row 1

// 以上报错是因为VALUES ？不对应参数个数
async function saveItemToDb(item) {
    const conn = await db;
    await new Promise((resolve, reject) => {
        conn.query(`INSERT INTO mall_mamicode (paperType,author,loveNum,title, href, contentPre,content, originTime, originId) 
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`, [item.paperType, item.author,item.loveNum,item.title, item.href,item.contentPre, item.content, item.originTime, item.id], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
    });
}



// 新闻列表
async function getMainPageItems() {
    let res = await request.get('http://www.mamicode.com/info-list-2-'+page+'.html')
    let $ = cheerio.load(res.text, {decodeEntities: false});
    total = $('#lblpage a').last().prev().text(); //总页数
    let items = []; 
    $('.marginright20 .width100bi').each((idx,  ele) => {
        let $item = $(ele),
            $loveNum = $item.find('.colorHong').eq(1).text(),
            $title = $item.find('.listtitle').attr('title'),
            $href = 'http://www.mamicode.com'+$item.find('.listtitle').attr('href'),
            $originTime = $item.find('.colorlan').text(),
            $contentPre = $item.find('.listzhaiyao').text().trim()


        items.push({
            paperType: 'Web开发',
            title: $title,
            loveNum:$loveNum,
            href: $href,
            author:'jackieli',
            originTime:$originTime,
            contentPre:$contentPre
        });
    });
    return items;
}

// 新闻内容
async function getUrlContent(url) {
   let res = await request(url);
   let $ = cheerio.load(res.text, {decodeEntities: false});
   let $mainDiv = $('#Label3');
   $mainDiv.children("p:first-child").remove();
   $mainDiv.children("p:last-child").remove();
   return $mainDiv.html();
}


let socketClawerFlag = false 
let timer1 //外层爬虫
let timer2 //socket通信爬虫



//启动爬虫
if(socketClawerFlag){
  timer1=setInterval(runFn,interval)
}else{
  clearInterval(timer1); 
}




app.set('port', (process.env.PORT || 5000));
app.use(express.static(path.join(__dirname, 'public/')));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'views/spider.html'));
});

io.on('connection', function(socket) {
   //定时器来爬取socket。io通信
   //不用条件判断的时候轮询 
    // setInterval(function(){
    //  io.emit('getData',trList);
    //  }, 100);
 
  socket.on('openTimer', function(data) {
    socketClawerFlag = data
    console.log('socketClawerFlag开启',data)

    timer2 = setInterval(function(){
      //必须调用这个方法否则 不能拿到数据
      runFn();
      io.emit('getData',spider);
     }, 1000);
  });

  socket.on('clockTimer', function(data) {
    socketClawerFlag = data
    console.log('socketClawerFlag关闭',data)
    clearInterval(timer2); 
  });

  io.on('disconnect', function () {
    console.log('A user disconnected');
  });

});

http.listen(app.get('port'), function() {
  console.log('listening on *:' + app.get('port'));
});
