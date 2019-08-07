# mini_bluetooth_print
##微信小程序蓝牙打印

----------


#### 介绍

> 由于项目有微信小程序通过蓝牙打印机打印小票的需求，因此有了这个demo。第一次做这类相关的操作，在此做个记录。
        

#### 实现的功能
1. 基本的蓝牙打印机的连接
2. 打印文字以及使用ESC/POS命令操作打印机(虽然不是很熟悉)
3. 打印二维码

#### 参考资料
1. [微信小程序蓝牙通信官方API](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.writeBLECharacteristicValue.html)
2. 官方文档后最先参考的便是这位兄弟的代码和文档，实现了与蓝牙设备的通信 [https://github.com/lixiantai/BLE_MiniProgram](https://github.com/lixiantai/BLE_MiniProgram)
3. 通过蓝牙打印机打印指定格式的内容,在这里学习了对ESC/POS命令的使用 [https://github.com/benioZhang/miniprogram-bluetoothprinter](https://github.com/benioZhang/miniprogram-bluetoothprinter)
4. [ESC(POS)打印控制命令](http://www.xmjjdz.com/downloads/manual/cn/ESC(POS)%E6%89%93%E5%8D%B0%E6%8E%A7%E5%88%B6%E5%91%BD%E4%BB%A4.pdf)
5. 打印二维码资料参考，写的很详细 [https://blog.csdn.net/cfujiC/article/details/86013122#commentsedit](https://blog.csdn.net/cfujiC/article/details/86013122#commentsedit)
6. 小程序绘制二维码插件
    - [weapp.qrcode.js](https://github.com/yingye/weapp-qrcode) 使用canvas绘制
    - [weapp-qrcode-base64](https://github.com/Pudon/weapp-qrcode-base64) 使用纯base64绘制，不依赖canvas
7. 打印光栅位图的参考,二维码就是以这种形式打印出来的,对我来说有点深奥,需要多读几遍[https://www.jianshu.com/p/dd6ca0054298](https://www.jianshu.com/p/dd6ca0054298)


#### 总结

1. 基本流程：初始化蓝牙设备 -> 搜索(在此之前监听蓝牙搜寻) -> 结束搜索 -> 连接蓝牙设备 -> 获取设备服务 -> 获取设备服务相关的特征值 -> 写入二进制数据
2. 需要蓝牙设备特征值支持write的特征值才可以写入数据，而设备可能会有许多服务，每个服务有很多特征值，需要一层一层的验证，直到获取到支持write的特征值
3. 向蓝牙设备写入的数据为ArrayBuffer类型（敲黑板）
4. 根据[官方文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.writeBLECharacteristicValue.html),写入数据一次建议不超过20字节，需要对要打印的数据进行分包处理，并延时多次调用
5. 打印光栅位图的指令

     ASCII码    GS  v   0    m  xL  xH  yL  yH  d1...dk
     十进制码    29  118  48  m  xL  xH  yL  yH  d1...dk

    其中 xL, xH, yL, yH需要根据要打印的位图宽高计算而出，否则会出现乱码或模糊的情况,参考[https://www.jianshu.com/p/dd6ca0054298](https://www.jianshu.com/p/dd6ca0054298)
6. 监听搜索到的设备在iOS需要做去重处理,由于之前是用安卓设备写的，没有留意到这个问题,现补充
