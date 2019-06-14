// pages/bluetooth/bluetooth.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    dev_list: [], //设备列表
    searchState: false // 搜索状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var app = getApp();
      var platform = app.getPlatform(), //客户端平台
      stystem = app.getSystem(), //操作系统版本
      version = app.getVersion(); //微信版本
    console.log({
      stystem,
      version,
      platform
    })

    // Android 从微信 6.5.7 开始支持，iOS 从微信 6.5.6 开始支持
    if (platform === "android" && !this.versionCompare(version, "6.5.7")){
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
      })
    } else if (platform === "ios" && !this.versionCompare(version, "6.5.6")){
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
      })
    }
  },
  /**版本比较
   * @target 当前版本
   * @expext 期望版本
   */
  versionCompare(target,expect){
    const targetArr = target.split('.');
    const expectArr = expect.split('.');
    const len = targetArr.length;
    for (var i = 0; i < len;i++){
      if (parseInt(targetArr[i]) > parseInt(expectArr[i]) ){
        console.log(`${targetArr[i]} > ${expectArr[i]}`)
          // 显然大于
          return true;
      } else if (parseInt(targetArr[i]) < parseInt(expectArr[i])){
        console.log(`${targetArr[i]} < ${expectArr[i]}`)
        // 显然小于
        return false;
      }
      // 版本相同
      if (i === len-1 && parseInt(targetArr[i]) === parseInt(expectArr[i]) ){
        console.log(`${targetArr[i]} = ${expectArr[i]}`)
        return true;
      }
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    // 初始化
    this.initBluetooth();
  },

  /**
   * 监听设备
   */
  watchSearchDev() {
    // 监听搜索到的蓝牙设备
    wx.onBluetoothDeviceFound((res) => {
      console.log(res)
      // 添加进设备列表中
      var dev_list = this.data.dev_list;
      dev_list.push(res.devices[0]);
      this.setData({
        dev_list
      })
    })
  },
  /**初始化模块 */
  initBluetooth() {
    // 初始化蓝牙模块
    wx.showLoading({
      title: '初始化蓝牙模块',
      mask: true
    })
    wx.openBluetoothAdapter({
      success: (res) => {
        wx.hideLoading();
        wx.showToast({
          title: "初始化成功"
        })
        console.log("初始化成功")
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: "初始化失败:" + err.errCode,
          icon: 'none'
        })
        console.log(err)
      }
    });
  },

  /**搜索蓝牙设备 */
  searchDev() {
    if (this.data.searchState) {
      return;
    }
    wx.startBluetoothDevicesDiscovery({
      success: () => {
        // 开启搜索监听
        this.watchSearchDev();
        wx.showLoading({
          title: '搜索中...',
        })
        // 记录搜索状态
        this.setData({
          searchState: true
        })

        // 20秒后结束搜索
        setTimeout(this.stopSearch, 5000)
        // this.stopSearch();
      },
      fail: err => {
        if (err.errCode === 10001) {
          wx.showModal({
            title: '错误',
            content: '未找到蓝牙设备,请打开蓝牙后重试',
            showCancel: false
          })
        } else {
          wx.showToast({
            title: '搜索失败:' + err.errCode,
            icon: 'none'
          })
        }
        console.log(err)
      }
    })

  },

  /**停止搜索 */
  stopSearch() {
    wx.stopBluetoothDevicesDiscovery({
      success: (res) => {
        wx.hideLoading();
        // 取消搜索状态
        this.setData({
          searchState: false
        })
      },
    })
  },

  /**连接该蓝牙设备 */
  linkDeviceHand(e) {
    console.log('连接设备')
    // 获取当前设备的uuid
    let index = e.currentTarget.dataset.index;
    let device_info = this.data.dev_list[index];
    let deviceId = device_info['deviceId'];
    wx.showLoading({
      title: '连接中...',
    })
    console.log('开始连接');
    wx.createBLEConnection({
      deviceId,
      success: res => {
        wx.hideLoading();
        wx.showToast({
          title: '连接成功',
        })
        console.log(res)
        // 存储已连接设备信息
        wx.setStorage({
          key: 'device_info',
          data: device_info,
          fail: err => {
            console.log(err)
          },
          complete: () => {
            // 跳转至连接详情页面
            wx.navigateTo({
              url: '/pages/device/device'
            })
          }
        })
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '连接失败:' + err.errCode,
          icon: 'none'
        })
        console.log(err)
      }
    })
  },

  /**断开蓝牙连接 */
  closeConnect(uuid) {
    wx.closeBLEConnection({
      deviceId: uuid,
      success: function(res) {
        console.log('断开连接');
      },
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    // 断开连接
    wx.getStorage({
      key: 'device_info',
      success: res => {
        let {
          name,
          deviceId,
          RSSI
        } = res.data;
        this.closeConnect(deviceId);
      },
    })
    // 关闭蓝牙模块
    wx.closeBluetoothAdapter({
      success: (res) => {
        console.log('蓝牙模块已关闭')
      },
    })
  },

})