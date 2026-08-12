const WORKS_URL = 'https://cdn.jsdelivr.net/gh/Cclvc/PEType@main/works.json';
const FALLBACK_URL = 'https://raw.githubusercontent.com/Cclvc/PEType/main/works.json';

Page({
  data: {
    works: [],
    filtered: [],
    mainCat: 'all',
    subCat: 'all',
    loading: true,
    error: ''
  },

  onLoad: function () {
    this.loadWorks();
  },

  onShow: function () {
    // 从详情页返回时保持筛选状态
  },

  loadWorks: function () {
    const self = this;
    this.setData({ loading: true, error: '' });
    const tryLoad = (url) => {
      wx.request({
        url: url + '?t=' + Date.now(),
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200 && Array.isArray(res.data)) {
            self.setData({ works: res.data, loading: false });
            self.applyFilter();
          } else {
            self.tryNext(url);
          }
        },
        fail: () => {
          self.tryNext(url);
        }
      });
    };
    this.tryNext = (url) => {
      if (url === WORKS_URL) {
        tryLoad(FALLBACK_URL);
      } else {
        self.setData({ loading: false, error: '作品加载失败，请检查网络后重试' });
      }
    };
    tryLoad(WORKS_URL);
  },

  applyFilter: function () {
    const mainCat = this.data.mainCat;
    const subCat = this.data.subCat;
    const filtered = this.data.works.filter((w) => {
      if (mainCat !== 'all' && w.mainCat !== mainCat) return false;
      if (subCat !== 'all' && w.subCat !== subCat) return false;
      return true;
    });
    this.setData({ filtered });
  },

  setMainCat: function (e) {
    this.setData({ mainCat: e.currentTarget.dataset.cat });
    this.applyFilter();
  },

  setSubCat: function (e) {
    this.setData({ subCat: e.currentTarget.dataset.cat });
    this.applyFilter();
  },

  onTapWork: function (e) {
    const idx = e.currentTarget.dataset.idx;
    const work = this.data.filtered[idx];
    if (!work) return;
    wx.setStorageSync('detailWork', work);
    wx.navigateTo({ url: '/pages/detail/detail' });
  },

  onShareAppMessage: function () {
    return {
      title: 'PEType 人宠摄影作品集',
      path: '/pages/index/index'
    };
  }
});
