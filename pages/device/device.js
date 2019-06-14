// pages/bluetooth_work/bluetooth_work.js
const PrinterJobs = require('../../printer/printerjobs');
const printerUtil = require('../../printer/printerutil');
import drawQrcode from '../../utils/weapp.qrcode.min.js';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    device: {
      name: '',
      deviceId: '',
      RSSI: '',
      eqData: ''
    }, //蓝牙设备信息
    write_text: '从前有座山里有座庙', //写入信息
    serviceId: '', //服务ID
    characteristicId: '', //蓝牙设备特征值ID
    canWrite:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 获取已存储的设备信息
    wx.getStorage({
      key: 'device_info',
      success: res => {
        let {
          name,
          deviceId,
          RSSI
          } = res.data;
        this.setData({
              device: {
                name,
                deviceId,
                RSSI
              }
            })
      },
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    let deviceId = this.data.device.deviceId || '';
    let serviceId;
    // 获取蓝牙服务及蓝牙特征值
    console.log('获取设备服务');
    this.getBLEDeviceServices(deviceId)

    /**生成二维码 */
    this.buildQrCode({
      width:200,
      height:200,
      text:'哎呀妈呀脑瓜疼',
      canvasId:"myQrcode"
    })

  },

  /**获取蓝牙服务 */
  getBLEDeviceServices(deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        console.log('getBLEDeviceServices', res)
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) {
            this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
          }
          console.log(this.data.canWrite)
            if(this.data.canWrite){
              break;
            }
        }
      },
      fail:err=>{
        wx.showToast({
          title: '获取服务失败'+ err.errCode,
          icon:'none'
        })
        console.log(err)
      }
    })
  }, 
  
  /**获取蓝牙服务特征值 */
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics success', res.characteristics)
        for (let i = 0; i < res.characteristics.length; i++) {
          const item = res.characteristics[i]
          if (item.properties.write) {
            this.setData({
              canWrite: true,
              serviceId: serviceId,
              characteristicId: item.uuid
            })
            console.log('serviceID:' + this.data.serviceId + ' characteristicId:' + this.data.characteristicId)
            break;
          }
        }
      },
      fail: err => {
        wx.showToast({
          title: '获取特征值失败' + err.errCode,
          icon: 'none'
        })
        console.log(err)
      }
    })
  },

  /**生成二维码 */
  buildQrCode(op){
    drawQrcode({
      width: op.width,
      height: op.height,
      canvasId: op.canvasId,
      text: op.text,
      callback: () => {
        // 用来描述 canvas 区域隐含的像素数据
        wx.canvasGetImageData({
          canvasId: op.canvasId,
          x: 0,
          y: 0,
          width: 200,
          height: 200,
          success: res => {
            // 组成二维码的像素点
            let arr = [],
              data_len = res.data.length;
            // 4合1(将其中每四项合为一个数组 当rule>200的时候，值取0，表示不打印，否则取1，表示打印；)
            for (var i = 0; i < data_len; i++) {
              if (i % 4 == 0) {
                let rule = 0.29900 * res.data[i] + 0.58700 * res.data[i + 1] + 0.11400 * res.data[i + 2];
                if (rule > 200) {
                  res.data[i] = 0;
                } else {
                  res.data[i] = 1;
                }
                arr.push(res.data[i]);
              }
            }
            // 8合1(每8个像素点组成一个字节)
            let result = [],
              arr_len = arr.length;
            for (let k = 0; k < arr_len; k += 8) {
              let temp = arr[k] * 128 + arr[k + 1] * 64 + arr[k + 2] * 32 + arr[k + 3] * 16 + arr[k + 4] * 8 +                      arr[k + 5] * 4 + arr[k + 6] * 2 + arr[k + 7] * 1
              result.push(temp);
            }
            //最后的结果
            this.setData({
              eqData: result
            })
          }
        })
      }
    })
  },


  /**发送数据 */
  sendHand() {
    let data = this.data.eqData;
    let printerJobs = new PrinterJobs();
    printerJobs.setBold(true)
      .println('打印加粗的文字')
      .setBold(false)
      .qrcode(data, 200,200)
      .println()
      .println(new Date())

    let bufferstr = printerJobs.buffer();
    console.log(bufferstr)

    // 1.并行调用多次会存在写失败的可能性
    // 2.建议每次写入不超过20字节
    // 分包处理，延时调用
    const maxChunk = 20;
    const delay = 20;
    for (let i = 0, j = 0, length = bufferstr.byteLength; i < length; i += maxChunk, j++) {
      let subPackage = bufferstr.slice(i, i + maxChunk <= length ? (i + maxChunk) : length);
      setTimeout(this._writeBLECharacteristicValue, j * delay, subPackage);
    }
  },

  /**写入数据 */
  _writeBLECharacteristicValue(bufferstr) {
    wx.writeBLECharacteristicValue({
      deviceId: this.data.device.deviceId,
      serviceId: this.data.serviceId,
      characteristicId: this.data.characteristicId,
      value: bufferstr,
      success: res => {
        console.log('写入成功',res)
      },
      fail: err => {
        wx.showToast({
          title: '写入失败' + err.errCode,
          icon: 'none'
        })
        console.log(err)
      }
    })
  }
})