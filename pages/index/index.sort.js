//index.js
var app = getApp();
const now = new Date();
Page({
  data: {
    scrollTop: 0,
    scrollHeight: 0,
    winWidth: 0,
    winHeight: 0,
    matchStat: "已发布",
    matchCount: 0,
    matchJudge: 0,
    matchIds: [],
    animationPer: {},
    page: 1,
    pageSize: 2,
    totalPage: 1,
    listsort: 0, //排序（0:按赛程，1:按联赛）
    date: "",
    list: [],
    filter: [],
    currentTab: 0,
    moreText: "",
    moreClass: "",
    moreLock: false,
    searchBack: false,
    coverHidden: true,
    filterHidden: true,
    calendarHidden: true,
    filterConfirm: false,
    hasEmptyGrid: false,
    weeks_ch: ['日', '一', '二', '三', '四', '五', '六'],
    cur_year: now.getFullYear(),
    cur_month: now.getMonth() + 1,
    thisYear: now.getFullYear(),
    thisMonth: now.getMonth() + 1,
    thisDay: now.getDate()
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          scrollViewHeight: res.windowHeight - 130*res.windowWidth / 750,
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });
    that.getInfo();
  },
  onReady: function () {
    // 页面渲染完成
  },
  onShow: function () {
    // 页面显示
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  },
  getInfo: function () {
    var that = this;
    wx.showToast({
      title: '加载中...',
      icon: 'loading',
      duration: 10000
    });
    wx.request({
      url: "http://192.168.2.158:8024/index.html",
      data: {
        date: that.data.thisYear + "-" + that.data.thisMonth + "-" + that.data.thisDay
      },
      header: {
        "Content-Type": "application/json"
      },
      method: "GET",
      fail: function(){        
        wx.hideToast();
        wx.showModal({
          title: '提示',
          content: '数据源错误，请重新加载！',
          showCancel: false,
          //cancelText: '取消',
          //cancelColor: '#000000',
          //confirmText: '确定',
          //confirmColor: '#3CC51F',
          //fail: function(res){},
          //complete: function(res){},
          success: function (res) {
            if (res.confirm) {
              that.setData({
                moreText: "请点击页面重新加载！",
                moreClass: "moreRefresh"
              });
            }
          }
        });
      },
      //complete: function(res){},
      success: function (res) {
        wx.hideToast();
        if (!res.data.hasOwnProperty("Info") || res.data.Info === "") {
          wx.showModal({
            title: '提示',
            content: '数据错误，请重新加载！',
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                that.setData({
                  moreText: "请点击页面重新加载！",
                  moreClass: "moreRefresh"
                });
              }
            }
          });
        } else {
          //console.log(res.data.Info);
          var Info = res.data.Info;
          var matchJudge = Info.hasOwnProperty("JudgeRightRate") && !isNaN(Info.JudgeRightRate) ? parseFloat(Info.JudgeRightRate).toFixed(1) : 0;
          var matchIds = Info.hasOwnProperty("MatchIds") ? Info.MatchIds : "";
          var matchCount = Info.hasOwnProperty("ItemsCount") ? Info.ItemsCount : 0;
          that.animationPer = wx.createAnimation({
            duration: 1000,
            timingFunction: 'linear',
            delay: 500,
            transformOrigin: '0% 50%',
            success: function (res) {
              console.log(res)
            }
          });
          that.animationPer.width(matchJudge + "%").step();
          that.setData({
            matchCount: matchCount,
            matchJudge: matchJudge,
            matchIds: matchIds.split(','),
            animationPer: that.animationPer.export()
          });
          if (matchIds == "") {
            wx.showModal({
              title: '提示',
              content: '暂无比赛，请稍后重试！',
              showCancel: false,
              success: function (res) {
                if (res.confirm) {
                  that.setData({
                    moreText: "请点击页面重新加载！",
                    moreClass: "moreRefresh"
                  });
                }
              }
            });
          } else {
            var aMatchIds = that.data.matchIds;
            var pageSize = that.data.pageSize;
            var totalCount = aMatchIds.length;
            var totalPage = parseInt(totalCount / pageSize);
            if (totalCount % pageSize != 0) totalPage = totalPage + 1;
            that.setData({
              moreClass: "moreHidden",
              totalPage: totalPage
            });
            that.getList(
              aMatchIds.splice(0, pageSize).join(','),
              that.data.date,
              function () {
                that.setData({
                  moreLock: false,
                  moreText: "已加载第" + that.data.page + "页，点击加载更多！",
                  moreClass: "morePage"
                });
              },
              function () {
                that.setData({
                  moreLock: false,
                  moreText: "加载第" + that.data.page + "页失败，点击重新加载！",
                  moreClass: "morePage",
                  page: that.data.page - 1
                });
              }
            );
          }
        }
      }
    });
  },
  getList: function (matchids, date, done, err) {
    var that = this;
    that.setData({
      moreLock: true,
      hidden: false
    });
    wx.request({
      url: "http://192.168.2.158:8024/list.asp",
      data: {
        matchids: matchids,
        date: date
      },
      header: {
        "Content-Type": "application/json"
      },
      method: "GET",
      fail: function () {
        if (err) err();
      },
      success: function (res) {
        if (!res.data.hasOwnProperty("List") || res.data.List.length == 0) {
          if (err) err();

        } else {
          //console.log(res.data.List);
          var list = that.data.page > 1 ? that.data.list.concat(res.data.List) : res.data.List;
          if (that.data.listsort == 0) {
            list.sort(function (a, b) {
              return a.MatchId - b.MatchId;
            });
          } else {
            list.sort(function (a, b) {
              if (a.LeagueId === b.LeagueId) {
                return a.MatchId - b.MatchId;
              } else {
                return a.LeagueId - b.LeagueId;
              }
            });
          }
          var filter = that.data.filter;
          for (var i = 0; i < list.length; i++) {
            var include = false;
            for (var j = 0; j < filter.length; j++) {
              if (list[i].LeagueId == filter[j].lid) {
                list[i].hidden = filter[j].hover == "hover" ? "" : "true";
                include = true;
                break;
              }
            }
            if (include) continue;
            filter.push({
              lid: list[i].LeagueId,
              name: list[i].LeagueName,
              hover: "hover"
            });
          }
          filter.sort(function (a, b) {
            return a.lid - b.lid;
          });
          that.setData({
            list: list,
            filter: filter,
            hidden: true
          });
          if(done) done();
        }
      }
    });
  },
  refesh: function (e) {
    var that = this;
    that.setData({
      searchBack: false,
      page: 1
    });
    that.getInfo();
  },
  loadMore: function (e) {
    var that = this;
    if (that.data.totalPage < that.data.page + 1) {
      that.setData({
        moreText: "已全部加载！",
        moreClass: "morePage"
      });
      return;
    }
    if (that.data.moreLock) {
      that.setData({
        moreText: "请等待上页加载完成！",
        moreClass: "morePage"
      });
      return;
    }
    that.setData({
      page: that.data.page + 1
    });
    that.getList(
      that.data.matchIds.splice(0, that.data.pageSize).join(','),
      that.data.date,
      function () {
        that.setData({
          moreLock: false,
          moreText: "已加载第" + that.data.page + "页，点击加载更多！",
          moreClass: "morePage"
        });
      },
      function () {
        that.setData({
          moreLock: false,
          moreText: "加载第" + that.data.page + "页失败，点击重新加载！",
          moreClass: "morePage",
          page: that.data.page - 1
        });
      }
    );
  },
  scroll: function (e) {
    var that = this;
    that.setData({
      scrollTop: e.detail.scrollTop
    });
  },
  showCover: function (tab, stat, id) {
    var that = this;
    if (tab == "filter") {
      that.setData({
        coverHidden: !stat,
        filterHidden: !stat,
        calendarHidden: stat,
        currentTab: stat ? id : that.data.listsort
      });
    } else {
      that.setData({
        coverHidden: !stat,
        filterHidden: stat,
        calendarHidden: !stat,
        currentTab: stat ? id : that.data.listsort,
        searchBack: true,
        filter: []
      });
      that.calculateEmptyGrids(that.data.cur_year, that.data.cur_month);
      that.calculateDays(that.data.cur_year, that.data.cur_month);
    }
  },
  bindListTap: function (e) {
    console.log(e.currentTarget.dataset.listsort);
  },
  bindMoreTap: function (e) {
    var that = this;
    if(that.data.moreClass=="moreRefresh"){
      that.refesh(e);
    }else{
      that.loadMore(e);
    }
  },
  bindFilterTap: function (e) {
    var filterId = e.currentTarget.dataset.lid;
    if (filterId == null) return;
    var that = this;
    var filter = that.data.filter;
    for (var i = 0; i < filter.length; i++) {
      if (filterId === filter[i].lid) {
        filter[i].hover = filter[i].hover == "hover" ? "" : "hover";
        that.setData({
          filter: filter,
          filterConfirm: true
        });
      }
    }
  },
  bindFilterConfirm: function (e) {
    var that = this;
    that.showCover("filter", false, null);
    if (!that.data.filterConfirm) return;
    var list = that.data.list;
    var filter = that.data.filter;
    for (var i = 0; i < list.length; i++) {
      for (var j = 0; j < filter.length; j++) {
        if (list[i].LeagueId == filter[j].lid) {
          list[i].hidden = filter[j].hover == "hover" ? "" : "true";
        }
      }
    }
    that.setData({
      list: list
    });
  },
  bindDateSelect: function (e) {
    var that = this;
    wx.showActionSheet({
      itemList: ['A', 'B', 'C'],
      success: function (res) {
        if (!res.cancel) {
          console.log(res.tapIndex)
        }
      }
    });
  },
  swichNav: function (e) {
    wx.hideToast();
    var that = this;
    var navId = e.target.dataset.id;
    if (that.data.currentTab === e.target.dataset.id) {
      return false;
    } else {
      switch (navId) {
        case "0":
        case "1":
          if (that.data.searchBack) {
            that.setData({
              page: 1,
              listsort: navId,
              coverHidden: true,
              filterHidden: true,
              calendarHidden: true,
              currentTab: navId
            });
            that.refesh(e);
            return;
          }
          var list = that.data.list;
          if (navId == "0") {
            list.sort(function (a, b) {
              return a.MatchId - b.MatchId;
            });
          } else {
            list.sort(function (a, b) {
              if (a.LeagueId === b.LeagueId) {
                return a.MatchId - b.MatchId;
              } else {
                return a.LeagueId - b.LeagueId;
              }
            });
          }
          that.setData({
            list: list,
            listsort: navId,
            coverHidden: true,
            filterHidden: true,
            calendarHidden: true,
            currentTab: navId
          });
          break;
        case "2":
          that.showCover("filter", true, e.target.dataset.id);
          break;
        case "3":
          that.showCover("calendar", true, e.target.dataset.id);
          break;
      }
    }
  },
  getThisMonthDays: function (year, month) {
    return new Date(year, month, 0).getDate();
  },
  getFirstDayOfWeek: function (year, month) {
    return new Date(Date.UTC(year, month - 1, 1)).getDay();
  },
  calculateEmptyGrids: function (year, month) {
    const firstDayOfWeek = this.getFirstDayOfWeek(year, month);
    let empytGrids = [];
    if (firstDayOfWeek > 0) {
      for (let i = 0; i < firstDayOfWeek; i++) {
        empytGrids.push(i);
      }
      this.setData({
        hasEmptyGrid: true,
        empytGrids
      });
    } else {
      this.setData({
        hasEmptyGrid: false,
        empytGrids: []
      });
    }
  },
  calculateDays: function (year, month) {
    let days = [];
    const thisMonthDays = this.getThisMonthDays(year, month);

    for (let i = 1; i <= thisMonthDays; i++) {
      days.push(i);
    }

    this.setData({ days });
  },
  handleCalendar: function (e) {
    const handle = e.currentTarget.dataset.handle;
    const cur_year = this.data.cur_year;
    const cur_month = this.data.cur_month;
    if (handle === 'prev') {
      let newMonth = cur_month - 1;
      let newYear = cur_year;
      if (newMonth < 1) {
        newYear = cur_year - 1;
        newMonth = 12;
      }

      this.calculateDays(newYear, newMonth);
      this.calculateEmptyGrids(newYear, newMonth);

      this.setData({
        cur_year: newYear,
        cur_month: newMonth
      })

    } else {
      let newMonth = cur_month + 1;
      let newYear = cur_year;
      if (newMonth > 12) {
        newYear = cur_year + 1;
        newMonth = 1;
      }

      this.calculateDays(newYear, newMonth);
      this.calculateEmptyGrids(newYear, newMonth);

      this.setData({
        cur_year: newYear,
        cur_month: newMonth
      })
    }
  },
  onShareAppMessage: function () {
    return {
      title: '足彩快报',
      desc: '足彩大数据分析',
      path: 'pages/index/index'
    };
  }
});