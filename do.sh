#!/usr/bin/expect

spawn node_modules/.bin/gulp

spawn scp -r tcp-server root@47.106.193.158:/root/tcp-tmp
expect {
  eof {
    puts "上传成功"
  }
  timeout {
    puts "***上传失败***"
    exit 2
  }
}
spawn ssh root@47.106.193.158
send "cd /root \r"
send "rm -rf tcp-server \r"
send "mv ./tcp-tmp tcp-server \r"
send "cd tcp-server \r"
send "npm install \r"
send "pm2 reload all \r"

interact
