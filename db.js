const mysql = require('mysql');
// const cfg = require('./config');

// 只需要保持一个连接
// var conn = mysql.createConnection(cfg.mysqlConnStr);

 var conn = mysql.createConnection({
        host: '127.0.0.1',
        password: '',
        database: 'node-blog-crawer-mamicode'
 });


//way1
// If the Node process ends, close the Mongoose connection （效果不怎么好可以删除 看mysql版本的api）
// process.on( 'SIGINT', function() {  
//     conn.end( function ( err ) {
//         console.log( 'MySQL connection disconnected through app termination' );
//         process.exit( 0 ) ; 
//     } ); 
// } );
// 

//报错(内存泄露 导致了这个错误 用way2 的方式 就ok)
//spider3 > (node:30211) [DEP0096] DeprecationWarning: timers.unenroll() is deprecated. Please use clearTimeout instead.  


//推荐使用这个 pm2 内存占用低 cpu使用也较低 这个是内存泄漏最好的补救
//way2
// If the Node process ends, close the Mongoose connection （没有效果可以删除 看mysql版本的api）
process.on('SIGINT', () => { 
      const cleanUp = () => {
         conn.end(console.error);
         process.exit( 0 ) ; 
      };

      server.close(() => {
        // Stop after 10 secs
        setTimeout(() => {
          cleanUp();
          process.exit();
        }, 10000);
      });

      // Force close server after 15 secs
      setTimeout((e) => {
        console.log('Forcing server close !!!', e);
        cleanUp();
        process.exit(1);
      }, 15000);

});

process.on( 'SIGINT', function(){
    console.log( 'gracefully shutting down :)' );
    conn.end();
    process.exit();
});


module.exports = new Promise((resolve, reject) => {
    conn.connect((err) => {
        if (err) {
            console.error('mysql 连接出现错误：', err);
            reject(err);
        }
        resolve(conn);
    });
});