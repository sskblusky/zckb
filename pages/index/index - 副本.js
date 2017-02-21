//index.js
var app = getApp();
const now = new Date();
Page({
  data: {
    scrollTop: 0,
    scrollHeight: 0,
    winWidth: 0,
    winHeight: 0,
    page: 1,
    listsort: 0, //排序（0:按赛程，1:按联赛）
    date: now,
    list: [],
    filter: [],
    currentTab: 0,
    searchBack: false,
    coverHidden: true,
    filterHidden: true,
    calendarHidden: true,
    filterConfirm: false,
    hasEmptyGrid: false,
    weeks_ch: ['日', '一', '二', '三', '四', '五', '六'],
    cur_year: now.getFullYear(),
    cur_month: now.getMonth() + 1
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          scrollViewHeight: res.windowHeight - 130 / res.pixelRatio,
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });
    that.getList();
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
  getList: function () {
    var that = this;
    that.setData({
      hidden: false
    });
    wx.request({
      url: "https://192.168.2.158/list.asp",
      data: {
        page_size: 4,
        page: that.data.page,
        date: that.data.date
      },
      header: {
        "Content-Type": "application/json"
      },
      method: "GET",
      success: function (res) {
        //console.log(res.data.list);
        console.log(that.data.page);
        var list = that.data.page > 1 ? that.data.list.concat(res.data.List) : res.data.List;
        if(that.data.listsort==0){
          list.sort(function (a, b) {
            return a.MatchId - b.MatchId;
          });
        }else{
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
          var include=false;
          for (var j = 0; j < filter.length; j++) {
            if (list[i].LeagueId == filter[j].lid){
              list[i].hidden = filter[j].hover == "hover" ? "" : "true";
              include=true;
              break;
            }
          }
          if(include) continue;
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
      }
    });
  },
  refesh: function (e) {
    var that = this;
    that.setData({
      page: 1
    });
    that.getList();
  },
  loadMore: function (e) {
    var that = this;
    that.setData({
      page: that.data.page+1
    });
    that.getList();
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
        filter:[]
      });
      that.calculateEmptyGrids(that.data.cur_year, that.data.cur_month);
      that.calculateDays(that.data.cur_year, that.data.cur_month);
    }
  },
  bindListTap: function (e) {
    console.log(e.currentTarget.dataset.listsort);
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
        if (list[i].LeagueId == filter[j].lid){
          list[i].hidden = filter[j].hover == "hover" ? "" : "true";
        }
      }
    }    
    that.setData({
      list: list
    });
  },
  swichNav: function (e) {
    var that = this;
    var navId = e.target.dataset.id;
    if (that.data.currentTab === e.target.dataset.id) {
      return false;
    } else {
      switch (navId) {
        case "0":
        case "1":
          if(that.data.searchBack){
            that.setData({
              page: 1,
              listsort: navId,
              coverHidden: true,
              filterHidden: true,
              calendarHidden: true,
              currentTab: navId
            });
            that.getList();
            return;
          }
          var list = that.data.list;
          if(navId=="0"){
            list.sort(function (a, b) {
              return a.MatchId - b.MatchId;
            });
          }else{
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